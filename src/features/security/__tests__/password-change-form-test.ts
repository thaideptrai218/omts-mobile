import {
  validatePasswordChange,
} from "@/features/security/domain/password-change-form";

describe("validatePasswordChange", () => {
  test("returns current and new passwords without trimming", () => {
    expect(
      validatePasswordChange({
        currentPassword: " old-password ",
        password: "NewPassword1 ",
        passwordConfirmation: "NewPassword1 ",
      }),
    ).toEqual({
      data: {
        currentPassword: " old-password ",
        newPassword: "NewPassword1 ",
      },
      isValid: true,
    });
  });

  test("combines current-proof and new-password field errors", () => {
    expect(
      validatePasswordChange({
        currentPassword: "",
        password: "short",
        passwordConfirmation: "different",
      }),
    ).toEqual({
      errors: {
        currentPassword: "Vui lòng nhập mật khẩu hiện tại.",
        password: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.",
        passwordConfirmation: "Mật khẩu nhập lại chưa khớp.",
      },
      isValid: false,
    });
  });
});
