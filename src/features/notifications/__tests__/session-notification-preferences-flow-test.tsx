import { useEffect, useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { SessionAccountScreen } from "@/features/session/screens/session-account-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { deferredResult } from "@/shared/testing/deferred-result";
import { SessionNotificationPreferencesScreen } from "../screens/session-notification-preferences-screen";
import type { SaveNotificationPreferencesResult } from "../domain/notification-preferences";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

function Flow({ direct }: { direct: boolean }) {
  const [path, setPath] = useState(
    direct ? "/notification-preferences" : "/account",
  );
  const { snapshot } = useMobileSession();
  useEffect(() => {
    jest.mocked(router.push).mockImplementation((next) => {
      setPath(String(next));
    });
    jest.mocked(router.replace).mockImplementation((next) => {
      setPath(String(next));
    });
  }, []);
  if (snapshot.status === "signedOut") return <SessionLoginController />;
  if (snapshot.status !== "active" || snapshot.session.nextAction !== "ready")
    return <Text>Đang kiểm tra phiên</Text>;
  return path === "/notification-preferences" ? (
    <SessionNotificationPreferencesScreen />
  ) : (
    <SessionAccountScreen />
  );
}

async function renderFlow(
  options: {
    direct?: boolean;
    offline?: boolean;
    failLoad?: boolean;
    expiredLoad?: boolean;
  } = {},
) {
  let offline = options.offline ?? false;
  const server = createMockSessionGateway();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository: createMemorySessionCredentials(),
    isOffline: () => offline,
  });
  // Bootstrap the synthetic account online, then apply the requested connectivity.
  offline = false;
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  offline = options.offline ?? false;
  if (options.failLoad)
    jest
      .spyOn(server.notificationGateway, "load")
      .mockRejectedValueOnce(new Error("synthetic load error"));
  if (options.expiredLoad)
    jest
      .spyOn(server.notificationGateway, "load")
      .mockResolvedValueOnce({
        status: "session-expired",
        message: { code: "MSG19" },
      });
  const listeners = new Set<(status: ConnectivityStatus) => void>();
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <ConnectivityProvider
        service={{
          getCurrentStatus: async () => (offline ? "offline" : "online"),
          subscribe: (listener) => {
            listeners.add(listener);
            return () => {
              listeners.delete(listener);
            };
          },
        }}
      >
        <MobileSessionProvider
          runtimeFactory={() => ({
            store,
            profileGateway: server.profileGateway,
            notificationGateway: server.notificationGateway,
            setOffline: (value) => {
              offline = value;
            },
          })}
        >
          <Flow direct={options.direct ?? false} />
        </MobileSessionProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>,
  );
  return {
    ...server,
    store,
    connect: (status: ConnectivityStatus) => {
      offline = status === "offline";
      listeners.forEach((listener) => listener(status));
    },
  };
}

const reminder = () =>
  screen.getByRole("switch", { name: "Trong ứng dụng cho Nhắc đo nước" });
async function toggleReminder(enabled: boolean) {
  // RNTL userEvent has no Switch toggle API; valueChange is its native boundary.
  await fireEvent(reminder(), "valueChange", enabled);
}
const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

test("opens from profile, saves canonical preferences, and cancel discards unsaved changes", async () => {
  await renderFlow();
  await user().press(
    await screen.findByRole("button", { name: "Tùy chọn thông báo" }),
  );
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  expect(reminder()).toBeChecked();
  expect(
    screen.getByRole("switch", {
      name: "Trong ứng dụng cho Cảnh báo chất lượng nước",
    }),
  ).toBeDisabled();
  expect(screen.getByText("Chưa kết nối")).toBeOnTheScreen();
  expect(
    screen.queryByRole("button", { name: "Cho phép thông báo" }),
  ).not.toBeOnTheScreen();
  await toggleReminder(false);
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  expect(
    await screen.findByText("Tùy chọn thông báo đã được lưu."),
  ).toBeOnTheScreen();
  await toggleReminder(true);
  await user().press(screen.getByRole("button", { name: "Hủy thay đổi" }));
  await user().press(
    await screen.findByRole("button", { name: "Tùy chọn thông báo" }),
  );
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  expect(reminder()).not.toBeChecked();
});

