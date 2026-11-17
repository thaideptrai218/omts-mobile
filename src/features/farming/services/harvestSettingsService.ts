import type { AutoClosePreview, HarvestSettingsDraft, HarvestSettingsSaved, HarvestSettingsView, UpdateHarvestSettings } from "@/features/farming/models/HarvestSettings";
import { api } from "@/services/httpClient";
import { parseNumber } from "@/utils/format";

/** Giới hạn của backend (`HarvestSettingsService.cs`): kg mỗi lồng tối đa 2 chữ số thập phân, số ngày từ 1 đến 365. */
export const HARVEST_SETTINGS_LIMITS = { maxKgPerCage: 9_999_999.99, minDays: 1, maxDays: 365 } as const;

export const getHarvestSettings = () => api<HarvestSettingsView>("/api/harvest-settings");

/** HARVEST-03 bước 4: số lô đang bán sẽ bị đóng ở lần kiểm tra tiếp theo với số ngày này. */
export const autoClosePreview = (days: number) => api<AutoClosePreview>(`/api/harvest-settings/auto-close-preview?days=${days}`);

/** Lỗi của form trước khi gửi; chuỗi rỗng là hợp lệ. */
export function harvestSettingsError(draft: HarvestSettingsDraft): string {
  const kg = parseNumber(draft.averageKgPerCage);
  if (kg === null || kg <= 0 || kg > HARVEST_SETTINGS_LIMITS.maxKgPerCage) return "Số kg trung bình mỗi lồng phải lớn hơn 0.";
  if (Number(kg.toFixed(2)) !== kg) return "Số kg trung bình mỗi lồng chỉ được tối đa 2 chữ số sau dấu phẩy.";
  const days = parseNumber(draft.daysBeforeAutoClose);
  if (days === null || !Number.isInteger(days) || days < HARVEST_SETTINGS_LIMITS.minDays || days > HARVEST_SETTINGS_LIMITS.maxDays) {
    return `Số ngày tự đóng lô phải là số nguyên từ ${HARVEST_SETTINGS_LIMITS.minDays} đến ${HARVEST_SETTINGS_LIMITS.maxDays}.`;
  }
  return "";
}

/** Lưu cả hai giá trị (MSG-GEN-05); phiên bản cũ thì server trả MSG06. */
export function saveHarvestSettings(current: HarvestSettingsView, draft: HarvestSettingsDraft) {
  const body: UpdateHarvestSettings = {
    averageKgPerCage: parseNumber(draft.averageKgPerCage),
    daysBeforeAutoClose: parseNumber(draft.daysBeforeAutoClose),
    rowVersion: current.rowVersion,
  };
  return api<HarvestSettingsSaved>("/api/harvest-settings", { method: "PUT", body });
}
