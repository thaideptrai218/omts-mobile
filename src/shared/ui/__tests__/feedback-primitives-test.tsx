import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

import { AppButton } from "@/shared/ui/app-button";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";
import { ContentState } from "@/shared/ui/content-state";
import { MessageBanner } from "@/shared/ui/message-banner";

describe("shared feedback primitives", () => {
  test("AppButton sends one press through its accessible action", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    await render(<AppButton label="Lưu thay đổi" onPress={onPress} />);

    await user.press(
      screen.getByRole("button", { name: "Lưu thay đổi" }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("AppButton exposes busy and disabled state while loading", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    await render(
      <AppButton
        label="Lưu thay đổi"
        loading
        loadingLabel="Đang lưu"
        onPress={onPress}
      />,
    );

    const button = screen.getByRole("button", {
      name: "Lưu thay đổi. Đang lưu",
    });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();

    await user.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  test("danger MessageBanner exposes one alert with complete meaning", async () => {
    await render(
      <MessageBanner
        message="Không thể tải dữ liệu."
        title="Mất kết nối"
        variant="danger"
      />,
    );

    expect(
      screen.getByRole("alert", {
        name: "Mất kết nối. Không thể tải dữ liệu.",
      }),
    ).toBeOnTheScreen();
  });

  test("ContentState only renders an action when the feature supplies one", async () => {
    await render(
      <ContentState
        description="Danh sách sẽ xuất hiện tại đây."
        title="Chưa có dữ liệu"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeOnTheScreen();
  });

  test("ConfirmationDialog routes cancel through its visible action", async () => {
    const onCancel = jest.fn();

    await render(
      <ConfirmationDialog
        confirmLabel="Đăng xuất"
        confirmVariant="danger"
        description="Phiên làm việc trên thiết bị này sẽ kết thúc."
        onCancel={onCancel}
        onConfirm={jest.fn()}
        title="Xác nhận đăng xuất"
        visible
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Hủy" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
