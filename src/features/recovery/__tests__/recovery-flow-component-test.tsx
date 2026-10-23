import { useEffect, useState } from "react";
import { AppState, Text } from "react-native";
import { router } from "expo-router";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { SessionAccountScreen } from "@/features/session/screens/session-account-screen";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import {
  MOCK_PASSWORD,
  MOCK_VERIFICATION_CODE,
} from "@/features/session/adapters/mock-session-fixtures";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { deferredResult } from "@/shared/testing/deferred-result";
import { SessionRecoveryScreen } from "../screens/session-recovery-screen";
import { createRecoveryFlowService } from "../services/recovery-flow-service";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
const initialAppState = AppState.currentState;
beforeEach(() => {
  jest.useFakeTimers();
  AppState.currentState = "active";
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
  AppState.currentState = initialAppState;
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
  if (snapshot.status === "signedOut")
    return path === "/recovery" ? (
      <SessionRecoveryScreen />
    ) : (
      <SessionLoginController />
    );
  if (snapshot.status === "active" && snapshot.session.nextAction === "ready")
    return <SessionAccountScreen />;
  return <Text>Đang kiểm tra phiên</Text>;
}
async function setup() {
  let offline = false;
  const server = createMockSessionGateway();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository: createMemorySessionCredentials(),
    isOffline: () => offline,
  });
  const listeners = new Set<(value: ConnectivityStatus) => void>();
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
            setOffline: (value) => {
              offline = value;
            },
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
    connect: (status: ConnectivityStatus) => {
      offline = status === "offline";
      listeners.forEach((listener) => listener(status));
    },
  };
}
const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
async function openRecovery() {
  await user().press(screen.getByRole("button", { name: /Quên mật khẩu/ }));
  await screen.findByRole("header", { name: "Khôi phục tài khoản" });
}
async function send(identifier = "ha@example.invalid") {
  await user().paste(
    screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
    identifier,
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await screen.findByText(resolveKnownMessage("MSG15").message);
  await user().press(screen.getByRole("button", { name: "Nhập mã xác minh" }));
  await screen.findByLabelText("Mã xác minh");
}
async function verify(code = MOCK_VERIFICATION_CODE) {
  await user().paste(screen.getByLabelText("Mã xác minh"), code);
  await user().press(screen.getByRole("button", { name: "Xác minh" }));
}
async function enterPassword(
  password = "Recovered2026",
  confirmation = password,
) {
  await user().paste(screen.getByLabelText("Mật khẩu mới"), password);
  await user().paste(
    screen.getByLabelText("Nhập lại mật khẩu mới"),
    confirmation,
  );
}

test("login → request → OTP → reset → explicit login uses the same mock account", async () => {
  const { store } = await setup();
  await user().paste(screen.getByLabelText("Mật khẩu"), "unsent-secret");
  await openRecovery();
  await send();
  expect(screen.queryByText("Trần Thu Hà")).not.toBeOnTheScreen();
  await verify();
  await screen.findByLabelText("Mật khẩu mới");
  await enterPassword();
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText("Đặt lại mật khẩu thành công"),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText("Mật khẩu mới")).not.toBeOnTheScreen();
  expect(store.getSnapshot().status).toBe("signedOut");
  await user().press(screen.getByRole("button", { name: "Về đăng nhập" }));
  await user().paste(
    screen.getByLabelText("Tên đăng nhập, số điện thoại hoặc email"),
    "tran.thu.ha",
  );
  await user().paste(screen.getByLabelText("Mật khẩu"), MOCK_PASSWORD);
  await user().press(screen.getByRole("button", { name: "Đăng nhập" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG12").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu")).toHaveDisplayValue("");
  await user().paste(screen.getByLabelText("Mật khẩu"), "Recovered2026");
  await user().press(screen.getByRole("button", { name: "Đăng nhập" }));
  expect(
    await screen.findByRole("header", { name: "Trần Thu Hà" }),
  ).toBeOnTheScreen();
});

test.each(["missing@example.invalid", "an@example.invalid"])(
  "%s gets MSG15 but cannot advance using the demo OTP",
  async (identifier) => {
    await setup();
    await openRecovery();
    await send(identifier);
    expect(screen.getByText("Thông tin nhận mã")).toBeOnTheScreen();
    expect(screen.queryByText(/Mã đã được gửi tới/)).not.toBeOnTheScreen();
    await verify();
    expect(
      await screen.findByText(resolveKnownMessage("MSG16").message),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText("Mật khẩu mới")).not.toBeOnTheScreen();
    expect(screen.getByLabelText("Mã xác minh")).toHaveDisplayValue("");
  },
);

test("mismatch stays on password form with valid proof, then corrected submission succeeds", async () => {
  const { recoveryGateway } = await setup();
  const complete = jest.spyOn(recoveryGateway, "complete");
  await openRecovery();
  await send();
  await verify();
  await screen.findByLabelText("Mật khẩu mới");
  await enterPassword("Recovered2026", "Mismatch2026");
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(complete).not.toHaveBeenCalled();
  await user().clear(screen.getByLabelText("Nhập lại mật khẩu mới"));
  await user().paste(
    screen.getByLabelText("Nhập lại mật khẩu mới"),
    "Recovered2026",
  );
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText("Đặt lại mật khẩu thành công"),
  ).toBeOnTheScreen();
  expect(complete).toHaveBeenCalledTimes(1);
});

