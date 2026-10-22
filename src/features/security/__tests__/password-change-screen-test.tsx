import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PasswordChangeScreen } from "@/features/security/screens/password-change-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const baseProps = {
  onChangeCurrentPassword: jest.fn(),
  onChangePassword: jest.fn(),
  onChangePasswordConfirmation: jest.fn(),
  onSave: jest.fn(),
  values: {
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  },
};

type ForcedScreenProps = Extract<
  React.ComponentProps<typeof PasswordChangeScreen>,
  { mode: "forced" }
>;

async function renderForcedScreen(
  overrides: Partial<Omit<ForcedScreenProps, "mode">> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <PasswordChangeScreen
        {...baseProps}
        mode="forced"
        {...overrides}
      />
    </SafeAreaProvider>,
  );
}

describe("PasswordChangeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("forced mode explains the gate and exposes no cancel action", async () => {
    await renderForcedScreen();

    expect(screen.getByText("Yêu cầu bảo mật")).toBeOnTheScreen();
    expect(screen.getByLabelText("Mật khẩu tạm thời")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Hủy" })).not.toBeOnTheScreen();
  });

  test("standard mode allows the user to cancel back to the account area", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <PasswordChangeScreen
          {...baseProps}
          mode="standard"
          onCancel={onCancel}
        />
      </SafeAreaProvider>,
    );
    await user.press(screen.getByRole("button", { name: "Hủy" }));

    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeOnTheScreen();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("submits the current proof and new-password form through callbacks", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();

    await renderForcedScreen({ onSave });
    await user.type(screen.getByLabelText("Mật khẩu tạm thời"), "Temporary1");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPassword1");
    await user.type(
      screen.getByLabelText("Nhập lại mật khẩu mới"),
      "NewPassword1",
    );
    await user.press(
      screen.getByRole("button", { name: "Tạo mật khẩu và tiếp tục" }),
    );

    expect(baseProps.onChangeCurrentPassword).toHaveBeenCalled();
    expect(baseProps.onChangePassword).toHaveBeenCalled();
    expect(baseProps.onChangePasswordConfirmation).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("shows typed feedback and locks the form while saving", async () => {
    await renderForcedScreen({
      feedback: resolveKnownMessage("MSG17"),
      pending: true,
    });

    expect(screen.getByText("Không thể đổi mật khẩu")).toBeOnTheScreen();
    expect(screen.getByLabelText("Mật khẩu tạm thời")).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Tạo mật khẩu và tiếp tục. Đang lưu mật khẩu",
      }),
    ).toBeDisabled();
  });
});
