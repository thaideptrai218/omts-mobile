export const supportedMessageCodes = [
  "MSG01",
  "MSG04",
  "MSG06",
  "MSG07",
  "MSG10",
  "MSG12",
  "MSG13",
  "MSG14",
  "MSG15",
  "MSG16",
  "MSG17",
  "MSG18",
  "MSG19",
  "MSG20",
  "MSG21",
  "MSG22",
  "MSG23",
  "MSG67",
  "MSG68",
  "MSG69",
] as const;

export type MessageCode = (typeof supportedMessageCodes)[number];
export type MessageSeverity = "info" | "success" | "warning" | "danger";

export type ResolvedMessage = {
  code: MessageCode | null;
  message: string;
  severity: MessageSeverity;
  title: string;
};

type MessageParameters = Readonly<{
  fieldName?: string;
  objectName?: string;
  channelName?: string;
  serviceName?: string;
  userName?: string | null;
  time?: string | null;
}>;

type MessageDefinition = Omit<ResolvedMessage, "code" | "message"> & {
  message: (parameters?: MessageParameters) => string;
};

const vietnameseCatalog = {
  MSG01: {
    message: (parameters) =>
      `${parameters?.fieldName ?? "Thông tin được nhập"} chưa hợp lệ. Vui lòng kiểm tra và nhập lại.`,
    severity: "danger",
    title: "Thông tin chưa hợp lệ",
  },
  MSG04: {
    message: (parameters) =>
      `${parameters?.serviceName ?? "Dịch vụ liên quan"} hiện không phản hồi. Thao tác chưa hoàn tất và dữ liệu OMTS không thay đổi; vui lòng thử lại sau.`,
    severity: "danger",
    title: "Dịch vụ tạm thời gián đoạn",
  },
  MSG06: {
    message: (parameters) => {
      const author = parameters?.userName?.trim();
      const time = parameters?.time?.trim();
      const detail = author
        ? ` bởi ${author}${time ? ` lúc ${time}` : ""}`
        : time
          ? ` lúc ${time}`
          : "";
      return `Hồ sơ vừa được cập nhật${detail}. Thay đổi của bạn chưa được lưu. Vui lòng tải lại hồ sơ để kiểm tra trước khi sửa tiếp.`;
    },
    severity: "warning",
    title: "Hồ sơ đã thay đổi",
  },
  MSG07: {
    message: () =>
      "Các thao tác cần Internet tạm thời không khả dụng. Kiểm tra kết nối rồi thử lại.",
    severity: "warning",
    title: "Không có kết nối",
  },
  MSG10: {
    message: (parameters) =>
      `${parameters?.objectName ?? "Thông tin"} đã được lưu.`,
    severity: "success",
    title: "Đã lưu",
  },
  MSG12: {
    message: () =>
      "Thông tin đăng nhập không đúng. Vui lòng kiểm tra và thử lại.",
    severity: "danger",
    title: "Đăng nhập không thành công",
  },
  MSG13: {
    message: () =>
      "Tài khoản này hiện không thể sử dụng. Vui lòng liên hệ kênh hỗ trợ.",
    severity: "danger",
    title: "Không thể truy cập tài khoản",
  },
  MSG14: {
    message: () =>
      "Không thể đăng ký với email hoặc số điện thoại này. Vui lòng đăng nhập hoặc khôi phục tài khoản.",
    severity: "danger",
    title: "Không thể đăng ký",
  },
  MSG15: {
    message: () =>
      "Nếu thông tin hợp lệ, mã xác minh sẽ được gửi tới email hoặc số điện thoại bạn vừa nhập.",
    severity: "info",
    title: "Kiểm tra mã xác minh",
  },
  MSG16: {
    message: () =>
      "Mã xác minh không đúng hoặc đã hết hạn. Bạn có thể nhập lại hoặc yêu cầu mã mới.",
    severity: "danger",
    title: "Không thể xác minh",
  },
  MSG17: {
    message: () =>
      "Mật khẩu hiện tại không đúng. Mật khẩu của bạn chưa được thay đổi.",
    severity: "danger",
    title: "Không thể đổi mật khẩu",
  },
  MSG18: {
    message: () => "Mật khẩu của bạn đã được thay đổi.",
    severity: "success",
    title: "Đổi mật khẩu thành công",
  },
  MSG19: {
    message: () =>
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
    severity: "warning",
    title: "Phiên đăng nhập đã hết hạn",
  },
  MSG20: {
    message: () =>
      "Bạn không thể tự thay đổi tên đăng nhập. Vui lòng liên hệ Chủ hợp tác xã hoặc kênh hỗ trợ.",
    severity: "danger",
    title: "Tên đăng nhập không thể chỉnh sửa",
  },
  MSG21: {
    message: (parameters) =>
      `Kênh ${parameters?.channelName ?? "này"} chưa được cấu hình hoặc thông tin liên hệ chưa đủ điều kiện, nên chưa thể bật.`,
    severity: "danger",
    title: "Kênh chưa thể sử dụng",
  },
  MSG22: {
    message: () =>
      "Thiết bị đã từ chối nhận thông báo đẩy. Các kênh hợp lệ khác vẫn được lưu.",
    severity: "warning",
    title: "Thông báo đẩy đang tắt",
  },
  MSG23: {
    message: () => "Loại thông báo này là bắt buộc và không thể tắt.",
    severity: "danger",
    title: "Thông báo bắt buộc",
  },
  MSG67: {
    message: () =>
      "Tài khoản cần có số điện thoại đã xác minh để tiếp tục sử dụng OMTS. Vui lòng nhập hoặc xác nhận số điện thoại, sau đó nhập mã được gửi qua SMS.",
    severity: "warning",
    title: "Cần xác minh số điện thoại",
  },
  MSG68: {
    message: () =>
      "Mật khẩu tạm thời đã hết hạn. Nhân viên cần liên hệ Chủ hợp tác xã; Chủ hợp tác xã hoặc thương lái cần liên hệ Quản trị viên hệ thống để được cấp lại.",
    severity: "danger",
    title: "Mật khẩu tạm thời đã hết hạn",
  },
  MSG69: {
    message: () =>
      "Bạn đã nhập sai quá số lần cho phép. Vui lòng thử đăng nhập lại sau 15 phút.",
    severity: "danger",
    title: "Đăng nhập tạm thời bị khóa",
  },
} as const satisfies Record<MessageCode, MessageDefinition>;

