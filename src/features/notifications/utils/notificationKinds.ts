import type { NotificationKind as Kind, NotificationParam, NotificationView as N } from "@/features/notifications/models/Notification";
import { date, dateTime, money, num } from "@/utils/format";

/*
 * Cách hiện từng loại thông báo của backend (`NotificationTypes`). Server viết tiêu đề và nội dung bằng tiếng Anh nên
 * app không hiện chữ đó: câu tiếng Việt dựng lại từ `messageParams` (tên bè, số lồng, số kg…). Thông báo cũ chưa có
 * tham số thì hiện câu ngắn của loại. `to`: màn mở ra khi bấm; loại không có màn trên điện thoại thì hiện nội dung đầy đủ.
 */

const param = (n: N, key: string): NotificationParam => n.messageParams?.[key] ?? null;
const text = (n: N, key: string) => {
  const value = param(n, key);
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
};
const amount = (n: N, key: string) => {
  const value = param(n, key);
  return typeof value === "number" ? value : null;
};
const texts = (n: N, key: string) => {
  const value = param(n, key);
  return Array.isArray(value) ? value.filter((x) => typeof x === "string" || typeof x === "number").map(String) : [];
};
const has = (n: N) => n.messageParams !== null;
const day = (n: N, key: string) => date(text(n, key));
/** " Lời nhắn: …." khi có chữ, rỗng khi không. */
const tail = (label: string, value: string) => {
  const v = value.trim();
  return v ? ` ${label}: ${v}${/[.!?…]$/.test(v) ? "" : "."}` : "";
};
const customer = (name: string) => (name === "a walk-in customer" ? "khách lẻ" : name);

/** Trang của bản ghi khi thông báo có mã bản ghi; không có thì `fallback` (null: hiện nội dung đầy đủ). */
const recordPage = (base: string, fallback: string | null) => (n: N) => (n.relatedRecordId ? `${base}/${n.relatedRecordId}` : fallback);
const page = (path: string) => () => path;
const purchaseRequestPage = (base: string) => (n: N) =>
  n.relatedRecordType === "PurchaseRequest" && n.relatedRecordId ? `${base}?open=${encodeURIComponent(n.relatedRecordId)}` : base;

const INDICATORS: Record<string, string> = { PH: "pH", SALINITY: "Độ mặn", TEMPERATURE: "Nhiệt độ" };

/** Các chỉ số nước vượt ngưỡng của MSG-WATER-03: "pH 8,72 quá cao (cho phép 7,5–8,5)". */
function waterValues(n: N) {
  const values = param(n, "values_outside");
  if (!Array.isArray(values)) return "";
  return values
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";
      const unit = typeof item.unit === "string" ? ` ${item.unit}` : "";
      const min = typeof item.min === "number" ? num(item.min) : null;
      const max = typeof item.max === "number" ? num(item.max) : null;
      const range = min !== null && max !== null ? `cho phép ${min}–${max}${unit}` : min !== null ? `tối thiểu ${min}${unit}` : max !== null ? `tối đa ${max}${unit}` : "chưa đặt ngưỡng";
      const name = typeof item.indicator === "string" ? INDICATORS[item.indicator] ?? item.indicator : "";
      const value = typeof item.value === "number" ? num(item.value) : "";
      return `${name} ${value}${unit} quá ${item.direction === "High" ? "cao" : "thấp"} (${range})`;
    })
    .filter(Boolean)
    .join("; ");
}

/** Công nợ khách sau giao dịch (BR-DEBT-06). */
const debtAfter = (name: string, debt: number) => (debt >= 0 ? `${name} còn nợ HTX ${money(debt)}.` : `HTX còn nợ ${name} ${money(-debt)}.`);

