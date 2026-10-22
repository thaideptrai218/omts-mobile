import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoginScreen } from "@/features/auth/screens/login-screen";
import { resolveKnownMessage } from "@/shared/messages/message-catalog";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const defaultProps = {
  onChangeIdentifier: jest.fn(),
  onChangePassword: jest.fn(),
  onLogin: jest.fn(),
  onOpenPublicQr: jest.fn(),
  onOpenRecovery: jest.fn(),
  onOpenRegistration: jest.fn(),
  values: { identifier: "", password: "" },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof LoginScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <LoginScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses login autofill without applying identifier-specific hints", async () => {
    await renderScreen();
    const identifier = screen.getByLabelText(
      "Tên đăng nhập, số điện thoại hoặc email",
    );

    expect(identifier).toHaveProp("autoComplete", "username");
    expect(identifier).toHaveProp("textContentType", "username");
    expect(screen.getByLabelText("Mật khẩu")).toHaveProp(
      "autoComplete",
      "current-password",
    );
  });

  test("exposes every SCR-03 navigation action", async () => {
    const user = userEvent.setup();
    const onOpenRecovery = jest.fn();
    const onOpenRegistration = jest.fn();
    const onOpenPublicQr = jest.fn();

    await renderScreen({
      onOpenPublicQr,
      onOpenRecovery,
      onOpenRegistration,
    });
    await user.press(screen.getByRole("button", { name: "Quên mật khẩu" }));
    await user.press(
      screen.getByRole("button", { name: "Đăng ký tài khoản thương lái" }),
    );
    await user.press(
      screen.getByRole("button", { name: "Tra cứu nguồn gốc bằng QR" }),
    );

    expect(onOpenRecovery).toHaveBeenCalledTimes(1);
    expect(onOpenRegistration).toHaveBeenCalledTimes(1);
    expect(onOpenPublicQr).toHaveBeenCalledTimes(1);
  });

  test("renders generic login failure without identifying a bad field", async () => {
    await renderScreen({ feedback: resolveKnownMessage("MSG12") });

    expect(screen.getByText("Đăng nhập không thành công")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Thông tin đăng nhập không đúng. Vui lòng kiểm tra và thử lại.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/tên đăng nhập sai/i)).not.toBeOnTheScreen();
  });

  test("locks all actions while login is pending", async () => {
    await renderScreen({ pending: true });

    expect(
      screen.getByRole("button", { name: "Đăng nhập. Đang đăng nhập" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Quên mật khẩu" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Tra cứu nguồn gốc bằng QR" }),
    ).toBeDisabled();
  });
});