const supportedCodeSet = new Set<string>(supportedMessageCodes);

const unknownMessage: ResolvedMessage = {
  code: null,
  message:
    "Không thể hoàn tất yêu cầu lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu lỗi tiếp diễn.",
  severity: "danger",
  title: "Đã xảy ra lỗi",
};

export function isMessageCode(value: unknown): value is MessageCode {
  return typeof value === "string" && supportedCodeSet.has(value);
}

function resolveCatalogEntry(
  code: MessageCode,
  parameters?: MessageParameters,
): ResolvedMessage {
  const definition: MessageDefinition = vietnameseCatalog[code];

  return {
    code,
    message: definition.message(parameters),
    severity: definition.severity,
    title: definition.title,
  };
}

export function resolveKnownMessage(
  code: "MSG01",
  parameters: Readonly<{ fieldName: string }>,
): ResolvedMessage;
export function resolveKnownMessage(
  code: "MSG04",
  parameters: Readonly<{ serviceName: string }>,
): ResolvedMessage;
export function resolveKnownMessage(
  code: "MSG06",
  parameters: Readonly<{ userName?: string | null; time?: string | null }>,
): ResolvedMessage;
export function resolveKnownMessage(
  code: "MSG10",
  parameters: Readonly<{ objectName: string }>,
): ResolvedMessage;
export function resolveKnownMessage(
  code: "MSG21",
  parameters: Readonly<{ channelName: string }>,
): ResolvedMessage;
export function resolveKnownMessage(
  code:
    | "MSG07"
    | "MSG12"
    | "MSG13"
    | "MSG14"
    | "MSG15"
    | "MSG16"
    | "MSG17"
    | "MSG18"
    | "MSG19"
    | "MSG20"
    | "MSG22"
    | "MSG23"
    | "MSG67"
    | "MSG68"
    | "MSG69",
): ResolvedMessage;
export function resolveKnownMessage(
  code: MessageCode,
  parameters?: MessageParameters,
): ResolvedMessage {
  return resolveCatalogEntry(code, parameters);
}

export function resolveMessage(code: unknown): ResolvedMessage {
  if (!isMessageCode(code)) {
    return unknownMessage;
  }

  return resolveCatalogEntry(code);
}
