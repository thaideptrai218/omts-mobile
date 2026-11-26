// Đọc ảnh bằng Gemini trên máy chủ theo kiểu gửi rồi hỏi lại: POST ảnh trả scanId, GET scanId cho tới khi xong.

/** Trạng thái một lần quét ảnh trên màn hình. */
export type ScanStatus = "idle" | "uploading" | "reading" | "done" | "failed";

/** Phản hồi 202 khi gửi ảnh. */
export type ScanStarted = {
  scanId: string;
};

/** Lý do máy chủ không đọc được ảnh. */
export type ScanErrorCode = "UNAVAILABLE" | "TIMEOUT" | "BAD_RESPONSE" | "NOT_CONFIGURED";

/** Phản hồi khi hỏi kết quả; `reading` chỉ có khi `status` là "Done". */
export type ScanPoll<T> = {
  status: "Pending" | "Done" | "Failed";
  errorCode: ScanErrorCode | null;
  reading: T | null;
};

/** Trạng thái và kết quả của hook `useScanJob`. */
export type ScanJob<T> = {
  status: ScanStatus;
  result: T | null;
  /** Thông báo tiếng Việt, luôn nhắc vẫn nhập tay được; rỗng khi không lỗi. */
  error: string;
  /** Gửi ảnh và bắt đầu đọc. */
  begin: (photo: Blob) => void;
  /** Hủy lần đọc đang chạy, về trạng thái idle. */
  cancel: () => void;
  /** Gửi lại ảnh vừa rồi (sau lỗi). */
  retry: () => void;
};
