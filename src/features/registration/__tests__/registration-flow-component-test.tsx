import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { SessionAccountScreen } from "@/features/session/screens/session-account-screen";
import { SessionNotificationPreferencesScreen } from "@/features/notifications/screens/session-notification-preferences-screen";
import { SessionRecoveryScreen } from "@/features/recovery/screens/session-recovery-screen";
import { createRecoveryFlowService } from "@/features/recovery/services/recovery-flow-service";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { deferredResult } from "@/shared/testing/deferred-result";
import { createRegistrationFlowService } from "../services/registration-flow-service";
import { SessionRegistrationScreen } from "../screens/session-registration-screen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
const originalState = AppState.currentState;
beforeEach(() => {
  jest.useFakeTimers();
  AppState.currentState = "active";
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
  AppState.currentState = originalState;
});
function Flow() {
  const [path, setPath] = useState("/login");
  const { snapshot } = useMobileSession();
  useEffect(() => {
    jest.mocked(router.push).mockImplementation((next) => {
      setPath(String(next));
    });
    jest.mocked(router.replace).mockImplementation((next) => {
      setPath(String(next));
    });
  }, []);
  if (snapshot.status === "signedOut") {
    if (path === "/register") return <SessionRegistrationScreen />;
    if (path === "/recovery") return <SessionRecoveryScreen />;
    return <SessionLoginController />;
  }
  if (snapshot.status === "active")
    return path === "/notification-preferences" ? (
      <SessionNotificationPreferencesScreen />
    ) : (
      <SessionAccountScreen />
    );
  return null;
}
async function setup() {
  let offline = false;
  const server = createMockSessionGateway();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository: createMemorySessionCredentials(),
    isOffline: () => offline,
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
          getCurrentStatus: async () => "online",
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
            createRegistrationFlow: () =>
              createRegistrationFlowService(
                server.registrationGateway,
                () => offline,
              ),
            createRecoveryFlow: () =>
              createRecoveryFlowService(server.recoveryGateway, () => offline),
          })}
        >
          <Flow />
        </MobileSessionProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>,
  );
  await screen.findByRole("button", { name: "Đăng nhập" });
  return {
    ...server,
    store,
    connect: (value: ConnectivityStatus) => {
      listeners.forEach((listener) => listener(value));
    },
  };
}
const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
const invalidConfirmationMessage =
  "Xác nhận đăng ký không còn hiệu lực. Vui lòng nhập lại thông tin và xác minh để tiếp tục.";
async function open() {
  await user().press(
    screen.getByRole("button", { name: "Đăng ký tài khoản thương lái" }),
  );
  await screen.findByRole("header", { name: "Tạo tài khoản thương lái" });
}
async function passwords() {
  await user().paste(
    screen.getByLabelText("Mật khẩu", { exact: true }),
    "TraderPass2026",
  );
  await user().paste(
    screen.getByLabelText("Nhập lại mật khẩu"),
    "TraderPass2026",
  );
}
async function start(
  identifier = "trader@example.invalid",
  method: "email" | "phone" = "email",
) {
  if (method === "phone")
    await user().press(screen.getByRole("radio", { name: "Số điện thoại" }));
  await user().paste(
    screen.getByLabelText(method === "email" ? "Email" : "Số điện thoại", {
      exact: true,
    }),
    identifier,
  );
  await passwords();
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  await screen.findByLabelText("Mã xác minh");
}
async function verify(code = "246810") {
  await user().paste(screen.getByLabelText("Mã xác minh"), code);
  await user().press(screen.getByRole("button", { name: "Xác minh" }));
}

