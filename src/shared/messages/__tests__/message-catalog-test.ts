import {
  isMessageCode,
  resolveKnownMessage,
  resolveMessage,
} from "@/shared/messages/message-catalog";

describe("message catalog", () => {
  test("resolves a supported code into display-ready Vietnamese content", () => {
    const message = resolveMessage("MSG07");

    expect(message).toEqual({
      code: "MSG07",
      message:
        "Các thao tác cần Internet tạm thời không khả dụng. Kiểm tra kết nối rồi thử lại.",
      severity: "warning",
      title: "Không có kết nối",
    });
  });

  test("renders trusted feature context for parameterized messages", () => {
    expect(
      resolveKnownMessage("MSG01", { fieldName: "Mã xác minh" }).message,
    ).toBe(
      "Mã xác minh chưa hợp lệ. Vui lòng kiểm tra và nhập lại.",
    );
    expect(
      resolveKnownMessage("MSG04", {
        serviceName: "Dịch vụ gửi mã xác minh",
      }).message,
    ).toContain("Dịch vụ gửi mã xác minh hiện không phản hồi");
  });

  test("resolves the verification failure code without server prose", () => {
    const message = resolveMessage("MSG16");

    expect(message.code).toBe("MSG16");
    expect(message.title).toBe("Không thể xác minh");
    expect(message.message).toContain("không đúng hoặc đã hết hạn");
  });

  test.each([
    ["MSG12", "Đăng nhập không thành công", "danger"],
    ["MSG13", "Không thể truy cập tài khoản", "danger"],
    ["MSG15", "Kiểm tra mã xác minh", "info"],
    ["MSG67", "Cần xác minh số điện thoại", "warning"],
    ["MSG68", "Mật khẩu tạm thời đã hết hạn", "danger"],
    ["MSG69", "Đăng nhập tạm thời bị khóa", "danger"],
  ] as const)("resolves login outcome %s", (code, title, severity) => {
    expect(resolveKnownMessage(code)).toMatchObject({
      code,
      severity,
      title,
    });
  });

  test("returns a safe fallback without echoing an unknown server value", () => {
    const rawServerValue = "INTERNAL_DATABASE_TIMEOUT";
    const message = resolveMessage(rawServerValue);

    expect(isMessageCode(rawServerValue)).toBe(false);
    expect(message.code).toBeNull();
    expect(message.message).not.toContain(rawServerValue);
    expect(message.severity).toBe("danger");
  });
});
