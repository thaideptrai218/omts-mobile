import type { Stat, Task } from "@/data/roles";
import { listTraderRequests } from "@/services/acs/trader-requests";
import { api } from "@/services/api/http";
import { listWater, listZones, USAGE } from "@/services/farm";
import { num, shortMoney } from "@/services/format";
import { violatedText } from "@/services/labels";
import { listPurchaseRequests } from "@/services/sales";

/**
 * Số liệu và việc cần làm trên Tổng quan của Chủ HTX, gom từ các API đã có (vùng nuôi, chỉ số nước, phiếu nhập,
 * công nợ nhà cung cấp, yêu cầu thương lái). Phần nào lỗi thì bỏ qua phần đó, không làm hỏng cả trang.
 * Sản lượng, doanh thu, công nợ thương lái chưa có API nên chưa hiện (docs/owner-features.md).
 */
export type OwnerSummary = { stats: Stat[]; tasks: Task[] };

type DebtRow = { supplierId: string; supplierName: string | null; outstanding: number };
type ReceiptSearch = { page: { total: number } };

const DRAFT_RECEIPT = 1701;

type Settled<T> = { status: "fulfilled"; value: T } | { status: "rejected" };

/** Như `Promise.allSettled` (lib của dự án dừng ở ES2017): lỗi của một phần không làm hỏng các phần khác. */
function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ status: "fulfilled" as const, value }),
    () => ({ status: "rejected" as const }),
  );
}

export async function loadOwnerSummary(): Promise<OwnerSummary> {
  const [zones, debts, drafts, requests, purchases] = await Promise.all([
    settle(listZones({ statusId: USAGE.inUse, pageSize: 100 })),
    settle(api<DebtRow[]>("/api/suppliers/debts")),
    settle(api<ReceiptSearch>(`/api/purchase-receipts?StatusId=${DRAFT_RECEIPT}&PageSize=1`)),
    settle(listTraderRequests()),
    settle(listPurchaseRequests(false, "AWAITING_RESPONSE")),
  ]);

  const stats: Stat[] = [];
  const tasks: Task[] = [];

  if (purchases.status === "fulfilled") {
    const count = purchases.value.total;
    stats.push({ label: "Yêu cầu mua chờ phản hồi", value: num(count), unit: "yêu cầu", tone: count > 0 ? "warning" : undefined });
    if (count > 0) tasks.push({ id: "purchase-requests", title: `${count} yêu cầu mua chờ phản hồi`, detail: "Xác nhận số lồng và ngày nhận cho thương lái", tone: "warning", feature: "salesOrders" });
  }

  if (requests.status === "fulfilled" && requests.value.length > 0) {
    const names = requests.value.slice(0, 2).map((r) => r.displayName).join(", ");
    tasks.push({
      id: "trader-requests",
      title: `${requests.value.length} yêu cầu tài khoản thương lái chờ duyệt`,
      detail: requests.value.length > 2 ? `${names} và ${requests.value.length - 2} người khác` : names,
      tone: "warning",
      feature: "traderRequests",
    });
  }

  if (zones.status === "fulfilled") {
    const items = zones.value.items;
    const rafts = items.reduce((sum, z) => sum + z.inUseRaftCount, 0);
    stats.push({ label: "Bè đang dùng", value: num(rafts), unit: "bè", note: `${items.length} vùng nuôi` });

    const badLicense = items.filter((z) => z.licenseState === "Expired" || z.licenseState === "Missing");
    const expiring = items.filter((z) => z.licenseState === "ExpiringSoon");
    if (badLicense.length > 0) {
      tasks.push({
        id: "license-bad",
        title: `Giấy tờ của ${badLicense.length} vùng đã hết hạn hoặc còn thiếu`,
        detail: badLicense.map((z) => z.name).join(", "),
        tone: "danger",
        feature: "zones",
      });
    }
    if (expiring.length > 0) {
      tasks.push({
        id: "license-expiring",
        title: `Giấy tờ của ${expiring.length} vùng sắp hết hạn`,
        detail: expiring.map((z) => z.name).join(", "),
        tone: "warning",
        feature: "zones",
      });
    }

    // Số đo mới nhất của từng vùng vượt ngưỡng thì cần xử lý ngay.
    const latest = await Promise.all(items.map((z) => settle(listWater(z.id, "Confirmed", 1).then((p) => ({ zone: z, last: p.items[0] })))));
    const alerts: { zone: (typeof items)[number]; last: { violatedValues: string | null } }[] = [];
    latest.forEach((r) => {
      if (r.status === "fulfilled" && r.value.last?.alertState === "Active") alerts.push(r.value);
    });
    if (alerts.length > 0) {
      tasks.unshift({
        id: "water-alert",
        title: `Chỉ số nước vượt ngưỡng ở ${alerts.length} vùng`,
        detail: alerts.map((a) => `${a.zone.name}: ${violatedText(a.last.violatedValues) || "pH, độ mặn"}`).join("; "),
        tone: "danger",
        feature: "water",
      });
    }
  }

  if (debts.status === "fulfilled") {
    const owing = debts.value.filter((d) => d.outstanding > 0);
    const total = owing.reduce((sum, d) => sum + d.outstanding, 0);
    stats.push({ label: "Nợ nhà cung cấp", value: shortMoney(total), note: `${owing.length} nhà cung cấp còn nợ`, tone: total > 0 ? "warning" : "success" });
  }

  if (drafts.status === "fulfilled") {
    const count = drafts.value.page.total;
    stats.push({ label: "Phiếu nhập nháp", value: num(count), unit: "phiếu", note: count > 0 ? "Chưa hoàn tất" : "Không có phiếu chờ" });
    if (count > 0) {
      tasks.push({ id: "draft-receipts", title: `${count} phiếu nhập chưa hoàn tất`, detail: "Kiểm tra số lượng, giá rồi bấm hoàn tất", tone: "neutral", feature: "purchases" });
    }
  }

  if (requests.status === "fulfilled") {
    stats.push({ label: "Thương lái chờ duyệt", value: num(requests.value.length), unit: "người", tone: requests.value.length > 0 ? "warning" : undefined });
  }

  return { stats, tasks };
}