test("change delivery cancels the old challenge and clears identifier/code without revealing another contact", async () => {
  const { recoveryGateway } = await setup();
  const cancel = jest.spyOn(recoveryGateway, "cancel");
  await openRecovery();
  await send();
  await user().paste(screen.getByLabelText("Mã xác minh"), "123");
  await user().press(
    screen.getByRole("button", { name: "Đổi email hoặc số điện thoại" }),
  );
  expect(
    screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
  ).toHaveDisplayValue("");
  expect(cancel).toHaveBeenCalledWith("mock-recovery-code-1");
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
});

test("offline request/reset require explicit retry and clear password fields", async () => {
  const { connect, recoveryGateway } = await setup();
  const start = jest.spyOn(recoveryGateway, "start");
  const complete = jest.spyOn(recoveryGateway, "complete");
  await openRecovery();
  await user().paste(
    screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
    "ha@example.invalid",
  );
  await act(() => connect("offline"));
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(start).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(start).not.toHaveBeenCalled();
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await user().press(
    await screen.findByRole("button", { name: "Nhập mã xác minh" }),
  );
  await verify();
  await screen.findByLabelText("Mật khẩu mới");
  await enterPassword();
  await act(() => connect("offline"));
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  expect(complete).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(complete).not.toHaveBeenCalled();
  await enterPassword();
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText("Đặt lại mật khẩu thành công"),
  ).toBeOnTheScreen();
});

test("resend cooldown and rotated OTP work through the real verification form", async () => {
  await setup();
  await openRecovery();
  await send();
  expect(AppState.currentState).toBe("active");
  expect(screen.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
  await act(() => jest.advanceTimersByTime(60_000));
  await user().press(screen.getByRole("button", { name: "Gửi lại mã" }));
  await verify();
  expect(
    await screen.findByText(resolveKnownMessage("MSG16").message),
  ).toBeOnTheScreen();
  await verify("246811");
  expect(await screen.findByLabelText("Mật khẩu mới")).toBeOnTheScreen();
});

test("resent OTP still opens the password form after the first code's expiry", async () => {
  await setup();
  await openRecovery();
  await send();
  await act(() => jest.advanceTimersByTime(60_000));
  await user().press(screen.getByRole("button", { name: "Gửi lại mã" }));
  await act(() => jest.advanceTimersByTime(240_001));

  expect(screen.queryByText("Mã hiện tại đã hết hạn.")).not.toBeOnTheScreen();
  await verify("246811");
  expect(await screen.findByLabelText("Mật khẩu mới")).toBeOnTheScreen();
});

test("adapter offline clears both password fields and permits only explicit reset retry", async () => {
  const { recoveryGateway, connect } = await setup();
  const complete = jest
    .spyOn(recoveryGateway, "complete")
    .mockResolvedValueOnce({ status: "offline" });
  await openRecovery();
  await send();
  await verify();
  await screen.findByLabelText("Mật khẩu mới");
  await enterPassword();
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  expect(screen.getByLabelText("Nhập lại mật khẩu mới")).toHaveDisplayValue("");
  expect(
    screen.queryByText("Đặt lại mật khẩu thành công"),
  ).not.toBeOnTheScreen();
  expect(complete).toHaveBeenCalledTimes(1);
  await act(() => connect("offline"));
  await act(() => connect("online"));
  expect(complete).toHaveBeenCalledTimes(1);

  await enterPassword();
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText("Đặt lại mật khẩu thành công"),
  ).toBeOnTheScreen();
  expect(complete).toHaveBeenCalledTimes(2);
});

test("proof expiry clears password fields and cannot display reset success", async () => {
  await setup();
  await openRecovery();
  await send();
  await verify();
  await screen.findByLabelText("Mật khẩu mới");
  await act(() => jest.advanceTimersByTime(300_000));
  await enterPassword();
  await user().press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG16").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  expect(
    screen.queryByText("Đặt lại mật khẩu thành công"),
  ).not.toBeOnTheScreen();
});

test("duplicate request is blocked; leaving and reopening never restores verified password form", async () => {
  const { recoveryGateway } = await setup();
  const start = recoveryGateway.start;
  const release = deferredResult<void>();
  const entered = deferredResult<void>();
  const spy = jest
    .spyOn(recoveryGateway, "start")
    .mockImplementationOnce(async (...args) => {
      const result = await start(...args);
      entered.resolve();
      await release.promise;
      return result;
    });
  await openRecovery();
  await user().paste(
    screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
    "ha@example.invalid",
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await entered.promise;
  await user().press(
    screen.getByRole("button", { name: "Gửi mã xác minh. Đang xử lý" }),
  );
  expect(spy).toHaveBeenCalledTimes(1);
  await act(() => router.replace("/login"));
  await act(() => release.resolve());
  await openRecovery();
  expect(
    screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
  ).toHaveDisplayValue("");
  expect(screen.queryByLabelText("Mật khẩu mới")).not.toBeOnTheScreen();
});
