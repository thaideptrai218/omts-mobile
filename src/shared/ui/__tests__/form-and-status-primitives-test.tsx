import { useState } from "react";
import {
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

import { InlineStatus } from "@/shared/ui/inline-status";
import { PasswordField } from "@/shared/ui/password-field";
import { Skeleton, SkeletonGroup } from "@/shared/ui/skeleton";
import { TextField } from "@/shared/ui/text-field";

function ControlledTextField() {
  const [value, setValue] = useState("");

  return (
    <TextField
      label="Tên đăng nhập"
      onChangeText={setValue}
      value={value}
    />
  );
}

describe("shared form and status primitives", () => {
  test("TextField keeps the value controlled by its feature", async () => {
    const user = userEvent.setup();

    await render(<ControlledTextField />);
    const input = screen.getByLabelText("Tên đăng nhập");

    await user.type(input, "nguyen.an");

    expect(input).toHaveDisplayValue("nguyen.an");
  });

  test("TextField exposes its validation message to the input", async () => {
    await render(
      <TextField
        errorMessage="Số điện thoại không hợp lệ."
        label="Số điện thoại"
        value="012"
      />,
    );

    expect(screen.getByLabelText("Số điện thoại")).toHaveProp(
      "accessibilityHint",
      "Số điện thoại không hợp lệ.",
    );
    expect(screen.getByText("Số điện thoại không hợp lệ.")).toBeOnTheScreen();
  });

  test("PasswordField toggles secure entry from an accessible action", async () => {
    const user = userEvent.setup();

    await render(<PasswordField label="Mật khẩu" value="secret123" />);
    const input = screen.getByLabelText("Mật khẩu");

    expect(input).toHaveProp("secureTextEntry", true);
    await user.press(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(input).toHaveProp("secureTextEntry", false);
    expect(
      screen.getByRole("button", { name: "Ẩn mật khẩu" }),
    ).toBeOnTheScreen();
  });

  test("InlineStatus provides a textual accessible status", async () => {
    await render(<InlineStatus label="Đã xác minh" variant="success" />);

    expect(screen.getByLabelText("Trạng thái: Đã xác minh")).toBeOnTheScreen();
  });

  test("SkeletonGroup exposes one loading status instead of every shape", async () => {
    await render(
      <SkeletonGroup label="Đang tải hồ sơ">
        <Skeleton height={24} />
        <Skeleton height={52} width="70%" />
      </SkeletonGroup>,
    );

    expect(
      screen.getByRole("progressbar", { name: "Đang tải hồ sơ" }),
    ).toHaveAccessibilityValue({ text: "Đang tải hồ sơ" });
  });
});
