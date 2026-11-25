import { ManagePage } from "@/components/ManagePage/ManagePage";
import MyPurchaseShifts from "@/features/workforce/components/MyPurchaseShifts/MyPurchaseShifts";
import { todayIso } from "@/utils/format";

/** Backend nhận khoảng ngày tối đa 62 ngày; xem lời mời từ hôm nay tới 60 ngày sau. */
const DAYS_AHEAD = 60;

function addDays(iso: string, days: number) {
  const day = new Date(`${iso}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

/**
 * Lời mời ca của đơn đặt mua (quyết định 25/11/2026): người phụ trách mời, nhân viên đồng ý hoặc từ chối, đủ người đồng ý thì Chủ HTX
 * mới nhận đơn. `api/me/purchase-shifts` nhận phiên tài khoản của Mini App, nên màn này mở được cả khi "Công việc của tôi" còn ẩn.
 */
export default function MyShiftsPage() {
  const from = todayIso();
  return (
    <ManagePage title="Ca được mời">
      <MyPurchaseShifts from={from} to={addDays(from, DAYS_AHEAD)} emptyTitle="Chưa có lời mời ca nào trong 2 tháng tới" />
    </ManagePage>
  );
}
