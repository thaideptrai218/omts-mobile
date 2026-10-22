import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RecoveryNewPasswordScreen } from "@/features/recovery/screens/recovery-new-password-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const defaultProps = {
  onBackToLogin: jest.fn(),
  onChangePassword: jest.fn(),
  onChangePasswordConfirmation: jest.fn(),
  onResetPassword: jest.fn(),
  values: { password: "", passwordConfirmation: "" },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof RecoveryNewPasswordScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <RecoveryNewPasswordScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("RecoveryNewPasswordScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("collects both password values and submits through callbacks", async () => {
    const user = userEvent.setup();
    const onChangePassword = jest.fn();
    const onChangePasswordConfirmation = jest.fn();
    const onResetPassword = jest.fn();

    await renderScreen({
      onChangePassword,
      onChangePasswordConfirmation,
      onResetPassword,
    });

    await user.type(screen.getByLabelText("Mật khẩu mới"), "Password1");
    await user.type(
      screen.getByLabelText("Nhập lại mật khẩu mới"),
      "Password1",
    );
    await user.press(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    );

    expect(onChangePassword).toHaveBeenCalled();
    expect(onChangePasswordConfirmation).toHaveBeenCalled();
    expect(onResetPassword).toHaveBeenCalledTimes(1);
  });

  test("shows field-level validation without discarding the screen", async () => {
    await renderScreen({
      errors: {
        password: "Mật khẩu chưa hợp lệ.",
        passwordConfirmation: "Mật khẩu nhập lại chưa khớp.",
      },
    });

    expect(screen.getByText("Mật khẩu chưa hợp lệ.")).toBeOnTheScreen();
    expect(
      screen.getByText("Mật khẩu nhập lại chưa khớp."),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("recovery-new-password-screen")).toBeOnTheScreen();
  });

  test("renders controller feedback through the safe message contract", async () => {
    await renderScreen({
      feedback: resolveKnownMessage("MSG01", { fieldName: "Mật khẩu mới" }),
    });

    expect(screen.getByText("Thông tin chưa hợp lệ")).toBeOnTheScreen();
    expect(
      screen.getByText(/Mật khẩu mới chưa hợp lệ/),
    ).toBeOnTheScreen();
  });

  test("locks editing and navigation while reset is pending", async () => {
    await renderScreen({ pending: true });

    expect(screen.getByLabelText("Mật khẩu mới")).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Đặt lại mật khẩu. Đang đặt lại",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Quay lại đăng nhập" }),
    ).toBeDisabled();
  });
});
