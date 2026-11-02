export type PushCatalog = { types: { type: string; name: string; mandatory: boolean; push: boolean }[]; pushAllowedOnDevice: boolean };
export type PushSaved = PushCatalog & { message: string; messageCode: string; notice: string | null; noticeCode: string | null };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function parsePushCatalog(value: unknown): PushCatalog {
  if (!record(value) || typeof value.pushAllowedOnDevice !== "boolean" || !Array.isArray(value.types) || value.types.length > 100) throw new Error("Không đọc được tùy chọn thông báo.");
  const seen = new Set<string>();
  const types = value.types.map((row: unknown) => {
    if (!record(row) || typeof row.type !== "string" || !/^[A-Z][A-Z0-9_]{0,99}$/.test(row.type) || seen.has(row.type)
      || typeof row.name !== "string" || !row.name || typeof row.mandatory !== "boolean" || typeof row.push !== "boolean" || row.mandatory && !row.push) throw new Error("Không đọc được tùy chọn thông báo.");
    seen.add(row.type); return { type: row.type, name: row.name, mandatory: row.mandatory, push: row.push };
  });
  return { types, pushAllowedOnDevice: value.pushAllowedOnDevice };
}
export function parsePushSaved(value: unknown): PushSaved {
  const catalog = parsePushCatalog(value);
  if (!record(value) || value.messageCode !== "MSG-GEN-05" || typeof value.message !== "string"
    || (value.notice !== null && typeof value.notice !== "string") || (value.notice === null ? value.noticeCode !== null : value.noticeCode !== "MSG-ACCOUNT-21")) throw new Error("Chưa xác nhận được kết quả lưu tùy chọn.");
  return { ...catalog, message: value.message, messageCode: value.messageCode, notice: value.notice as string | null, noticeCode: value.noticeCode as string | null };
}
export function pushChanges(catalog: PushCatalog, values: Record<string, boolean>) {
  return catalog.types.filter((row) => !row.mandatory && typeof values[row.type] === "boolean" && values[row.type] !== row.push)
    .map((row) => ({ type: row.type, push: values[row.type] }));
}
