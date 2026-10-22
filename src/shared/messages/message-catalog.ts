export const supportedMessageCodes = [
  "MSG01",
  "MSG04",
  "MSG07",
  "MSG12",
  "MSG13",
  "MSG15",
  "MSG16",
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
  serviceName?: string;
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
  MSG07: {
    message: () =>
      "Các thao tác cần Internet tạm thời không khả dụng. Kiểm tra kết nối rồi thử lại.",
    severity: "warning",
    title: "Không có kết nối",
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
  code:
    | "MSG07"
    | "MSG12"
    | "MSG13"
    | "MSG15"
    | "MSG16"
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
