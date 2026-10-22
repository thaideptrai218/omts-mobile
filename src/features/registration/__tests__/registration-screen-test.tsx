import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { RegistrationFormValues } from "@/features/registration/domain/registration-form";
import { RegistrationScreen } from "@/features/registration/screens/registration-screen";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const values: RegistrationFormValues = {
  identifier: "",
  method: "email",
  password: "",
  passwordConfirmation: "",
};

const defaultProps = {
  onChangeIdentifier: jest.fn(),
  onChangeMethod: jest.fn(),
  onChangePassword: jest.fn(),
  onChangePasswordConfirmation: jest.fn(),
  onContinue: jest.fn(),
  onOpenLogin: jest.fn(),
  values,
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof RegistrationScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <RegistrationScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("RegistrationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("configures the identifier field for the selected method", async () => {
    await renderScreen();
    const email = screen.getByLabelText("Email");

    expect(email).toHaveProp("keyboardType", "email-address");
    expect(email).toHaveProp("autoComplete", "email");

    await renderScreen({ values: { ...values, method: "phone" } });
    const phone = screen.getByLabelText("Số điện thoại");

    expect(phone).toHaveProp("keyboardType", "phone-pad");
    expect(phone).toHaveProp("autoComplete", "tel");
  });

  test("reports controlled field edits and continue action", async () => {
    const user = userEvent.setup();
    const onChangeIdentifier = jest.fn();
    const onContinue = jest.fn();

    await renderScreen({ onChangeIdentifier, onContinue });
    await user.type(screen.getByLabelText("Email"), "a@b.vn");
    await user.press(
      screen.getByRole("button", { name: "Tiếp tục xác minh" }),
    );

    expect(onChangeIdentifier).toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test("shows field errors next to their inputs", async () => {
    await renderScreen({
      errors: {
        identifier: "Vui lòng nhập email.",
        password: "Mật khẩu chưa hợp lệ.",
        passwordConfirmation: "Mật khẩu nhập lại chưa khớp.",
      },
    });

    expect(screen.getByLabelText("Email")).toHaveProp(
      "accessibilityHint",
      "Vui lòng nhập email.",
    );
    expect(screen.getByText("Mật khẩu chưa hợp lệ.")).toBeOnTheScreen();
    expect(
      screen.getByText("Mật khẩu nhập lại chưa khớp."),
    ).toBeOnTheScreen();
  });

  test("locks fields and navigation while pending", async () => {
    await renderScreen({ pending: true });

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Tiếp tục xác minh. Đang kiểm tra",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Đã có tài khoản? Đăng nhập" }),
    ).toBeDisabled();
  });
});
