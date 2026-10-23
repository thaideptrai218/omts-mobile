import { Text, AppState } from "react-native";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { SessionAccountScreen } from "@/features/session/screens/session-account-screen";
import { SessionLoginController } from "@/features/auth/components/session-login-controller";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";
import { deferredResult } from "@/shared/testing/deferred-result";
import { SessionFailure } from "@/features/session/domain/mobile-session";

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
  const { snapshot } = useMobileSession();
  if (snapshot.status === "active") return <SessionAccountScreen />;
  if (snapshot.status === "signedOut") return <SessionLoginController />;
  return <Text>Đang kiểm tra phiên</Text>;
}
async function setup(trader = false) {
  let offline = false;
  const server = createMockSessionGateway(() => Date.now());
  if (trader) {
    const signup = await server.registrationGateway.start({
      method: "email",
      identifier: "trader@example.invalid",
      password: MOCK_PASSWORD,
    });
    if (signup.status !== "started") throw new Error("Expected signup");
    const proof = await server.registrationGateway.verify(
      signup.challenge.id,
      "246810",
    );
    if (proof.status !== "verified") throw new Error("Expected proof");
    await server.registrationGateway.complete(proof.proof);
  }
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository,
    isOffline: () => offline,
  });
  await store.login(
    trader ? "trader@example.invalid" : "tran.thu.ha",
    MOCK_PASSWORD,
  );
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
            contactChangeGateway: server.contactChangeGateway,
            setOffline: (value) => {
              offline = value;
            },
          })}
        >
          <Flow />
        </MobileSessionProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>,
  );
  await screen.findByLabelText("Tên hiển thị");
  return {
    ...server,
    store,
    repository,
    connect: (status: ConnectivityStatus) =>
      listeners.forEach((listener) => listener(status)),
  };
}
const user = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
async function open(channel: "email" | "sms" = "email") {
  await user().press(
    screen.getByRole("button", {
      name: channel === "email" ? "Thay đổi email" : "Thêm số điện thoại",
    }),
  );
}
async function start(
  identifier = "new.ha@example.invalid",
  channel: "email" | "sms" = "email",
) {
  await user().paste(
    screen.getByLabelText(
      channel === "email" ? "Email mới" : "Số điện thoại mới",
    ),
    identifier,
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await screen.findByLabelText("Mã xác minh");
}
async function verify(code = "246810") {
  await user().paste(screen.getByLabelText("Mã xác minh"), code);
  await user().press(screen.getByRole("button", { name: "Xác minh" }));
}

test.each([
  {
    channel: "email" as const,
    identifier: "new.ha@example.invalid",
    masked: "n***@example.invalid",
  },
  { channel: "sms" as const, identifier: "0000000999", masked: "******0999" },
])(
  "$channel update preserves the unsaved name and returns verified canonical contact",
  async ({ channel, identifier, masked }) => {
    const { gateway, store } = await setup();
    await user().clear(screen.getByLabelText("Tên hiển thị"));
    await user().paste(screen.getByLabelText("Tên hiển thị"), "Tên đang soạn");
    await open(channel);
    await start(identifier, channel);
    await expect(
      gateway.login(identifier, MOCK_PASSWORD),
    ).rejects.toMatchObject({ code: "credentials" });
    await verify();
    expect(await screen.findByText("Đã cập nhật liên hệ")).toBeOnTheScreen();
    await user().press(screen.getByRole("button", { name: "Về hồ sơ" }));
    expect(screen.getByText(masked)).toBeOnTheScreen();
    expect(screen.getByLabelText("Tên hiển thị")).toHaveDisplayValue(
      "Tên đang soạn",
    );
    await user().press(
      screen.getByRole("button", { name: "Lưu tên hiển thị" }),
    );
    expect(
      await screen.findByText("Hồ sơ cá nhân đã được lưu."),
    ).toBeOnTheScreen();
    expect(store.getSnapshot()).toMatchObject({
      status: "active",
      session: { displayName: "Tên đang soạn" },
    });
    await expect(
      gateway.login(identifier, MOCK_PASSWORD),
    ).resolves.toBeDefined();
  },
);

test("required/unchanged/duplicate contact stays on the form without issuing a usable code", async () => {
  const { contactChangeGateway } = await setup();
  const send = jest.spyOn(contactChangeGateway, "start");
  await open();
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(screen.getByText("Vui lòng nhập email mới.")).toBeOnTheScreen();
  expect(send).not.toHaveBeenCalled();
  for (const identifier of ["ha@example.invalid", "an@example.invalid"]) {
    await user().clear(screen.getByLabelText("Email mới"));
    await user().paste(screen.getByLabelText("Email mới"), identifier);
    await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
    expect(
      await screen.findByText(
        resolveKnownMessage("MSG01", { fieldName: "Email" }).message,
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
  }
});

test("wrong OTP then cancel/reopen keeps old contact and name draft, without reviving the attempt", async () => {
  const { gateway, contactChangeGateway } = await setup();
  const cancel = jest.spyOn(contactChangeGateway, "cancel");
  await user().clear(screen.getByLabelText("Tên hiển thị"));
  await user().paste(screen.getByLabelText("Tên hiển thị"), "Bản nháp giữ lại");
  await open();
  await start();
  await verify("000000");
  expect(
    await screen.findByText(resolveKnownMessage("MSG16").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mã xác minh")).toHaveDisplayValue("");
  await user().press(
    screen.getByRole("button", { name: "Nhập lại liên hệ mới" }),
  );
  await user().press(screen.getByRole("button", { name: "Về hồ sơ" }));
  expect(screen.getByText("h***@example.invalid")).toBeOnTheScreen();
  expect(screen.getByLabelText("Tên hiển thị")).toHaveDisplayValue(
    "Bản nháp giữ lại",
  );
  expect(cancel).toHaveBeenCalledWith("mock-contact-code-1");
  await expect(
    gateway.login("new.ha@example.invalid", MOCK_PASSWORD),
  ).rejects.toMatchObject({ code: "credentials" });
  await open();
  expect(screen.getByLabelText("Email mới")).toHaveDisplayValue("");
});

test("offline start is not queued and a verification can only be retried manually", async () => {
  const { contactChangeGateway, connect } = await setup();
  const send = jest.spyOn(contactChangeGateway, "start");
  const check = jest.spyOn(contactChangeGateway, "verify");
  await open();
  await user().paste(
    screen.getByLabelText("Email mới"),
    "new.ha@example.invalid",
  );
  await act(() => connect("offline"));
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(send).not.toHaveBeenCalled();
  await act(() => connect("online"));
  expect(send).not.toHaveBeenCalled();
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await screen.findByLabelText("Mã xác minh");
  await act(() => connect("offline"));
  await verify();
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(check).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Mã xác minh")).toHaveDisplayValue("");
  await act(() => connect("online"));
  expect(check).not.toHaveBeenCalled();
  await verify();
  expect(await screen.findByText("Đã cập nhật liên hệ")).toBeOnTheScreen();
});

test("expired OTP/resend uses a fresh code and updates only after a correct verify", async () => {
  await setup();
  await open();
  await start();
  await act(() => jest.advanceTimersByTime(300_000));
  expect(screen.getByText("Mã hiện tại đã hết hạn.")).toBeOnTheScreen();
  await user().press(screen.getByRole("button", { name: "Gửi lại mã" }));
  await verify();
  expect(await screen.findByText("Đã cập nhật liên hệ")).toBeOnTheScreen();
});

test("conflict reload is explicit and a changed server name cannot erase the local name draft", async () => {
  const { profileGateway, repository } = await setup();
  await user().clear(screen.getByLabelText("Tên hiển thị"));
  await user().paste(screen.getByLabelText("Tên hiển thị"), "Tên chưa lưu");
  await open();
  const credential = await repository.read();
  if (!credential) throw new Error("Expected credential");
  const current = await profileGateway.load(credential);
  await profileGateway.save(credential, {
    displayName: "Tên từ thiết bị khác",
    expectedRevision: current.revision,
  });
  await user().paste(
    screen.getByLabelText("Email mới"),
    "new.ha@example.invalid",
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(
    await screen.findByText(resolveKnownMessage("MSG06", {}).message),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
  await user().press(
    screen.getByRole("button", { name: "Tải lại và nhập lại liên hệ" }),
  );
  expect(screen.getByLabelText("Email mới")).toHaveDisplayValue("");
  await start();
  await verify();
  await screen.findByText("Đã cập nhật liên hệ");
  await user().press(screen.getByRole("button", { name: "Về hồ sơ" }));
  expect(screen.getByLabelText("Tên hiển thị")).toHaveDisplayValue(
    "Tên chưa lưu",
  );
  expect(
    screen.getByRole("button", { name: "Lưu tên hiển thị" }),
  ).toBeDisabled();
  expect(
    screen.getByText(resolveKnownMessage("MSG06", {}).message),
  ).toBeOnTheScreen();
  await user().press(
    screen.getByRole("button", { name: "Tải lại và bỏ thay đổi" }),
  );
  expect(await screen.findByLabelText("Tên hiển thị")).toHaveDisplayValue(
    "Tên từ thiết bị khác",
  );
});

test("delivery failure preserves the form and old contact for a manual retry", async () => {
  const { contactChangeGateway } = await setup();
  jest
    .spyOn(contactChangeGateway, "start")
    .mockRejectedValueOnce(new Error("Synthetic send failure"));
  await open();
  await user().paste(
    screen.getByLabelText("Email mới"),
    "new.ha@example.invalid",
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(
    await screen.findByText(
      resolveKnownMessage("MSG04", { serviceName: "Dịch vụ xác minh liên hệ" })
        .message,
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Email mới")).toHaveDisplayValue(
    "new.ha@example.invalid",
  );
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  expect(await screen.findByLabelText("Mã xác minh")).toBeOnTheScreen();
});

test("an adapter offline rejection clears code but keeps explicit verification retry available", async () => {
  const { contactChangeGateway } = await setup();
  await open();
  await start();
  const check = jest
    .spyOn(contactChangeGateway, "verify")
    .mockRejectedValueOnce(new SessionFailure("offline"));
  await verify();
  expect(
    await screen.findByText(resolveKnownMessage("MSG07").message),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mã xác minh")).toHaveDisplayValue("");
  expect(check).toHaveBeenCalledTimes(1);
  await verify();
  expect(await screen.findByText("Đã cập nhật liên hệ")).toBeOnTheScreen();
  expect(check).toHaveBeenCalledTimes(2);
});

test("a failed conflict reload preserves the target and keeps blind retry blocked", async () => {
  const { profileGateway, repository } = await setup();
  await open();
  const credential = await repository.read();
  if (!credential) throw new Error("Expected credential");
  const profile = await profileGateway.load(credential);
  await profileGateway.save(credential, {
    displayName: "Tên từ thiết bị khác",
    expectedRevision: profile.revision,
  });
  await user().paste(
    screen.getByLabelText("Email mới"),
    "new.ha@example.invalid",
  );
  await user().press(screen.getByRole("button", { name: "Gửi mã xác minh" }));
  await screen.findByText(resolveKnownMessage("MSG06", {}).message);
  jest
    .spyOn(profileGateway, "load")
    .mockRejectedValueOnce(new Error("Synthetic reload failure"));
  await user().press(
    screen.getByRole("button", { name: "Tải lại và nhập lại liên hệ" }),
  );
  expect(
    await screen.findByText(
      resolveKnownMessage("MSG04", { serviceName: "Dịch vụ xác minh liên hệ" })
        .message,
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Email mới")).toHaveDisplayValue(
    "new.ha@example.invalid",
  );
  expect(screen.getByLabelText("Email mới")).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Gửi mã xác minh" }),
  ).not.toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: "Tải lại và nhập lại liên hệ" }),
  ).toBeEnabled();
});

test("characterizes CONTACT-REV-01: post-save read failure reports unchanged data although contact changed", async () => {
  const { profileGateway, gateway } = await setup();
  await open();
  await start();
  jest
    .spyOn(profileGateway, "load")
    .mockRejectedValueOnce(new Error("Synthetic post-commit read failure"));
  await verify();
  // Characterization of an OPEN defect, not acceptance of this feedback.
  expect(
    await screen.findByText(
      resolveKnownMessage("MSG04", { serviceName: "Dịch vụ xác minh liên hệ" })
        .message,
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Mã xác minh")).toBeOnTheScreen();
  expect(screen.queryByText("Đã cập nhật liên hệ")).not.toBeOnTheScreen();
  await expect(
    gateway.login("new.ha@example.invalid", MOCK_PASSWORD),
  ).resolves.toBeDefined();
  await expect(
    gateway.login("ha@example.invalid", MOCK_PASSWORD),
  ).rejects.toMatchObject({ code: "credentials" });
  await verify();
  expect(
    await screen.findByText(resolveKnownMessage("MSG16").message),
  ).toBeOnTheScreen();
});

test("a Trader can add a phone without gaining Staff permissions", async () => {
  const { store } = await setup(true);
  await open("sms");
  await start("0000000999", "sms");
  await verify();
  await screen.findByText("Đã cập nhật liên hệ");
  await user().press(screen.getByRole("button", { name: "Về hồ sơ" }));
  expect(screen.getByText("******0999")).toBeOnTheScreen();
  expect(screen.getByText("Loại tài khoản: Thương lái")).toBeOnTheScreen();
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { subjectType: "Trader", grants: [], nextAction: "ready" },
  });
});

test("pending verify blocks duplicate presses and a late saved response cannot reopen a logged-out screen", async () => {
  const { store, contactChangeGateway } = await setup();
  await open();
  await start();
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const original = contactChangeGateway.verify;
  const check = jest
    .spyOn(contactChangeGateway, "verify")
    .mockImplementationOnce(async (...args) => {
      const result = await original(...args);
      entered.resolve();
      await release.promise;
      return result;
    });
  await verify();
  await entered.promise;
  const pending = screen.getByRole("button", {
    name: "Xác minh. Đang xác minh",
  });
  expect(pending).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Nhập lại liên hệ mới" }),
  ).toBeDisabled();
  await user().press(pending);
  expect(check).toHaveBeenCalledTimes(1);
  await act(() => store.logout());
  await act(() => release.resolve());
  expect(
    await screen.findByRole("button", { name: "Đăng nhập" }),
  ).toBeOnTheScreen();
  expect(screen.queryByText("Đã cập nhật liên hệ")).not.toBeOnTheScreen();
});

test("an expired session during verification returns to login with MSG19 and no profile mutation", async () => {
  const { gateway, profileGateway, repository } = await setup();
  const credential = await repository.read();
  if (!credential) throw new Error("Expected credential");
  const profile = await profileGateway.load(credential);
  await open();
  await start();
  await gateway.revoke(credential);
  await verify();
  expect(
    await screen.findByText(resolveKnownMessage("MSG19").message),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText("Mã xác minh")).not.toBeOnTheScreen();
  const next = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  expect(await profileGateway.load(next.credential)).toEqual(profile);
});
