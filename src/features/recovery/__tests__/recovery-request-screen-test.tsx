import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RecoveryRequestScreen } from "@/features/recovery/screens/recovery-request-screen";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

const defaultProps = {
  onBackToLogin: jest.fn(),
  onChangeIdentifier: jest.fn(),
  onContinueToVerification: jest.fn(),
  onSendCode: jest.fn(),
  values: { identifier: "" },
};

async function renderScreen(
  overrides: Partial<React.ComponentProps<typeof RecoveryRequestScreen>> = {},
) {
  return render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <RecoveryRequestScreen {...defaultProps} {...overrides} />
    </SafeAreaProvider>,
  );
}

describe("RecoveryRequestScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("collects one verified identifier without choosing an account type", async () => {
    const user = userEvent.setup();
    const onChangeIdentifier = jest.fn();

    await renderScreen({ onChangeIdentifier });
    await user.type(
      screen.getByLabelText("Email hoặc số điện thoại đã xác minh"),
      "user@example.com",
    );

    expect(onChangeIdentifier).toHaveBeenCalled();
  });

  test("shows the same generic response after a recovery request", async () => {
    await renderScreen({ genericResponseVisible: true });

    expect(screen.getByText("Kiểm tra mã xác minh")).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Nếu thông tin hợp lệ, mã xác minh sẽ được gửi tới email hoặc số điện thoại bạn vừa nhập.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/không tồn tại/i)).not.toBeOnTheScreen();
  });

  test("always exposes the same verification action after MSG15", async () => {
    const user = userEvent.setup();
    const onContinueToVerification = jest.fn();

    await renderScreen({
      genericResponseVisible: true,
      onContinueToVerification,
    });
    await user.press(
      screen.getByRole("button", { name: "Nhập mã xác minh" }),
    );

    expect(onContinueToVerification).toHaveBeenCalledTimes(1);
  });

  test("locks submission and navigation while pending", async () => {
    await renderScreen({ pending: true });

    expect(
      screen.getByRole("button", {
        name: "Gửi mã xác minh. Đang xử lý",
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Quay lại đăng nhập" }),
    ).toBeDisabled();
  });
});
