import { validateProfileForm } from "@/features/profile/domain/profile-form";

describe("validateProfileForm", () => {
  test("trims the editable display name", () => {
    expect(validateProfileForm({ displayName: "  Lê Minh Hải  " })).toEqual({
      data: { displayName: "Lê Minh Hải" },
      isValid: true,
    });
  });

  test("rejects an empty display name", () => {
    expect(validateProfileForm({ displayName: "   " })).toEqual({
      errors: { displayName: "Vui lòng nhập tên hiển thị." },
      isValid: false,
    });
  });
});