/** MSG-DEBT-03: một khoản thu, khoản trả lại, lệnh hủy, hoặc một lượt xác nhận nhiều khoản. */
function customerPayment(n: N) {
  const who = text(n, "user_name");
  const kind = text(n, "transaction_kind");
  if (kind === "Confirmations") {
    const codes = (prefix: string) => {
      const more = amount(n, `${prefix}_more_count`) ?? 0;
      return texts(n, `${prefix}_codes`).join(", ") + (more ? ` và ${more} khoản khác` : "");
    };
    const confirmed = amount(n, "confirmed_count") ?? 0;
    const cancelled = amount(n, "cancelled_count") ?? 0;
    const parts = [
      confirmed ? `xác nhận ${confirmed} khoản thu (${codes("confirmed")}), tổng ${money(amount(n, "confirmed_amount"))}` : "",
      cancelled ? `hủy ${cancelled} khoản thu (${codes("cancelled")}), tổng ${money(amount(n, "cancelled_amount"))}` : "",
    ].filter(Boolean);
    const debts = param(n, "debts");
    const named = Array.isArray(debts)
      ? debts.map((d) => (d && typeof d === "object" && !Array.isArray(d) && typeof d.customer_name === "string" && typeof d.debt_amount === "number"
        ? debtAfter(d.customer_name, d.debt_amount) : "")).filter(Boolean)
      : [];
    const moreDebts = amount(n, "debts_more_count") ?? 0;
    const debtText = cancelled === 0 ? "Công nợ của khách không đổi." : [...named, moreDebts ? `Công nợ của ${moreDebts} khách khác cũng đã đổi.` : ""].filter(Boolean).join(" ");
    return `${who} ${parts.join(" và ")}. ${debtText}`.trim();
  }
  const paidBack = kind.startsWith("PaidBack");
  const name = text(n, "customer_name");
  const debt = amount(n, "debt_amount");
  const what = `${kind.endsWith("Cancelled") ? "đã hủy" : "đã ghi"} ${paidBack ? "khoản trả lại" : "khoản thu"} ${text(n, "payment_code")} ${money(amount(n, "amount"))}`;
  const whom = name ? `${paidBack ? "cho" : "của"} ${name}` : "không gắn hồ sơ khách hàng";
  return `${who} ${what} ${whom}.${name && debt !== null ? ` ${debtAfter(name, debt)}` : ""}`;
}

/** MSG-PURCHASE-04: tiền trả nhà cung cấp, tiền nhà cung cấp trả lại, hoặc lệnh hủy hai khoản đó. */
function supplierPayment(n: N) {
  const kind = text(n, "transaction_kind");
  const paidBack = kind.startsWith("PaidBack");
  const supplier = text(n, "supplier_name");
  const debt = amount(n, "debt_amount") ?? 0;
  const what = `${kind.endsWith("Cancelled") ? "đã hủy" : "đã ghi"} ${paidBack ? "khoản nhà cung cấp trả lại" : "khoản trả tiền"} ${text(n, "payment_code")} ${money(amount(n, "amount"))} ${paidBack ? "từ" : "cho"} ${supplier}`;
  const after = debt < 0 ? `HTX đã trả trước cho ${supplier} ${money(-debt)}.` : `HTX còn nợ ${supplier} ${money(debt)}.`;
  return `${text(n, "user_name")} ${what}. ${after}`;
}

/** MSG-FARM-01/02: giấy tờ sắp hết hạn (có số ngày còn lại) hoặc đã hết hạn. */
const expiry = (n: N, document: string) => {
  const days = amount(n, "days");
  const when = days !== null ? `hết hạn ngày ${day(n, "expiry_date")}, còn ${days} ngày` : `đã hết hạn ngày ${day(n, "expiry_date")}`;
  return `${document} ${when}. Hãy gia hạn và ghi giấy mới.`;
};

/** MSG-CYCLE-06: tổng kết vụ nuôi vừa đóng. */
function cycleClosed(n: N) {
  const lanes = texts(n, "lane_numbers");
  const early = param(n, "closed_early") === true ? ` (đóng sớm${lanes.length ? `, hàng ${lanes.join(", ")} chưa thu hoạch` : ""})` : "";
  const unit = text(n, "seed_unit");
  return `Bè ${text(n, "raft_code")} đóng vụ nuôi ngày ${day(n, "close_date")}${early}. Giống đã treo ${num(amount(n, "seed_quantity"))}${unit ? ` ${unit}` : ""}, thu khoảng ${num(amount(n, "kg_harvested"), "kg")} sau ${num(amount(n, "days"))} ngày nuôi. Mời xem bản tổng kết.`;
}

/** MSG-SALE-03: HTX nhận đơn (số lồng, ngày giao, trả sau) hoặc từ chối kèm lý do. */
function purchaseResponse(n: N) {
  const coop = text(n, "cooperative_short_name");
  const product = text(n, "product_name");
  const requested = amount(n, "requested_cages");
  if (param(n, "accepted") === true) {
    return `${coop} nhận ${num(amount(n, "accepted_cages"))} trên ${num(requested, "lồng")} ${product}, giao ngày ${day(n, "pickup_date")}${param(n, "pay_later") === true ? ", cho trả sau" : ""}.${tail("Lời nhắn", text(n, "note"))}`;
  }
  return `${coop} chưa nhận yêu cầu mua ${num(requested, "lồng")} ${product}.${tail("Lý do", text(n, "note"))}`;
}