test.each([
  { method: "email" as const, identifier: "trader@example.invalid" },
  { method: "phone" as const, identifier: "0000000999" },
])(
  "$method registration confirms explicitly, then logs into a grant-free Trader profile",
  async ({ method, identifier }) => {
    const { store, gateway } = await setup();
    await open();
    await start(identifier, method);
    await verify();
    await screen.findByText("Xác nhận tạo tài khoản");
    await expect(
      gateway.login(identifier, "TraderPass2026"),
    ).rejects.toMatchObject({ code: "credentials" });
    expect(store.getSnapshot().status).toBe("signedOut");
    await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
    expect(await screen.findByText("Đăng ký thành công")).toBeOnTheScreen();
    expect(store.getSnapshot().status).toBe("signedOut");
    await user().press(screen.getByRole("button", { name: "Về đăng nhập" }));
    expect(
      screen.getByLabelText("Mật khẩu", { exact: true }),
    ).toHaveDisplayValue("");
    await user().paste(
      screen.getByLabelText("Tên đăng nhập, số điện thoại hoặc email"),
      identifier,
    );
    await user().paste(
      screen.getByLabelText("Mật khẩu", { exact: true }),
      "TraderPass2026",
    );
    await user().press(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(
      await screen.findByText("Loại tài khoản: Thương lái"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Tùy chọn thông báo" }),
    ).not.toBeOnTheScreen();
    const snapshot = store.getSnapshot();
    expect(snapshot.status === "active" && snapshot.session.grants).toEqual([]);
    await act(() => router.push("/notification-preferences"));
    expect(await screen.findByText("Chưa thể tải tùy chọn")).toBeOnTheScreen();
    expect(
      screen.queryByText("Cảnh báo chất lượng nước"),
    ).not.toBeOnTheScreen();
  },
);

test("duplicate contact clears secrets, shows generic MSG14 and opens actual recovery route", async () => {
  await setup();
  await open();
  await user().paste(
    screen.getByLabelText("Email", { exact: true }),
    "ha@example.invalid",
  );
  await passwords();
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG14").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(screen.getByLabelText("Nhập lại mật khẩu")).toHaveDisplayValue("");
  await user().press(
    screen.getByRole("button", { name: "Quên mật khẩu? Khôi phục tài khoản" }),
  );
  expect(await screen.findByText("Khôi phục tài khoản")).toBeOnTheScreen();
});

test("method-specific identifier drafts survive switching without reinterpretation or deletion", async () => {
  const { registrationGateway } = await setup();
  await open();
  const call = jest.spyOn(registrationGateway, "start");
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  expect(call).not.toHaveBeenCalled();
  await user().paste(
    screen.getByLabelText("Email", { exact: true }),
    "trader@example.invalid",
  );
  await user().press(screen.getByRole("radio", { name: "Số điện thoại" }));
  expect(
    screen.getByLabelText("Số điện thoại", { exact: true }),
  ).toHaveDisplayValue("");
  await user().paste(
    screen.getByLabelText("Số điện thoại", { exact: true }),
    "0000000999",
  );
  await user().press(screen.getByRole("radio", { name: "Email" }));
  expect(screen.getByLabelText("Email", { exact: true })).toHaveDisplayValue(
    "trader@example.invalid",
  );
  await user().press(screen.getByRole("radio", { name: "Số điện thoại" }));
  expect(
    screen.getByLabelText("Số điện thoại", { exact: true }),
  ).toHaveDisplayValue("0000000999");
});

test("wrong OTP and resend rotation do not create an account before confirmation", async () => {
  const { registrationGateway } = await setup();
  const complete = jest.spyOn(registrationGateway, "complete");
  await open();
  await start();
  await verify("000000");
  expect(
    await screen.findByText(resolveKnownMessage("MSG16").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mã xác minh")).toHaveDisplayValue("");
  await act(() => jest.advanceTimersByTime(60_000));
  await user().press(screen.getByRole("button", { name: "Gửi lại mã" }));
  await verify("246811");
  expect(await screen.findByText("Xác nhận tạo tài khoản")).toBeOnTheScreen();
  expect(complete).not.toHaveBeenCalled();
});

test("offline start clears password fields and never auto-submits on reconnect", async () => {
  const { connect, registrationGateway } = await setup();
  await open();
  const call = jest.spyOn(registrationGateway, "start");
  await user().paste(
    screen.getByLabelText("Email", { exact: true }),
    "trader@example.invalid",
  );
  await passwords();
  await act(() => connect("offline"));
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(call).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(call).not.toHaveBeenCalled();
});

test("restarting during cooldown explains send unavailability instead of calling an unentered code wrong", async () => {
  await setup();
  await open();
  await start();
  await user().press(
    screen.getByRole("button", { name: "Nhập lại thông tin đăng ký" }),
  );
  await user().paste(
    screen.getByLabelText("Email", { exact: true }),
    "trader@example.invalid",
  );
  await passwords();
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  expect(
    await screen.findByText(
      "Chưa thể gửi mã mới lúc này. Vui lòng chờ rồi thử đăng ký lại.",
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
});

test("offline confirmation is retried manually without verifying again or auto-creating", async () => {
  const { registrationGateway } = await setup();
  const complete = jest
    .spyOn(registrationGateway, "complete")
    .mockResolvedValueOnce({ status: "offline" });
  await open();
  await start();
  await verify();
  await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Đăng ký thành công")).not.toBeOnTheScreen();
  await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
  expect(await screen.findByText("Đăng ký thành công")).toBeOnTheScreen();
  expect(complete).toHaveBeenCalledTimes(2);
});

test("duplicate submit is locked; unmount and late response cannot restore a registration attempt", async () => {
  const { registrationGateway } = await setup();
  const original = registrationGateway.start;
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const call = jest
    .spyOn(registrationGateway, "start")
    .mockImplementationOnce(async (input) => {
      const result = await original(input);
      entered.resolve();
      await release.promise;
      return result;
    });
  await open();
  await user().paste(
    screen.getByLabelText("Email", { exact: true }),
    "trader@example.invalid",
  );
  await passwords();
  await user().press(screen.getByRole("button", { name: "Tiếp tục xác minh" }));
  await entered.promise;
  await user().press(
    screen.getByRole("button", { name: "Tiếp tục xác minh. Đang kiểm tra" }),
  );
  expect(call).toHaveBeenCalledTimes(1);
  await act(() => router.replace("/login"));
  await act(() => release.resolve());
  await open();
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
});

test.each([
  { method: "email" as const, identifier: "trader@example.invalid" },
  { method: "phone" as const, identifier: "0000000999" },
])(
  "expired $method confirmation explains restarting and requires fresh verification",
  async ({ method, identifier }) => {
    const { gateway, registrationGateway, store } = await setup();
    const begin = jest.spyOn(registrationGateway, "start");
    const complete = jest.spyOn(registrationGateway, "complete");
    await open();
    await start(identifier, method);
    await verify();
    await act(() => jest.advanceTimersByTime(300_000));
    await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
    expect(
      await screen.findByText(invalidConfirmationMessage),
    ).toBeOnTheScreen();
    expect(screen.getByText("Cần đăng ký lại")).toBeOnTheScreen();
    expect(
      screen.queryByText(resolveKnownMessage("MSG16").message),
    ).not.toBeOnTheScreen();
    expect(screen.getByLabelText("Email", { exact: true })).toHaveDisplayValue(
      "",
    );
    expect(
      screen.getByLabelText("Mật khẩu", { exact: true }),
    ).toHaveDisplayValue("");
    expect(screen.getByLabelText("Nhập lại mật khẩu")).toHaveDisplayValue("");
    expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Gửi lại mã" }),
    ).not.toBeOnTheScreen();
    expect(screen.queryByText("Đăng ký thành công")).not.toBeOnTheScreen();
    await expect(
      gateway.login(identifier, "TraderPass2026"),
    ).rejects.toMatchObject({ code: "credentials" });
    await act(() => jest.advanceTimersByTime(60_000));
    expect(begin).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe("signedOut");
    await start(identifier, method);
    expect(
      screen.queryByText(invalidConfirmationMessage),
    ).not.toBeOnTheScreen();
    await verify();
    await expect(
      gateway.login(identifier, "TraderPass2026"),
    ).rejects.toMatchObject({ code: "credentials" });
    await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
    expect(await screen.findByText("Đăng ký thành công")).toBeOnTheScreen();
    expect(complete).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot().status).toBe("signedOut");
    await expect(
      gateway.login(identifier, "TraderPass2026"),
    ).resolves.toMatchObject({
      session: { subjectType: "Trader", grants: [] },
    });
  },
);

test("leaving verified confirmation cancels the attempt without creating an account", async () => {
  const { gateway, registrationGateway } = await setup();
  const cancel = jest.spyOn(registrationGateway, "cancel");
  const complete = jest.spyOn(registrationGateway, "complete");
  await open();
  await start();
  await verify();
  await user().press(
    screen.getByRole("button", { name: "Quay lại đăng nhập" }),
  );
  expect(
    await screen.findByRole("button", { name: "Đăng nhập" }),
  ).toBeOnTheScreen();
  expect(cancel).toHaveBeenCalledWith("mock-registration-code-1");
  expect(complete).not.toHaveBeenCalled();
  await expect(
    gateway.login("trader@example.invalid", "TraderPass2026"),
  ).rejects.toMatchObject({ code: "credentials" });
  await open();
  expect(screen.getByLabelText("Email", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(screen.queryByText("Xác nhận tạo tài khoản")).not.toBeOnTheScreen();
});

test("unavailable completion keeps generic MSG14 and recovery action instead of expiry copy", async () => {
  const { registrationGateway, gateway } = await setup();
  jest
    .spyOn(registrationGateway, "complete")
    .mockResolvedValueOnce({ status: "unavailable" });
  await open();
  await start();
  await verify();
  await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG14").message),
  ).toBeOnTheScreen();
  expect(screen.queryByText(invalidConfirmationMessage)).not.toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu", { exact: true })).toHaveDisplayValue(
    "",
  );
  expect(screen.getByLabelText("Nhập lại mật khẩu")).toHaveDisplayValue("");
  expect(
    screen.getByRole("button", { name: "Quên mật khẩu? Khôi phục tài khoản" }),
  ).toBeEnabled();
  await expect(
    gateway.login("trader@example.invalid", "TraderPass2026"),
  ).rejects.toMatchObject({ code: "credentials" });
});

test("pending completion blocks duplicate confirmation and cannot restore success after leaving", async () => {
  const { registrationGateway, gateway, store } = await setup();
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const original = registrationGateway.complete;
  const complete = jest
    .spyOn(registrationGateway, "complete")
    .mockImplementationOnce(async (proof) => {
      const result = await original(proof);
      entered.resolve();
      await release.promise;
      return result;
    });
  await open();
  await start();
  await verify();
  await user().press(screen.getByRole("button", { name: "Tạo tài khoản" }));
  await entered.promise;
  const pending = screen.getByRole("button", {
    name: "Tạo tài khoản. Đang xử lý",
  });
  expect(pending).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Quay lại đăng nhập" }),
  ).toBeDisabled();
  await user().press(pending);
  expect(complete).toHaveBeenCalledTimes(1);
  await act(() => router.replace("/login"));
  await act(() => release.resolve());
  expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeOnTheScreen();
  expect(screen.queryByText("Đăng ký thành công")).not.toBeOnTheScreen();
  expect(store.getSnapshot().status).toBe("signedOut");
  // Ignoring a late response must not be described as rolling back its creation.
  await expect(
    gateway.login("trader@example.invalid", "TraderPass2026"),
  ).resolves.toMatchObject({ session: { subjectType: "Trader", grants: [] } });
});
