import type { QualityClaimOffer, QualityClaimSending, QualityClaimStatusFilter } from "@/features/claims/models/QualityClaim";
import type { Label } from "@/models/UI";

/** Mã trạng thái của khiếu nại trong danh mục Status (STD-QUALITY-CLAIM). Phản hồi rồi thì không đổi được (BR-CLAIM-02). */
export const CLAIM_STATUS = { awaiting: 3701, rejected: 3702, accepted: 3703 } as const;

/** Hóa đơn bán đã hủy (STD-SALES-INVOICE). */
export const INVOICE_CANCELLED = 3502;

/** Trạng thái giao tin nhắn cho thương lái (STD-MESSAGE-DELIVERY). */
const DELIVERY = { sending: 1601, sent: 1602, notSent: 1603 } as const;

/** Tin nhắn không gửi được: HTX cần gọi điện báo (GFR-06). */
export const SENDING_NOT_SENT = DELIVERY.notSent;

export const OFFER_TEXT: Record<QualityClaimOffer, string> = {
  ReturnAllGoods: "Trả lại toàn bộ hàng của hóa đơn",
  PriceCutWholeInvoice: "Giảm giá cả hóa đơn",
};

export const STATUS_FILTERS: [QualityClaimStatusFilter, string][] = [
  ["all", "Tất cả"],
  ["awaiting", "Chờ phản hồi"],
  ["accepted", "Đã chấp nhận"],
  ["rejected", "Đã từ chối"],
];

export const STATUS_FOR: Record<QualityClaimStatusFilter, number | null> = {
  all: null,
  awaiting: CLAIM_STATUS.awaiting,
  accepted: CLAIM_STATUS.accepted,
  rejected: CLAIM_STATUS.rejected,
};

/** Nhãn trạng thái của khiếu nại: luôn có chữ, không chỉ dựa vào màu. */
export function claimStatus(c: { statusId: number; status: string }): Label {
  switch (c.statusId) {
    case CLAIM_STATUS.awaiting: return { text: "Chờ phản hồi", tone: "warning" };
    case CLAIM_STATUS.accepted: return { text: "Đã chấp nhận", tone: "success" };
    case CLAIM_STATUS.rejected: return { text: "Đã từ chối", tone: "neutral" };
    default: return { text: c.status, tone: "neutral" };
  }
}

const CHANNEL_TEXT: Record<string, string> = { InApp: "Thông báo trong ứng dụng", Sms: "Tin nhắn SMS", ZaloOa: "Zalo OA" };

export const channelText = (s: QualityClaimSending) => CHANNEL_TEXT[s.channel] ?? s.channel;

/** Kết quả gửi phản hồi cho thương lái. Hồ sơ không có số điện thoại thì không gửi được: HTX cần gọi điện báo. */
export function sendingStatus(s: QualityClaimSending): Label {
  switch (s.deliveryStatusId) {
    case DELIVERY.sent: return { text: "Đã gửi", tone: "success" };
    case DELIVERY.notSent: return { text: s.phoneNumber ? "Không gửi được" : "Không gửi được: hồ sơ chưa có số điện thoại", tone: "danger" };
    case DELIVERY.sending: return { text: "Đang gửi", tone: "neutral" };
    default: return { text: "Chưa rõ", tone: "neutral" };
  }
}
