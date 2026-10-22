import {
  act,
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { SessionAccountScreen } from "@/features/session/screens/session-account-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

function Flow() {
  const { snapshot } = useMobileSession();
  if (snapshot.status === "signedOut") return <SessionLoginController />;
  if (snapshot.status === "active" && snapshot.session.nextAction === "ready")
    return <SessionAccountScreen />;
  return <Text>Đang kiểm tra phiên</Text>;
}

async function renderProfile(options: { failLoad?: boolean } = {}) {
  let offline = false;
  const listeners = new Set<(status: ConnectivityStatus) => void>();
  const { gateway, profileGateway } = createMockSessionGateway();
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway,
    repository,
    isOffline: () => offline,
  });
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  if (options.failLoad)
    jest
      .spyOn(profileGateway, "load")
      .mockRejectedValueOnce(new Error("mock load failure"));
  const service = {
    getCurrentStatus: async () => "online" as const,
    subscribe: (listener: (status: ConnectivityStatus) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  const runtimeFactory = () => ({
    store,
    profileGateway,
    setOffline: (value: boolean) => {
      offline = value;
    },
  });
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 800 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <ConnectivityProvider service={service}>
        <MobileSessionProvider runtimeFactory={runtimeFactory}>
          <Flow />
        </MobileSessionProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>,
  );
  return {
    store,
    gateway,
    profileGateway,
    repository,
    connect: (status: ConnectivityStatus) => {
      offline = status === "offline";
      listeners.forEach((listener) => listener(status));
    },
  };
}

test("account form saves canonical name, keeps username read-only and persists in the mock server across login", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { store } = await renderProfile();
  const name = await screen.findByLabelText("Tên hiển thị");
  expect(name).toHaveDisplayValue("Trần Thu Hà");
  expect(screen.queryByLabelText("Tên đăng nhập")).not.toBeOnTheScreen();
  expect(
    screen.queryByRole("button", { name: "Thay đổi email" }),
  ).not.toBeOnTheScreen();
  expect(
    screen.queryByRole("button", { name: "Tùy chọn thông báo" }),
  ).not.toBeOnTheScreen();
  await user.clear(name);
  await user.paste(name, "  Hà cập nhật  ");
  await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
  expect(
    await screen.findByText("Hồ sơ cá nhân đã được lưu."),
  ).toBeOnTheScreen();
  expect(screen.getByRole("header", { name: "Hà cập nhật" })).toBeOnTheScreen();
  expect(name).toHaveDisplayValue("Hà cập nhật");
  await act(() => store.logout());
  await screen.findByRole("button", { name: "Đăng nhập" });
  await user.paste(
    screen.getByLabelText("Tên đăng nhập, số điện thoại hoặc email"),
    "tran.thu.ha",
  );
  await user.paste(screen.getByLabelText("Mật khẩu"), MOCK_PASSWORD);
  await user.press(screen.getByRole("button", { name: "Đăng nhập" }));
  expect(await screen.findByLabelText("Tên hiển thị")).toHaveDisplayValue(
    "Hà cập nhật",
  );
});

test("a second session creates a real mock conflict; reload failure preserves draft until successful retry", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { gateway, profileGateway } = await renderProfile();
  const name = await screen.findByLabelText("Tên hiển thị");
  await user.clear(name);
  await user.paste(name, "Bản nháp của tôi");
  const other = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  const current = await profileGateway.load(other.credential);
  await profileGateway.save(other.credential, {
    displayName: "Tên từ phiên khác",
    expectedRevision: current.revision,
  });
  await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
  expect(
    await screen.findByText(
      resolveKnownMessage("MSG06", { userName: null, time: null }).message,
    ),
  ).toBeOnTheScreen();
  expect(name).toHaveDisplayValue("Bản nháp của tôi");
  expect(
    screen.getByRole("button", { name: "Lưu tên hiển thị" }),
  ).toBeDisabled();
  jest
    .spyOn(profileGateway, "load")
    .mockRejectedValueOnce(new Error("retry failure"));
  await user.press(
    screen.getByRole("button", { name: "Tải lại và bỏ thay đổi" }),
  );
  expect(
    await screen.findByText("Dịch vụ tạm thời gián đoạn"),
  ).toBeOnTheScreen();
  expect(name).toHaveDisplayValue("Bản nháp của tôi");
  expect(
    screen.getByRole("button", { name: "Lưu tên hiển thị" }),
  ).toBeDisabled();
  await user.press(
    screen.getByRole("button", { name: "Tải lại và bỏ thay đổi" }),
  );
  expect(
    await screen.findByDisplayValue("Tên từ phiên khác"),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Lưu tên hiển thị" }),
  ).toBeEnabled();
});

test("offline save retains draft and shows MSG07 without auto-saving on reconnection", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { connect, profileGateway } = await renderProfile();
  const name = await screen.findByLabelText("Tên hiển thị");
  const save = jest.spyOn(profileGateway, "save");
  await user.clear(name);
  await user.paste(name, "Tên khi mất mạng");
  await act(() => connect("offline"));
  await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(name).toHaveDisplayValue("Tên khi mất mạng");
  expect(save).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(save).not.toHaveBeenCalled();
  await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
  expect(
    await screen.findByText("Hồ sơ cá nhân đã được lưu."),
  ).toBeOnTheScreen();
  expect(save).toHaveBeenCalledTimes(1);
});

test("load failure offers retry and a working logout instead of trapping the user", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await renderProfile({ failLoad: true });
  await screen.findByRole("button", { name: "Thử lại" });
  await user.press(screen.getByRole("button", { name: "Đăng xuất" }));
  await user.press(
    within(screen.getByTestId("logout-confirmation-dialog")).getByRole(
      "button",
      { name: "Đăng xuất" },
    ),
  );
  expect(
    await screen.findByRole("button", { name: "Đăng nhập" }),
  ).toBeOnTheScreen();
  expect(
    screen.queryByText(resolveKnownMessage("MSG19").message),
  ).not.toBeOnTheScreen();
});

test("expired save removes the profile draft and carries MSG19 to the real login form", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { profileGateway } = await renderProfile();
  const name = await screen.findByLabelText("Tên hiển thị");
  await user.clear(name);
  await user.paste(name, "Draft before expiry");
  jest
    .spyOn(profileGateway, "save")
    .mockResolvedValueOnce({ status: "session-expired" });
  await user.press(screen.getByRole("button", { name: "Lưu tên hiển thị" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG19").message),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText("Tên hiển thị")).not.toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu")).toHaveDisplayValue("");
});
