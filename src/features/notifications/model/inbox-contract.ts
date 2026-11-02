import type { NotificationPage, NotificationView } from "@/shared/api/account-contracts";

type ObjectValue = Record<string, unknown>;
function object(v: unknown): v is ObjectValue { return v !== null && typeof v === "object" && !Array.isArray(v); }
function text(v: unknown): v is string { return typeof v === "string" && v.trim().length > 0 && v.length <= 500; }
function finite(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }
function day(v: unknown): v is string { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v; }
function time(v: unknown): v is string { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v)); }
const date = (v: string) => v.split("-").reverse().join("/");
const amount = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 6 });
const documents: Record<string, string> = { SEA_AREA_ALLOCATION: "Quyết định giao khu vực biển", AQUACULTURE_LICENSE: "Giấy phép nuôi trồng thủy sản", FOOD_SAFETY_COMMITMENT: "Cam kết an toàn thực phẩm", OTHER: "Giấy tờ" };

/** Chỉ dựng chữ từ tham số nguyên tử của catalogue #23, không tách câu tiếng Anh để đoán dữ liệu. */
function localized(code: string, p: unknown) {
  if (!object(p)) return undefined;
  if (code === "MSG-WATER-06" && text(p.zone_name) && day(p.last_date)) return {
    title: "Nhắc đo nước", body: `Vùng ${p.zone_name} chưa có phép đo nước kể từ ${date(p.last_date)}. Vui lòng đo nước và ghi kết quả vào OMTS.`,
  };
  if ((code === "MSG-FARM-01" || code === "MSG-FARM-02") && typeof p.document_type === "string" && Object.prototype.hasOwnProperty.call(documents, p.document_type)
    && text(p.document_number) && Array.isArray(p.zone_codes) && p.zone_codes.length <= 100 && p.zone_codes.every(text) && day(p.expiry_date)) {
    const document = `${documents[p.document_type]} ${p.document_number}${p.zone_codes.length ? ` (${p.zone_codes.join(", ")})` : ""}`;
    if (code === "MSG-FARM-02") return { title: "Giấy phép đã hết hạn", body: `${document} đã hết hạn ngày ${date(p.expiry_date)}. Vui lòng gia hạn và cập nhật giấy tờ.` };
    if (finite(p.days) && Number.isInteger(p.days) && p.days >= 0) return { title: "Giấy phép sắp hết hạn", body: `${document} hết hạn ngày ${date(p.expiry_date)}, còn ${p.days} ngày. Vui lòng gia hạn và cập nhật giấy tờ.` };
  }
  if (code === "MSG-WATER-03" && typeof p.corrected === "boolean" && text(p.zone_name) && (p.raft_code === null || text(p.raft_code))
    && time(p.measurement_time) && Array.isArray(p.values_outside) && p.values_outside.length > 0 && p.values_outside.length <= 2) {
    const values: string[] = [];
    for (const v of p.values_outside) {
      if (!object(v) || !["PH", "SALINITY"].includes(String(v.indicator)) || !finite(v.value) || !["High", "Low"].includes(String(v.direction))
        || !(v.min === null || finite(v.min)) || !(v.max === null || finite(v.max))) return undefined;
      const unit = v.indicator === "SALINITY" ? " ‰" : "", metric = v.indicator === "PH" ? "pH" : "Độ mặn";
      const limit = finite(v.min) && finite(v.max) ? `${amount(v.min)}–${amount(v.max)}${unit}` : finite(v.min) ? `ít nhất ${amount(v.min)}${unit}` : finite(v.max) ? `tối đa ${amount(v.max)}${unit}` : "chưa đặt ngưỡng";
      values.push(`${metric} ${amount(v.value)}${unit} ${v.direction === "High" ? "cao" : "thấp"} hơn ngưỡng cho phép (${limit})`);
    }
    const when = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(p.measurement_time));
    return { title: p.corrected ? "Cảnh báo nước — phép đo đã hiệu chỉnh" : "Cảnh báo chất lượng nước", body: `Vùng ${p.zone_name}, bè ${p.raft_code ?? "—"}, đo lúc ${when}. ${values.join("; ")}. Vui lòng kiểm tra nước.` };
  }
  return undefined;
}

const codes = ["MSG-WATER-03", "MSG-WATER-06", "MSG-FARM-01", "MSG-FARM-02"];
function notification(raw: unknown): NotificationView {
  if (!object(raw) || !text(raw.id) || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(raw.id) || !text(raw.type)
    || typeof raw.title !== "string" || raw.title.length > 4096 || !(raw.body === null || typeof raw.body === "string" && raw.body.length <= 8192)
    || !(raw.relatedRecordType === null || text(raw.relatedRecordType)) || !(raw.relatedRecordCode === null || typeof raw.relatedRecordCode === "string")
    || !time(raw.createdAt) || !(raw.readAt === null || time(raw.readAt))) throw Error("INVALID_NOTIFICATION_RESPONSE");
  const v2 = "mandatory" in raw || "messageCode" in raw || "relatedRecordId" in raw;
  let content: { title: string; body: string } | undefined;
  if (v2) {
    if (typeof raw.mandatory !== "boolean" || !(raw.messageCode === null || text(raw.messageCode)) || !(raw.messageParams === null || object(raw.messageParams))
      || !(raw.relatedRecordId === null || text(raw.relatedRecordId) && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(raw.relatedRecordId))) throw Error("INVALID_NOTIFICATION_RESPONSE");
    if (typeof raw.messageCode === "string" && codes.includes(raw.messageCode)) {
      content = localized(raw.messageCode, raw.messageParams);
      if (!content) throw Error("INVALID_NOTIFICATION_RESPONSE");
    }
  } else if (typeof raw.isMandatory !== "boolean") throw Error("INVALID_NOTIFICATION_RESPONSE");
  return { id: raw.id, type: raw.type, title: raw.title, body: raw.body, relatedRecordType: raw.relatedRecordType as string | null,
    relatedRecordCode: raw.relatedRecordCode as string | null, createdAt: raw.createdAt, readAt: raw.readAt,
    isMandatory: v2 ? raw.mandatory as boolean : raw.isMandatory as boolean,
    ...(v2 ? { relatedRecordId: raw.relatedRecordId as string | null } : {}), ...(content ? { localizedContent: content } : {}) };
}

export function parseNotificationPage(raw: unknown): NotificationPage {
  if (!object(raw) || !Array.isArray(raw.items) || raw.items.length > 100 || !finite(raw.total) || !Number.isInteger(raw.total) || raw.total < 0
    || !finite(raw.unreadCount) || !Number.isInteger(raw.unreadCount) || raw.unreadCount < 0) throw Error("INVALID_NOTIFICATION_RESPONSE");
  return { items: raw.items.map(notification), total: raw.total, unreadCount: raw.unreadCount };
}
