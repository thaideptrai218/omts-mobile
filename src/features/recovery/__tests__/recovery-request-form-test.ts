import { validateRecoveryRequest } from "@/features/recovery/domain/recovery-request-form";

describe("recovery request form", () => {
  test("trims a supplied verified identifier", () => {
    expect(
      validateRecoveryRequest({ identifier: "  trader@example.com  " }),
    ).toEqual({ identifier: "trader@example.com", isValid: true });
  });

  test("rejects only a missing identifier locally", () => {
    expect(validateRecoveryRequest({ identifier: "  " })).toEqual({
      errors: {
        identifier: "Vui lòng nhập email hoặc số điện thoại đã xác minh.",
      },
      isValid: false,
    });
  });

  test("does not infer whether an account exists", () => {
    expect(
      validateRecoveryRequest({ identifier: "unknown@example.com" }).isValid,
    ).toBe(true);
  });
});
