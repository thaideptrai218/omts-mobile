import { render, screen, userEvent } from "@testing-library/react-native";

import { RegistrationMethodSelector } from "@/features/registration/components/registration-method-selector";

describe("RegistrationMethodSelector", () => {
  test("exposes one selected registration method", async () => {
    await render(
      <RegistrationMethodSelector onChange={jest.fn()} value="email" />,
    );

    expect(screen.getByText("Đăng ký bằng")).toBeOnTheScreen();
    expect(screen.getByRole("radio", { name: "Email" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Số điện thoại" }),
    ).not.toBeChecked();
  });

  test("reports an explicit channel change", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    await render(
      <RegistrationMethodSelector onChange={onChange} value="email" />,
    );
    await user.press(screen.getByRole("radio", { name: "Số điện thoại" }));

    expect(onChange).toHaveBeenCalledWith("phone");
  });

  test("prevents changing method while disabled", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    await render(
      <RegistrationMethodSelector
        disabled
        onChange={onChange}
        value="email"
      />,
    );
    await user.press(screen.getByRole("radio", { name: "Số điện thoại" }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
