import type { CheckoutOrderParams } from "@/models/Zalo";

/** Trạng thái khoản trả của một lần thanh toán, theo danh mục trạng thái của backend. */
export type TraderCheckoutPaymentCode = "PENDING_TRANSFER" | "COMPLETED" | "CANCELLED";

/** Mã QR của link payOS: app tự vẽ từ `content`, không mở trang của payOS. Các trường còn lại để chép khi không quét được. */
export type TraderCheckoutQr = {
  /** Chuỗi VietQR. */
  content: string;
  bankBin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  /** Nội dung chuyển khoản: mã của khoản trả. */
  transferContent: string;
};

/**
 * Một lần thương lái trả hóa đơn qua Checkout SDK của Zalo và payOS (`api/me/checkouts/{id}`). App chỉ hiện trạng thái
 * server trả về, không tự quyết định là đã trả tiền (CLAUDE.md mục 10).
 */
export type TraderCheckout = {
  id: string;
  invoiceId: string;
  invoiceCode: string;
  paymentCode: string;
  amount: number;
  paymentStatusId: number;
  paymentStatusCode: TraderCheckoutPaymentCode | string;
  paymentStatus: string;
  /** Số tiền đã về khi khoản trả hoàn tất; nhỏ hơn `amount` là trả một phần. */
  receivedAmount: number | null;
  paidInFull: boolean;
  /** Khoản trả vẫn chờ nhưng link payOS đã hết hạn: phải tạo lần thanh toán mới. */
  expired: boolean;
  expiresAt: string;
  qr: TraderCheckoutQr;
  /** Tham số `CheckoutSDK.createOrder` server đã ký, app truyền nguyên vẹn. */
  checkout: CheckoutOrderParams;
  /** Đã gửi mã đơn của Zalo (`PAY_BY_CUSTOM_METHOD`): người dùng đã xác nhận trên trang thanh toán của Zalo. */
  zaloOrderLinked: boolean;
  zaloReported: boolean;
};

export type LinkZaloOrder = {
  zaloOrderId: string;
};
