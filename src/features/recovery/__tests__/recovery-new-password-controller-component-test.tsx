import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RecoveryNewPasswordController } from "@/features/recovery/components/recovery-new-password-controller";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

describe("RecoveryNewPasswordController integration", () => {
  test("keeps recovery proof outside screen props and clears an invalid attempt", async () => {
    const user = userEvent.setup();
    const service = {
      complete: jest
        .fn()
        .mockResolvedValue({ status: "attempt-invalid" as const }),
    };

    await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <RecoveryNewPasswordController
          onBackToLogin={jest.fn()}
          onCompleted={jest.fn()}
          service={service}
        />
      </SafeAreaProvider>,
    );

    await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPassword1");
    await user.type(
      screen.getByLabelText("Nhập lại mật khẩu mới"),
      "NewPassword1",
    );
    await user.press(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    expect(await screen.findByText("Không thể xác minh")).toBeOnTheScreen();
    expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
    expect(screen.getByLabelText("Nhập lại mật khẩu mới")).toHaveDisplayValue("");
  });

  test("clears secrets before delegating back-to-login navigation", async () => {
    const user = userEvent.setup();
    const onBackToLogin = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <RecoveryNewPasswordController
          onBackToLogin={onBackToLogin}
          onCompleted={jest.fn()}
          service={{
            complete: jest.fn().mockResolvedValue({ status: "completed" as const }),
          }}
        />
      </SafeAreaProvider>,
    );

    await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPassword1");
    await user.press(
      screen.getByRole("button", { name: "Quay lại đăng nhập" }),
    );

    expect(onBackToLogin).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  });
});
