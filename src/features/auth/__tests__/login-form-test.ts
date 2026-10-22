import { validateLoginForm } from "@/features/auth/domain/login-form";

describe("login form", () => {
  test("trims the identifier and preserves the password exactly", () => {
    expect(
      validateLoginForm({
        identifier: "  nguyen.an  ",
        password: " temporary password 1 ",
      }),
    ).toEqual({
      credentials: {
        identifier: "nguyen.an",
        password: " temporary password 1 ",
      },
      isValid: true,
    });
  });

  test("returns both required-field errors", () => {
    expect(validateLoginForm({ identifier: "  ", password: "" })).toEqual({
      errors: {
        identifier:
          "Vui lòng nhập tên đăng nhập, số điện thoại hoặc email.",
        password: "Vui lòng nhập mật khẩu.",
      },
      isValid: false,
    });
  });

  test("does not apply the new-password policy to existing credentials", () => {
    expect(
      validateLoginForm({ identifier: "owner", password: "short" }).isValid,
    ).toBe(true);
  });
});
