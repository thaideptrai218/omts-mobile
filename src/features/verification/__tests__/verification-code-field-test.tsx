import { useState } from "react";
import {
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

import {
  VerificationCodeField,
} from "@/features/verification/components/verification-code-field";
import { normalizeVerificationCode } from "@/features/verification/domain/verification-code";

function ControlledVerificationCodeField() {
  const [code, setCode] = useState("");

  return (
    <VerificationCodeField
      label="Mã xác minh gồm 6 số"
      onChangeCode={setCode}
      value={code}
    />
  );
}

describe("VerificationCodeField", () => {
  test.each([
    ["123456", "123456"],
    ["12a34-56", "123456"],
    ["１２３", ""],
    ["123456789", "123456"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeVerificationCode(input)).toBe(expected);
  });

  test("accepts a complete pasted code through one canonical input", async () => {
    const user = userEvent.setup();

    await render(<ControlledVerificationCodeField />);
    const input = screen.getByLabelText("Mã xác minh gồm 6 số");

    await user.paste(input, "123456");

    expect(input).toHaveDisplayValue("123456");
    expect(input).toHaveProp("inputMode", "numeric");
    expect(input).toHaveProp("textContentType", "oneTimeCode");
  });

  test("exposes validation feedback through the canonical input", async () => {
    await render(
      <VerificationCodeField
        errorMessage="Mã xác minh phải có đủ 6 số."
        onChangeCode={jest.fn()}
        value="123"
      />,
    );

    expect(screen.getByLabelText("Mã xác minh")).toHaveProp(
      "accessibilityHint",
      "Mã xác minh phải có đủ 6 số.",
    );
    expect(
      screen.getByText("Mã xác minh phải có đủ 6 số."),
    ).toBeOnTheScreen();
  });

  test("does not expose six decorative cells as separate inputs", async () => {
    await render(
      <VerificationCodeField onChangeCode={jest.fn()} value="123" />,
    );

    expect(screen.getAllByLabelText("Mã xác minh")).toHaveLength(1);
  });
});
