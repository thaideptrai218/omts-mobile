import {
  render,
  act,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import { createMemorySessionCredentials } from "../adapters/memory-session-credentials";
import { createMockSessionGateway } from "../adapters/mock-session-gateway";
import {
  MOCK_PASSWORD,
  MOCK_VERIFICATION_CODE,
} from "../adapters/mock-session-fixtures";
import {
  MobileSessionProvider,
  useMobileSession,
} from "../state/mobile-session-provider";
import { createMobileSessionStore } from "../state/mobile-session-store";
import { OnboardingScreen } from "../screens/onboarding-screen";
import { SessionAccountScreen } from "../screens/session-account-screen";
import { SessionFailure } from "../domain/mobile-session";
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
  if (snapshot.status === "active")
    return snapshot.session.nextAction === "ready" ? (
      <SessionAccountScreen />
    ) : (
      <OnboardingScreen />
    );
  return <Text>Đang kiểm tra phiên</Text>;
}

async function renderFlow(
  prepare?: (
    store: ReturnType<typeof createMobileSessionStore>,
  ) => Promise<void>,
) {
  let offline = false;
  const { gateway, profileGateway } = createMockSessionGateway();
  const store = createMobileSessionStore({
    gateway,
    repository: createMemorySessionCredentials(),
    isOffline: () => offline,
  });
  await prepare?.(store);
  const service = {
    getCurrentStatus: async () => "online" as const,
    subscribe: () => () => undefined,
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
  return { store, gateway };
}

test("real controlled forms complete Staff onboarding and logout without retaining secrets", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await renderFlow();
  await screen.findByRole("button", { name: "Đăng nhập" });
  expect(
    screen.queryByRole("button", { name: "Quên mật khẩu" }),
  ).not.toBeOnTheScreen();
  await user.type(
    screen.getByLabelText("Tên đăng nhập, số điện thoại hoặc email"),
    "nguyen.minh.an",
  );
  await user.type(screen.getByLabelText("Mật khẩu"), MOCK_PASSWORD);
  await user.press(screen.getByRole("button", { name: "Đăng nhập" }));
  await screen.findByRole("header", { name: "Tạo mật khẩu mới" });
  expect(screen.queryByRole("button", { name: "Hủy" })).not.toBeOnTheScreen();
  expect(screen.queryByText("Phân công của bạn")).not.toBeOnTheScreen();
  await user.type(screen.getByLabelText("Mật khẩu tạm thời"), MOCK_PASSWORD);
  await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPass2026");
  await user.type(
    screen.getByLabelText("Nhập lại mật khẩu mới"),
    "NewPass2026",
  );
  await user.press(
    screen.getByRole("button", { name: "Tạo mật khẩu và tiếp tục" }),
  );
  await screen.findByRole("header", { name: "Xác minh liên hệ" });
  await user.press(
    screen.getByRole("button", { name: "Email: a***@example.invalid" }),
  );
  await screen.findByRole("header", { name: "Xác minh thông tin liên hệ" });
  await user.press(screen.getByRole("button", { name: "Quay lại" }));
  await user.press(
    screen.getByRole("button", { name: "Email: a***@example.invalid" }),
  );
  expect(
    screen.getByRole("header", { name: "Xác minh thông tin liên hệ" }),
  ).toBeOnTheScreen();
  await user.type(screen.getByLabelText("Mã xác minh"), "000000");
  await user.press(screen.getByRole("button", { name: "Xác minh" }));
  expect(await screen.findByText(/Còn 4 lần nhập mã/)).toBeOnTheScreen();
  await user.type(screen.getByLabelText("Mã xác minh"), MOCK_VERIFICATION_CODE);
  await user.press(screen.getByRole("button", { name: "Xác minh" }));
  expect(
    await screen.findByRole("header", { name: "Nguyễn Minh An" }),
  ).toBeOnTheScreen();
  await user.press(screen.getByRole("button", { name: "Đăng xuất" }));
  const dialog = within(screen.getByTestId("logout-confirmation-dialog"));
  await user.press(dialog.getByRole("button", { name: "Hủy" }));
  expect(
    screen.getByRole("header", { name: "Nguyễn Minh An" }),
  ).toBeOnTheScreen();
  await user.press(screen.getByRole("button", { name: "Đăng xuất" }));
  await user.press(
    within(screen.getByTestId("logout-confirmation-dialog")).getByRole(
      "button",
      { name: "Đăng xuất" },
    ),
  );
  await screen.findByRole("button", { name: "Đăng nhập" });
  expect(screen.getByLabelText("Mật khẩu")).toHaveDisplayValue("");
  expect(
    screen.queryByText(resolveKnownMessage("MSG19").message),
  ).not.toBeOnTheScreen();
});

test("expired session carries MSG19 to login and clears it when the user starts again", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const { store, gateway } = await renderFlow(async (current) => {
    await current.login("tran.thu.ha", MOCK_PASSWORD);
  });
  await screen.findByRole("header", { name: "Trần Thu Hà" });
  jest
    .spyOn(gateway, "inspect")
    .mockRejectedValue(new SessionFailure("expired"));
  jest
    .spyOn(gateway, "refresh")
    .mockRejectedValue(new SessionFailure("expired"));
  await act(async () => {
    await expect(store.reloadSession()).rejects.toMatchObject({
      code: "expired",
    });
  });
  expect(
    await screen.findByText(resolveKnownMessage("MSG19").message),
  ).toBeOnTheScreen();
  expect(
    screen.queryByRole("header", { name: "Trần Thu Hà" }),
  ).not.toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu")).toHaveDisplayValue("");
  await user.type(
    screen.getByLabelText("Tên đăng nhập, số điện thoại hoặc email"),
    "tran",
  );
  expect(
    screen.queryByText(resolveKnownMessage("MSG19").message),
  ).not.toBeOnTheScreen();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
});

test("choosing phone is sufficient; email verification is not a second mandatory gate", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await renderFlow(async (store) => {
    await store.login("nguyen.minh.an", MOCK_PASSWORD);
    await store.changePassword(MOCK_PASSWORD, "NewPass2026");
  });
  await screen.findByRole("header", { name: "Xác minh liên hệ" });
  await user.press(
    screen.getByRole("button", { name: "Số điện thoại: ******0123" }),
  );
  await screen.findByRole("header", { name: "Xác minh thông tin liên hệ" });
  await user.type(screen.getByLabelText("Mã xác minh"), MOCK_VERIFICATION_CODE);
  await user.press(screen.getByRole("button", { name: "Xác minh" }));
  expect(
    await screen.findByRole("header", { name: "Nguyễn Minh An" }),
  ).toBeOnTheScreen();
  expect(
    screen.queryByRole("header", { name: "Xác minh liên hệ" }),
  ).not.toBeOnTheScreen();
});