test("offline save preserves draft, no auto-save after reconnect, explicit retry succeeds", async () => {
  const { connect, notificationGateway } = await renderFlow({ direct: true });
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  const save = jest.spyOn(notificationGateway, "save");
  await toggleReminder(false);
  await act(() => connect("offline"));
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(reminder()).not.toBeChecked();
  expect(save).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(save).not.toHaveBeenCalled();
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  expect(
    await screen.findByText("Tùy chọn thông báo đã được lưu."),
  ).toBeOnTheScreen();
  expect(save).toHaveBeenCalledTimes(1);
});

test("a service save failure keeps draft and retry does not pretend the first save succeeded", async () => {
  const { notificationGateway } = await renderFlow({ direct: true });
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  jest
    .spyOn(notificationGateway, "save")
    .mockRejectedValueOnce(new Error("synthetic save error"));
  await toggleReminder(false);
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  expect(
    await screen.findByText("Dịch vụ tạm thời gián đoạn"),
  ).toBeOnTheScreen();
  expect(reminder()).not.toBeChecked();
  expect(
    screen.queryByText("Tùy chọn thông báo đã được lưu."),
  ).not.toBeOnTheScreen();
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  expect(
    await screen.findByText("Tùy chọn thông báo đã được lưu."),
  ).toBeOnTheScreen();
});

test("load error supports retry and a real return to profile", async () => {
  await renderFlow({ direct: true, failLoad: true });
  await user().press(await screen.findByRole("button", { name: "Thử lại" }));
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  await user().press(screen.getByRole("button", { name: "Quay lại hồ sơ" }));
  expect(await screen.findByLabelText("Tên hiển thị")).toHaveDisplayValue(
    "Trần Thu Hà",
  );
});

test("initial offline load shows MSG07 with retry and return instead of a trapped screen", async () => {
  const { connect } = await renderFlow({ direct: true, offline: true });
  // Provider bootstrap itself is offline; retry it online before exercising feature offline load.
  await act(() => connect("online"));
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  await user().press(screen.getByRole("button", { name: "Quay lại hồ sơ" }));
  await screen.findByLabelText("Tên hiển thị");
  await act(() => connect("offline"));
  await user().press(
    screen.getByRole("button", { name: "Tùy chọn thông báo" }),
  );
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeOnTheScreen();
  await user().press(screen.getByRole("button", { name: "Quay lại hồ sơ" }));
  expect(
    await screen.findByRole("button", { name: "Đăng xuất" }),
  ).toBeOnTheScreen();
});

test.each(["load", "save"] as const)(
  "expired %s removes protected choices and login receives MSG19",
  async (method) => {
    const { notificationGateway } = await renderFlow({
      direct: true,
      expiredLoad: method === "load",
    });
    if (method === "save") {
      await screen.findByRole("switch", {
        name: "Trong ứng dụng cho Nhắc đo nước",
      });
      await toggleReminder(false);
      jest
        .spyOn(notificationGateway, "save")
        .mockResolvedValueOnce({
          status: "session-expired",
          message: { code: "MSG19" },
        });
      await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
    }
    expect(
      await screen.findByText(resolveKnownMessage("MSG19").message),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole("switch", { name: "Trong ứng dụng cho Nhắc đo nước" }),
    ).not.toBeOnTheScreen();
    expect(screen.getByLabelText("Mật khẩu")).toHaveDisplayValue("");
  },
);

test("duplicate save is blocked and toggles/cancel stay locked until response", async () => {
  const { notificationGateway } = await renderFlow({ direct: true });
  await screen.findByRole("switch", {
    name: "Trong ứng dụng cho Nhắc đo nước",
  });
  const completion = deferredResult<SaveNotificationPreferencesResult>();
  const save = notificationGateway.save;
  const entered = deferredResult<void>();
  let canonical: SaveNotificationPreferencesResult;
  const spy = jest
    .spyOn(notificationGateway, "save")
    .mockImplementation(async (...args) => {
      canonical = await save(...args);
      entered.resolve();
      return completion.promise;
    });
  await toggleReminder(false);
  await user().press(screen.getByRole("button", { name: "Lưu tùy chọn" }));
  await entered.promise;
  await user().press(
    screen.getByRole("button", { name: "Lưu tùy chọn. Đang lưu" }),
  );
  expect(spy).toHaveBeenCalledTimes(1);
  expect(reminder()).toBeDisabled();
  expect(screen.getByRole("button", { name: "Hủy thay đổi" })).toBeDisabled();
  await act(() => completion.resolve(canonical!));
  expect(
    await screen.findByText("Tùy chọn thông báo đã được lưu."),
  ).toBeOnTheScreen();
});
