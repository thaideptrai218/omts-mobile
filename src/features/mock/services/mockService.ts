import type { MockAction, MockField, MockModule, MockRecord } from "@/features/mock/models/MockModule";
import { MOCK_MODULES } from "@/features/mock/data";
import { dateTime, money, parseNumber } from "@/utils/format";

/**
 * Nguồn dữ liệu mẫu, chỉ có ở bản dev. Dữ liệu sống trong bộ nhớ: tải lại app là về như cũ, không có gì gửi lên máy chủ.
 * Hàm trả Promise như API thật để sau này đổi sang gọi API mà màn hình ít phải sửa.
 */
const store = new Map<string, MockModule>(MOCK_MODULES.map((module) => [module.key, { ...module, records: [...module.records] }]));

const wait = () => new Promise((resolve) => setTimeout(resolve, 150));

export function getMockModule(key: string): MockModule | null {
  return store.get(key) ?? null;
}

export async function listMockRecords(key: string): Promise<MockRecord[]> {
  await wait();
  return store.get(key)?.records ?? [];
}

export async function getMockRecord(key: string, id: string): Promise<MockRecord | null> {
  await wait();
  return store.get(key)?.records.find((record) => record.id === id) ?? null;
}

function replaceRecord(key: string, next: MockRecord) {
  const module = store.get(key);
  if (module) module.records = module.records.map((record) => (record.id === next.id ? next : record));
}

function shown(field: MockField, value: string) {
  if (field.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split("-").reverse().join("/");
  return value;
}

export async function createMockRecord(key: string, values: Record<string, string>, photos: string[]): Promise<MockRecord> {
  await wait();
  const module = store.get(key);
  if (!module?.create) throw new Error("Chức năng này không tạo mới được.");
  const { create } = module;
  const pick = (name: string) => {
    const field = create.fields.find((f) => f.key === name);
    return field && values[name] ? shown(field, values[name]) : "";
  };
  const amount = create.amountField ? (parseNumber(values[create.amountField] ?? "") ?? undefined) : undefined;
  const record: MockRecord = {
    id: `${create.idPrefix}-${Date.now().toString(36).toUpperCase()}`,
    title: pick(create.titleField),
    meta: create.metaFields?.map(pick).filter(Boolean).join(" · "),
    amount,
    status: create.status,
    facts: create.fields.filter((f) => f.type !== "photo" && values[f.key]).map((f) => [f.label, f.key === create.amountField && amount !== undefined ? money(amount) : shown(f, values[f.key])]),
    photos,
    history: [{ at: dateTime(new Date().toISOString()), text: create.done }],
  };
  module.records = [record, ...module.records];
  return record;
}

export async function runMockAction(key: string, record: MockRecord, action: MockAction, values: Record<string, string>): Promise<MockRecord> {
  await wait();
  const entries = (action.fields ?? []).filter((f) => f.type !== "photo" && values[f.key]).map((f) => [f.label, shown(f, values[f.key])] as [string, string]);
  const facts: [string, string][] = action.updatesFacts
    ? [...record.facts.map(([label, value]) => [label, entries.find(([l]) => l === label)?.[1] ?? value] as [string, string]), ...entries.filter(([l]) => !record.facts.some(([label]) => label === l))]
    : record.facts;
  const note = action.updatesFacts ? "" : entries.map(([label, value]) => `${label}: ${value}`).join(" · ");
  const next: MockRecord = {
    ...record,
    facts,
    status: action.to ?? record.status,
    history: [{ at: dateTime(new Date().toISOString()), text: note ? `${action.done} ${note}` : action.done }, ...(record.history ?? [])],
  };
  replaceRecord(key, next);
  return next;
}
