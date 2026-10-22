import { render, screen, userEvent } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PasswordChangeController } from "@/features/security/components/password-change-controller";

const safeAreaMetrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 34, left: 0, right: 0, top: 47 },
};

describe("PasswordChangeController integration", () => {
  test("wires forced-mode UI to the service and clears rejected secrets", async () => {
    const user = userEvent.setup();
    const service = {
      change: jest
        .fn()
        .mockResolvedValue({ status: "current-password-invalid" as const }),
    };

    await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <PasswordChangeController
          mode="forced"
          onChanged={jest.fn()}
          onSessionExpired={jest.fn()}
          service={service}
        />
      </SafeAreaProvider>,
    );

    await user.type(screen.getByLabelText("Mật khẩu tạm thời"), "Temporary1");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPassword1");
    await user.type(
      screen.getByLabelText("Nhập lại mật khẩu mới"),
      "NewPassword1",
    );
    await user.press(
      screen.getByRole("button", { name: "Tạo mật khẩu và tiếp tục" }),
    );

    expect(await screen.findByText("Không thể đổi mật khẩu")).toBeOnTheScreen();
    expect(screen.getByLabelText("Mật khẩu tạm thời")).toHaveDisplayValue("");
    expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  });

  test("clears standard-mode secrets before delegating cancel", async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();

    await render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <PasswordChangeController
          mode="standard"
          onCancel={onCancel}
          onChanged={jest.fn()}
          onSessionExpired={jest.fn()}
          service={{
            change: jest.fn().mockResolvedValue({ status: "changed" as const }),
          }}
        />
      </SafeAreaProvider>,
    );

    await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "Current1");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "NewPassword1");
    await user.press(screen.getByRole("button", { name: "Hủy" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toHaveDisplayValue("");
    expect(screen.getByLabelText("Mật khẩu mới")).toHaveDisplayValue("");
  });
});
