import type { PurchaseFilter, PurchaseRequest, TraderPurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import type { Tone } from "@/models/UI";
import { Button } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { date, dateTime, num } from "@/utils/format";

export const PURCHASE_FILTERS: [PurchaseFilter, string][] = [["all", "Tất cả"], ["awaitingResponse", "Chờ phản hồi"], ["awaitingStaff", "Chờ nhân lực"], ["accepted", "Đã chấp nhận"], ["declined", "Từ chối"], ["cancelled", "Đã hủy"]];
const STATUS: Record<number, [string, Tone]> = {
  3201: ["Chờ HTX phản hồi", "warning"], 3202: ["HTX đã chấp nhận", "success"], 3203: ["HTX từ chối", "danger"], 3204: ["Đã hủy", "neutral"],
  3205: ["Chờ xác nhận nhân lực", "warning"],
};
export function PurchaseBadge({ statusId, fulfilled = false }: { statusId: number; fulfilled?: boolean }) {
  const [text, tone] = fulfilled ? ["Đã giao đủ", "success" as const] : STATUS[statusId] ?? ["Trạng thái khác", "neutral"]; return <Badge text={text} tone={tone} />;
}
export function PurchaseFacts({ row }: { row: PurchaseRequest | TraderPurchaseRequest }) {
  const staffing = "staffing" in row ? row.staffing : null;
  return <Facts items={[
    ["Mã yêu cầu", row.code], ["Thương lái", "customer" in row ? row.customer.name : null], ["Trạng thái", <PurchaseBadge key="status" statusId={row.statusId} fulfilled={row.fulfilled} />],
    ["Sản phẩm", row.productName], ["Số lồng đặt mua", num(row.requestedCages, "lồng")], ["Ngày nhận đề nghị", date(row.pickupDate)],
    ["Ghi chú", row.note], ["Số lồng HTX nhận đơn", row.response?.acceptedCages != null ? num(row.response.acceptedCages, "lồng") : null],
    ["Ngày nhận HTX xác nhận", row.response?.pickupDate ? date(row.response.pickupDate) : null],
    ["Ngày làm dự kiến", staffing ? date(staffing.workDate) : null],
    ["Xác nhận nhân lực", staffing ? `${staffing.approvedEmployees}/${staffing.requiredEmployees} người đã đồng ý` : null],
    ["Cho trả sau", row.response?.payLaterAgreed != null ? (row.response.payLaterAgreed ? "Có" : "Không") : null],
    ["Thu hoạch", row.statusId === 3202 ? (row.harvestCompletedAt ? `Đã thu xong lúc ${dateTime(row.harvestCompletedAt)}` : "Đang thu, chưa xong") : null],
    ["Phản hồi HTX", row.response?.note], ["Phản hồi lúc", row.response ? dateTime(row.response.respondedAt) : null],
    ["Lý do hủy", row.cancelReason], ["Hủy lúc", row.cancelledAt ? dateTime(row.cancelledAt) : null], ["Gửi lúc", dateTime(row.sentAt)],
  ]} />;
}
export function PurchasePager({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 20) return null;
  return <div className="pager"><Button variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>Trước</Button><span>{page}/{Math.ceil(total / 20)}</span><Button variant="secondary" disabled={page * 20 >= total} onClick={() => onChange(page + 1)}>Sau</Button></div>;
}
