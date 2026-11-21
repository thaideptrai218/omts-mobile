import type { Stat, Task } from "@/features/dashboard/models/Dashboard";
import type { OwnerSummary, ReceiptSearch } from "@/features/dashboard/models/OwnerSummary";
import type { Settled } from "@/models/AsyncResult";

import { listTraderRequests } from "@/features/organization/services/traderRequestsService";
import { api } from "@/services/httpClient";
import { listZones, USAGE, waterOverview } from "@/features/farming/services/farmService";
import { outsideText } from "@/features/farming/utils/waterText";
import { num, shortMoney } from "@/utils/format";
import { listPurchaseRequests } from "@/features/sales/services/salesService";
import { listSupplierDebts } from "@/features/purchasing/services/purchasingService";

const DRAFT_RECEIPT = 1701;

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
    settle(listSupplierDebts({ pageSize: 1 })),
    settle(api<ReceiptSearch>(`/api/purchase-receipts?StatusId=${DRAFT_RECEIPT}&PageSize=1`)),
    settle(listTraderRequests()),
    settle(listPurchaseRequests("awaitingResponse")),
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

    // Backend chỉ báo Expired hoặc ExpiringSoon theo giấy tờ mới nhất; vùng chưa có giấy tờ không có trạng thái riêng.
    const badLicense = items.filter((z) => z.licenseState === "Expired");
    const expiring = items.filter((z) => z.licenseState === "ExpiringSoon");
    if (badLicense.length > 0) {
      tasks.push({
        id: "license-bad",
        title: `Giấy tờ của ${badLicense.length} vùng đã hết hạn`,
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

    // Lần đo mới nhất của vùng đang dùng vượt ngưỡng thì cần xử lý ngay (tổng quan nước, BR-WATER-04).
    const overview = await settle(waterOverview(true));
    const alerts = overview.status === "fulfilled" ? overview.value.filter((z) => z.hasWaterAlert) : [];
    if (alerts.length > 0) {
      tasks.unshift({
        id: "water-alert",
        title: `Chỉ số nước vượt ngưỡng ở ${alerts.length} vùng`,
        detail: alerts.map((a) => `${a.zoneName}: ${a.valuesOutside.map(outsideText).join(", ") || "vượt ngưỡng"}`).join("; "),
        tone: "danger",
        feature: "water",
      });
    }
  }

  if (debts.status === "fulfilled") {
    // Tổng của backend tính trên mọi nhà cung cấp; số nhà là số nhà có công nợ khác 0 (kể cả nhà HTX đã trả trước).
    const total = debts.value.totalOwed;
    const count = debts.value.page.total;
    stats.push({ label: "Nợ nhà cung cấp", value: shortMoney(total), note: count > 0 ? `${count} nhà cung cấp có công nợ` : "Không còn nợ", tone: total > 0 ? "warning" : "success" });
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