export const KINDS: Record<string, Kind> = {
  WORK_PLAN_REQUESTED: { title: "Kế hoạch ngày làm cần xác nhận", body: () => "Bạn được giao phụ trách kế hoạch. Bấm để nhận hoặc từ chối trước khi phân công nhân viên.", icon: "zi-calendar", tone: "warning", to: page("/manage/work-plans") },
  WORK_PLAN_RESPONDED: { title: "Quản lý phản hồi kế hoạch", body: () => "Người phụ trách đã nhận hoặc từ chối kế hoạch. Bấm để xem phản hồi.", icon: "zi-user-check", tone: "neutral", to: page("/manage/work-plans") },
  WORK_PLAN_STAFF_RESPONDED: { title: "Nhân viên phản hồi ca", body: () => "Nhân viên đã phản hồi ca thuộc kế hoạch bạn phụ trách.", icon: "zi-user-check", tone: "neutral", to: page("/manage/work-plans") },
  TRADER_ACCESS_REQUESTED: { title: "Thương lái xin tài khoản", body: () => "Có yêu cầu tài khoản thương lái mới từ Zalo. Bấm để xem và duyệt.", icon: "zi-user-check", tone: "warning", to: page("/account/trader-requests") },
  TRADER_ACCESS_APPROVED: { title: "Tài khoản đã được duyệt", body: () => "HTX đã duyệt tài khoản thương lái của bạn. Bạn đã dùng được các chức năng của thương lái.", icon: "zi-check-circle", tone: "success" },
  WATER_ALERT: {
    title: "Cảnh báo chất lượng nước",
    body: (n) => has(n)
      ? `${param(n, "corrected") === true ? "Số đo đã sửa: " : ""}vùng ${text(n, "zone_name")}, bè ${text(n, "raft_code")}, đo lúc ${dateTime(text(n, "measurement_time"))}. ${waterValues(n)}. Hãy kiểm tra nước ngay.`
      : "Chỉ số nước tại vùng nuôi vượt ngưỡng đã đặt. Vui lòng kiểm tra ngay.",
    icon: "zi-warning",
    tone: "danger",
    // Chưa mở màn chi tiết số đo: màn đó còn đọc hợp đồng cũ của backend (thiếu `versions`) nên đang trắng.
    to: page("/manage/water"),
  },
  WATER_ALERT_WITHDRAWN: {
    title: "Đã gỡ cảnh báo nước",
    body: (n) => has(n)
      ? `Cảnh báo nước của vùng ${text(n, "zone_name")} (đo lúc ${dateTime(text(n, "measurement_time"))}) đã được gỡ: ${text(n, "user_name")} ${text(n, "corrected_or_voided") === "voided" ? "đã hủy" : "đã sửa"} số đo.${tail("Lý do", text(n, "reason"))}`
      : "Một cảnh báo nước đã được gỡ vì số đo được sửa hoặc hủy.",
    icon: "zi-check-circle",
    tone: "success",
    to: page("/manage/water"),
  },
  WATER_MEASUREMENT_OVERDUE: {
    title: "Quá hạn đo nước",
    body: (n) => has(n)
      ? `Vùng ${text(n, "zone_name")} chưa có số đo nước nào từ ngày ${day(n, "last_date")}. Hãy đo nước và ghi vào OTMS.`
      : `Vùng ${n.relatedRecordCode ?? ""} đã hơn 1 tháng chưa có số đo nước được xác nhận. Vui lòng đo và ghi nhận.`,
    icon: "zi-clock-1",
    tone: "warning",
    to: (n) => (n.relatedRecordId ? `/manage/water?zone=${encodeURIComponent(n.relatedRecordId)}` : "/manage/water"),
  },
  ZONE_LICENSE_EXPIRY: {
    title: "Giấy phép vùng nuôi sắp hết hạn",
    body: (n) => {
      if (!has(n)) return "Có giấy phép vùng nuôi sắp hết hạn hoặc đã hết hạn. Vui lòng gia hạn.";
      const zones = texts(n, "zone_codes").join(", ");
      return expiry(n, `Giấy phép số ${text(n, "document_number")}${zones ? ` của vùng ${zones}` : ""}`);
    },
    icon: "zi-calendar",
    tone: "warning",
    to: recordPage("/manage/licenses", "/manage/zones"),
  },
  COOPERATIVE_CERTIFICATION_EXPIRY: {
    title: "Chứng nhận của HTX sắp hết hạn",
    body: (n) => has(n)
      ? expiry(n, `Chứng nhận ${text(n, "certification_name")}${text(n, "certification_number") ? ` số ${text(n, "certification_number")}` : ""}`)
      : "Có chứng nhận của HTX sắp hết hạn hoặc đã hết hạn. Vui lòng gia hạn.",
    icon: "zi-calendar",
    tone: "warning",
    to: page("/manage/cooperative"),
  },
  WORK_ASSIGNMENT: { title: "Cập nhật phân công", body: () => "Công việc của bạn vừa được cập nhật. Bấm để xem phân công mới nhất.", icon: "zi-list-1", tone: "neutral", to: page("/account/work") },
  PURCHASE_SHIFT_INVITED: { title: "Mời xác nhận ca làm", body: (n) => `Người phụ trách mời bạn tham gia ca cho ${n.relatedRecordCode ?? "đơn hàng"}. Bấm để đồng ý hoặc từ chối.`, icon: "zi-calendar", tone: "warning", to: page("/account/work") },
  PURCHASE_SHIFT_RESPONDED: { title: "Nhân viên phản hồi ca", body: (n) => `Có phản hồi ca cho ${n.relatedRecordCode ?? "đơn hàng"}. Kiểm tra số người đồng ý trước khi nhận đơn.`, icon: "zi-user-check", tone: "neutral", to: purchaseRequestPage("/manage/purchase-requests") },
  PURCHASE_SHIFT_CLOSED: { title: "Ca làm đã đóng", body: (n) => `${n.relatedRecordCode ?? "Đơn hàng"} đã hủy hoặc bị từ chối. Ca này không còn giữ lịch làm việc.`, icon: "zi-recall", tone: "warning", to: page("/account/work") },
  PURCHASE_SHIFT_CONFIRMED: { title: "HTX đã nhận đơn", body: (n) => `Chủ HTX đã nhận ${n.relatedRecordCode ?? "đơn hàng"}. Bấm để xem trạng thái ca của bạn.`, icon: "zi-check-circle", tone: "success", to: page("/account/work") },
  EMPLOYEE_LEAVE_REQUESTED: { title: "Yêu cầu nghỉ phép", body: () => "Có nhân viên gửi yêu cầu nghỉ phép. Bấm để xem và phản hồi.", icon: "zi-calendar", tone: "warning", to: page("/manage/leave-requests") },
  EMPLOYEE_LEAVE_REVIEWED: { title: "Phản hồi nghỉ phép", body: () => "Chủ HTX đã phản hồi yêu cầu nghỉ phép của bạn. Bấm để xem kết quả.", icon: "zi-user-check", tone: "neutral", to: page("/account/work") },
  PAYROLL_SENT_BACK: { title: "Bảng lương bị trả lại", body: () => "Bảng lương được gửi lại để chỉnh sửa.", icon: "zi-note", tone: "warning" },
  STAFF_ACCOUNT_LOCK_REMINDER: {
    title: "Nhắc khóa tài khoản nhân viên",
    body: (n) => has(n)
      ? `${text(n, "employee_name")} không còn làm cho HTX sau ngày ${day(n, "last_working_day")}. Tài khoản ${text(n, "username")} dùng cùng số điện thoại: hãy khóa nếu không còn cần.`
      : "Có nhân viên đã nghỉ việc. Hãy khóa tài khoản của người đó nếu không còn cần.",
    icon: "zi-user-check",
    tone: "warning",
    to: recordPage("/manage/accounts", "/manage/accounts"),
  },
  NEW_ORDER: { title: "Yêu cầu mua mới", body: (n) => `Có yêu cầu mua ${n.relatedRecordCode ?? ""} cần phản hồi. Bấm để xác nhận số lồng và ngày nhận.`, icon: "zi-poll", tone: "warning", to: purchaseRequestPage("/manage/purchase-requests") },
  PURCHASE_REQUEST_NEW: {
    title: "Yêu cầu mua mới",
    body: (n) => has(n)
      ? `${customer(text(n, "customer_name"))} đặt mua ${num(amount(n, "requested_cages"), "lồng")} ${text(n, "product_name")}, nhận ngày ${day(n, "pickup_date")}.${tail("Lời nhắn", text(n, "note"))} Nhờ Quản lý vùng kiểm tra hàu rồi phản hồi.`
      : "Có yêu cầu mua mới cần phản hồi. Bấm để xem.",
    icon: "zi-poll",
    tone: "warning",
    to: purchaseRequestPage("/manage/purchase-requests"),
  },
  PURCHASE_REQUEST_CANCELLED: {
    title: "Thương lái hủy yêu cầu mua",
    body: (n) => has(n)
      ? `${customer(text(n, "customer_name"))} đã hủy yêu cầu mua ${num(amount(n, "requested_cages"), "lồng")} ${text(n, "product_name")} gửi ngày ${day(n, "request_date")}.${tail("Lý do", text(n, "reason"))}`
      : `Thương lái đã hủy ${n.relatedRecordCode ?? "một yêu cầu mua"}. Bấm để xem chi tiết.`,
    icon: "zi-recall",
    tone: "warning",
    to: purchaseRequestPage("/manage/purchase-requests"),
  },
  PURCHASE_REQUEST_RESPONSE: {
    title: "HTX phản hồi yêu cầu mua",
    body: (n) => (has(n) ? purchaseResponse(n) : "HTX đã phản hồi yêu cầu mua của bạn. Bấm để xem."),
    icon: "zi-note",
    tone: "neutral",
    to: purchaseRequestPage("/account/purchases"),
  },
  PURCHASE_REQUEST_RESPONDED: { title: "HTX phản hồi yêu cầu mua", body: (n) => `HTX đã phản hồi ${n.relatedRecordCode ?? ""}. Bấm để xem số lồng và ngày nhận được xác nhận.`, icon: "zi-note", tone: "neutral", to: purchaseRequestPage("/account/purchases") },
  CYCLE_SEEDING_COMPLETED: {
    title: "Đã thả giống xong",
    body: (n) => has(n)
      ? `Bè ${text(n, "raft_code")} đã thả giống xong: ${num(amount(n, "seeded_count"))} trên ${num(amount(n, "lane_count"))} hàng có giống. Mời xem lại các lần thả giống.`
      : `Bè ${n.relatedRecordCode ?? ""} đã thả giống xong. Mời xem lại các lần thả giống.`,
    icon: "zi-check-circle",
    tone: "neutral",
  },
  CULTIVATION_LOG_RECORDED: {
    title: "Nhật ký chăm sóc mới",
    body: (n) => has(n)
      ? `Bè ${text(n, "raft_code")} có nhật ký chăm sóc cho lần ra bè ngày ${day(n, "visit_date")}. Mời xem lại.`
      : `Bè ${n.relatedRecordCode ?? ""} có nhật ký chăm sóc mới. Mời xem lại.`,
    icon: "zi-note",
    tone: "neutral",
  },
  HARVEST_LOT_RECORDED: {
    title: "Có lô thu hoạch mới",
    body: (n) => has(n)
      ? `Bè ${text(n, "raft_code")} thu hoạch ngày ${day(n, "harvest_date")}, ghi thành lô ${text(n, "lot_code")} (${num(amount(n, "cage_count"), "lồng")}, khoảng ${num(amount(n, "estimated_kg"), "kg")}).`
      : `Có lô thu hoạch mới ${n.relatedRecordCode ?? ""}.`,
    icon: "zi-check-circle",
    tone: "success",
    to: page("/manage/harvest"),
  },
  HARVEST_LOT_AUTO_CLOSE_WARNING: {
    title: "Lô hàu sắp tự đóng",
    body: (n) => has(n)
      ? `Lô ${text(n, "lot_code")} (bè ${text(n, "raft_code")}) sẽ tự đóng vào đầu ngày ${day(n, "close_date")}. Hãy bán trước ngày đó hoặc tự đóng lô.`
      : `Lô ${n.relatedRecordCode ?? ""} sắp tự đóng. Hãy bán trước hoặc tự đóng lô.`,
    icon: "zi-clock-1",
    tone: "warning",
    to: page("/manage/harvest"),
  },
  CYCLE_CLOSE_REMINDER: {
    title: "Nhắc đóng vụ nuôi",
    body: (n) => `Bè ${has(n) ? text(n, "raft_code") : n.relatedRecordCode ?? ""}: mọi hàng đã thả giống đều đã thu hoạch. Hãy đóng vụ nuôi của bè.`,
    icon: "zi-clock-1",
    tone: "warning",
  },
  CYCLE_CLOSED: {
    title: "Đã đóng vụ nuôi",
    body: (n) => (has(n) ? cycleClosed(n) : `Bè ${n.relatedRecordCode ?? ""} đã đóng vụ nuôi. Mời xem bản tổng kết.`),
    icon: "zi-check-circle",
    tone: "neutral",
  },
  PURCHASE_RECEIPT_COMPLETED: {
    title: "Phiếu mua hàng mới",
    body: (n) => has(n)
      ? `${text(n, "user_name")} đã hoàn tất phiếu mua ${text(n, "receipt_code")} của ${text(n, "supplier_name")}: ${num(amount(n, "line_count"), "dòng hàng")}, ${money(amount(n, "total_amount"))}.`
      : `Có phiếu mua hàng mới ${n.relatedRecordCode ?? ""}.`,
    icon: "zi-list-1",
    tone: "neutral",
    to: recordPage("/manage/purchases", "/manage/purchases"),
  },
  PURCHASE_RECEIPT_CANCELLED_ADVANCE: {
    title: "HTX đang trả trước cho nhà cung cấp",
    body: (n) => has(n)
      ? `${text(n, "user_name")} đã hủy phiếu mua ${text(n, "receipt_code")} của ${text(n, "supplier_name")}. HTX đang trả trước cho ${text(n, "supplier_name")} ${money(amount(n, "advance_amount"))}.`
      : `Phiếu mua ${n.relatedRecordCode ?? ""} đã hủy, HTX đang trả trước cho nhà cung cấp.`,
    icon: "zi-warning",
    tone: "warning",
    to: recordPage("/manage/purchases", "/manage/purchases"),
  },
  SUPPLIER_TRANSACTION: {
    title: "Tiền trả nhà cung cấp",
    body: (n) => (has(n) ? supplierPayment(n) : `Có giao dịch tiền với nhà cung cấp ${n.relatedRecordCode ?? ""}.`),
    icon: "zi-note",
    tone: "neutral",
    to: page("/manage/supplier-payments"),
  },
  SALE_COMPLETED: {
    title: "Có hóa đơn bán mới",
    body: (n) => has(n)
      ? `${text(n, "user_name")} bán ${num(amount(n, "total_kg"), "kg")} cho ${customer(text(n, "customer_name"))}, ${money(amount(n, "total_amount"))} (hóa đơn ${text(n, "invoice_code")}, ${text(n, "payment_term") === "Pay later" ? "trả sau" : "trả ngay"}).${text(n, "price_text") ? " Có giá do Chủ HTX quyết định hoặc có giảm giá." : ""}`
      : `Có hóa đơn bán mới ${n.relatedRecordCode ?? ""}.`,
    icon: "zi-poll",
    tone: "success",
    to: recordPage("/manage/invoices", null),
  },
  CUSTOMER_PAYMENT_TRANSACTION: {
    title: "Tiền của khách hàng",
    body: (n) => (has(n) ? customerPayment(n) : `Có giao dịch tiền của khách hàng ${n.relatedRecordCode ?? ""}.`),
    icon: "zi-note",
    tone: "neutral",
  },
  PROVENANCE_WITHDRAWN: {
    title: "Thu hồi thông tin nguồn gốc",
    body: (n) => has(n)
      ? `${text(n, "cooperative_short_name")}: thông tin nguồn gốc của lô hàu ${text(n, "lot_code")} (hóa đơn ${texts(n, "invoice_codes").join(", ")}) đã bị thu hồi. Bạn không cần trả lại hàu. Vui lòng gọi ${text(n, "cooperative_phone") || "HTX"}.`
      : `Thông tin nguồn gốc của lô ${n.relatedRecordCode ?? ""} đã bị thu hồi. Vui lòng gọi HTX.`,
    icon: "zi-warning",
    tone: "warning",
    to: page("/account/invoices"),
  },
  TRACE_QR_SENT: { title: "Đã gửi mã QR truy xuất", body: () => "Mã QR truy xuất nguồn gốc đã được gửi.", icon: "zi-qrline", tone: "success", to: page("/account/invoices") },
};

export const OTHER: Kind = { title: "Thông báo mới", body: () => "Bạn có một thông báo mới từ HTX.", icon: "zi-notif", tone: "neutral" };

export const kindOf = (n: N) => KINDS[n.type] ?? OTHER;

/** Màn mở ra khi bấm thông báo; null khi loại này chưa có màn trên điện thoại. */
export function notificationTarget(n: N): string | null {
  const to = KINDS[n.type]?.to;
  if (!to) return null;
  return n.relatedRecordType === "WorkDayPlan" && n.relatedRecordCode
    ? `/manage/work-plans?plan=${encodeURIComponent(n.relatedRecordCode)}`
    : to(n);
}
