/** Bản xem thử SALE-01, không phải DTO của backend và không gửi/lưu dữ liệu mua bán. */
export const PREVIEW_PRODUCT = { id: "preview-oyster", name: "Hàu (sản phẩm mẫu)" } as const;

export type PurchasePreview = { productId: string; kg: string; pickupDate: string; note: string };

/** Ngày lịch Việt Nam, không phụ thuộc múi giờ của thiết bị. */
export function vietnamToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function newPurchasePreview(): PurchasePreview {
  return { productId: PREVIEW_PRODUCT.id, kg: "", pickupDate: vietnamToday(), note: "" };
}

/** Chưa chốt giới hạn độ dài ghi chú hay trường tiền dự kiến; chỉ kiểm tra điều kiện rõ trong SALE-01. */
export function validatePurchasePreview(value: PurchasePreview, today = vietnamToday()): string {
  if (value.productId !== PREVIEW_PRODUCT.id) return "Vui lòng chọn sản phẩm.";
  const normalizedKg = value.kg.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalizedKg) || !Number.isFinite(Number(normalizedKg)) || Number(normalizedKg) <= 0) {
    return "Số kg dự kiến phải là số lớn hơn 0.";
  }
  const date = new Date(`${value.pickupDate}T00:00:00+07:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.pickupDate) || !Number.isFinite(date.getTime()) || vietnamToday(date) !== value.pickupDate) {
    return "Vui lòng chọn ngày nhận hàng hợp lệ.";
  }
  if (value.pickupDate < today) return "Ngày nhận hàng không được trước hôm nay.";
  return "";
}
