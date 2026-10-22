import { validateTraderRegistration } from "@/features/registration/domain/registration-form";

describe("trader registration form", () => {
  test("normalizes the identifier but preserves the password exactly", () => {
    const result = validateTraderRegistration({
      identifier: "  trader@example.com  ",
      method: "email",
      password: "Mậtkhẩu123 ",
      passwordConfirmation: "Mậtkhẩu123 ",
    });

    expect(result).toEqual({
      data: {
        identifier: "trader@example.com",
        method: "email",
        password: "Mậtkhẩu123 ",
      },
      isValid: true,
    });
  });

  test.each([
    ["short1", "too short"],
    ["onlyletters", "without a number"],
    ["12345678", "without a letter"],
  ])("rejects password %s when it is %s", (password) => {
    const result = validateTraderRegistration({
      identifier: "0901234567",
      method: "phone",
      password,
      passwordConfirmation: password,
    });

    expect(result).toMatchObject({
      errors: {
        password: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.",
      },
      isValid: false,
    });
  });

  test("returns field-specific required and mismatch errors", () => {
    const result = validateTraderRegistration({
      identifier: "   ",
      method: "phone",
      password: "Password1",
      passwordConfirmation: "Password2",
    });

    expect(result).toEqual({
      errors: {
        identifier: "Vui lòng nhập số điện thoại.",
        passwordConfirmation: "Mật khẩu nhập lại chưa khớp.",
      },
      isValid: false,
    });
  });

  test("does not invent email or phone format rules absent from the contract", () => {
    const result = validateTraderRegistration({
      identifier: "format-is-validated-by-the-endpoint-adapter",
      method: "email",
      password: "Password1",
      passwordConfirmation: "Password1",
    });

    expect(result.isValid).toBe(true);
  });
});
