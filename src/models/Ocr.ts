/** Ảnh cần đọc chữ trên thiết bị (tesseract.js). */
export type OcrRequest = {
  image: File | Blob | string;
  signal: AbortSignal;
  /** Tiến độ 0 đến 100, gồm cả lúc tải mô hình chữ. */
  onProgress: (progress: number) => void;
  /**
   * `block` (mặc định của tesseract.js): cả ảnh là một khối chữ, hợp với giấy tờ của bè. `table`: một cột gồm các dòng
   * cỡ chữ khác nhau, đọc từng hàng của bảng đã xóa đường kẻ; thử 25/11/2026 thì chế độ này giữ đúng hàng, còn chế độ tự
   * chia vùng hay đọc hết cột vĩ độ rồi mới tới cột kinh độ.
   */
  layout?: "block" | "table";
  /** Quá thời gian này thì báo lỗi, mặc định 60 giây. */
  timeoutMs?: number;
};

export type OcrText = {
  text: string;
  /** Độ tin cậy trung bình 0 đến 100 của tesseract. */
  confidence: number;
};
