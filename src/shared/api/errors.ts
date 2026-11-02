/** Thân lỗi RFC 7807 của OMTS.Api: `code` là mã thông báo SRS (MSG12…), `detail` là chữ hiển thị. */
export type ProblemDetails = {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  /** Mã cũ do backend giữ trong một đợt phát hành khi chuyển catalogue. */
  legacyCode?: string;
  [extension: string]: unknown;
};

/** Server trả lỗi có mã thông báo. `message` là chữ server gửi, hiện nguyên văn cho người dùng. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Các trường mở rộng của problem details (field, retryAfterSeconds, currentRowVersion…). */
  readonly details: ProblemDetails;

  constructor(status: number, code: string, message: string, details: ProblemDetails = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Không gọi được tới server: mất mạng hoặc server không phản hồi. */
export class NetworkError extends Error {
  constructor() {
    super("NETWORK");
    this.name = "NetworkError";
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code || error.details.legacyCode === code);
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
