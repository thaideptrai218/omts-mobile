import { Button } from "zmp-ui";
import { Badge, Facts } from "@/components/manage/ui";
import { date, dateTime, num } from "@/services/format";
import type { PurchaseFilter, PurchaseRequest, PurchaseStatus } from "@/services/sales";
import type { Tone } from "@/services/labels";

export const PURCHASE_FILTERS: [PurchaseFilter, string][] = [["ALL", "Tất cả"], ["AWAITING_RESPONSE", "Chờ phản hồi"], ["ACCEPTED", "Đã chấp nhận"], ["DECLINED", "Từ chối"], ["CANCELLED", "Đã hủy"]];
const STATUS: Record<PurchaseStatus, [string, Tone]> = {
  AWAITING_RESPONSE: ["Chờ HTX phản hồi", "warning"], ACCEPTED: ["HTX đã chấp nhận", "success"], DECLINED: ["HTX từ chối", "danger"], CANCELLED: ["Đã hủy", "neutral"],
};
export function PurchaseBadge({ status }: { status: PurchaseStatus }) {
  const [text, tone] = STATUS[status] ?? [status, "neutral"]; return <Badge text={text} tone={tone} />;
}
export function PurchaseFacts({ row }: { row: PurchaseRequest }) {
  return <Facts items={[
    ["Mã yêu cầu", row.code], ["Thương lái", row.customerName], ["Trạng thái", <PurchaseBadge key="status" status={row.status} />],
    ["Sản phẩm", row.productName], ["Số lồng đặt mua", num(row.requestedCages, "lồng")], ["Ngày nhận đề nghị", date(row.requestedPickupDate)],
    ["Ghi chú", row.note], ["Số lồng HTX nhận đơn", row.acceptedCages !== null ? num(row.acceptedCages, "lồng") : null],
    ["Ngày nhận HTX xác nhận", row.acceptedPickupDate ? date(row.acceptedPickupDate) : null],
    ["Cho trả sau", row.respondedAt && row.acceptedCages !== null ? (row.allowPayLater ? "Có" : "Không") : null],
    ["Phản hồi HTX", row.responseNote], ["Phản hồi lúc", row.respondedAt ? dateTime(row.respondedAt) : null],
    ["Lý do hủy", row.cancellationReason], ["Hủy lúc", row.cancelledAt ? dateTime(row.cancelledAt) : null], ["Gửi lúc", dateTime(row.createdAt)],
  ]} />;
}
export function PurchasePager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 20) return null;
  return <div className="action-row"><Button variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>Trước</Button><span>{page}/{Math.ceil(total / 20)}</span><Button variant="secondary" disabled={page * 20 >= total} onClick={() => onChange(page + 1)}>Sau</Button></div>;
}
