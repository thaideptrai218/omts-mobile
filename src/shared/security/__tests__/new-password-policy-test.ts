import {
  validateNewPassword,
} from "@/shared/security/new-password-policy";

describe("validateNewPassword", () => {
  test("accepts a matching password with Unicode letters and digits", () => {
    expect(
      validateNewPassword({
        password: "Mậtkhẩu123 ",
        passwordConfirmation: "Mậtkhẩu123 ",
      }),
    ).toEqual({
      data: { password: "Mậtkhẩu123 " },
      isValid: true,
    });
  });

  test.each([
    ["", "Vui lòng nhập mật khẩu."],
    ["abcdefg", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số."],
    ["abcdefgh", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số."],
    ["12345678", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số."],
  ])("rejects an invalid password", (password, expectedError) => {
    const result = validateNewPassword({
      password,
      passwordConfirmation: password,
    });

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errors.password).toBe(expectedError);
    }
  });

  test("requires an exact confirmation without trimming either value", () => {
    const result = validateNewPassword({
      password: "Password1",
      passwordConfirmation: "Password1 ",
    });

    expect(result).toEqual({
      errors: { passwordConfirmation: "Mật khẩu nhập lại chưa khớp." },
      isValid: false,
    });
  });
});
