import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Chạy module TypeScript thật bằng Node, không cần SDK Zalo hoặc thêm test runner.
const moduleUrl = (source) => "data:text/javascript;base64," + Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString("base64");
const errorsUrl = moduleUrl(await readFile(new URL("../src/shared/api/errors.ts", import.meta.url), "utf8"));
const errors = await import(errorsUrl);
const messages = await import(moduleUrl((await readFile(new URL("../src/shared/lib/messages.ts", import.meta.url), "utf8"))
  .replaceAll("@/shared/api/errors", errorsUrl)));

test("mã mới giữ nguyên, mã cũ vẫn nhận diện và dịch được", () => {
  const error = new errors.ApiError(403, "MSG-GEN-08", "server detail", { legacyCode: "MSG02" });
  assert.equal(error.code, "MSG-GEN-08");
  assert.equal(errors.isApiError(error, "MSG-GEN-08"), true);
  assert.equal(errors.isApiError(error, "MSG02"), true);
  assert.equal(messages.errorText(error), messages.MESSAGES.MSG02);
});
test("phản hồi cũ không có legacyCode vẫn hoạt động", () => {
  const error = new errors.ApiError(409, "MSG06", "server detail");
  assert.equal(errors.isApiError(error, "MSG06"), true);
  assert.notEqual(messages.errorText(error), messages.MESSAGES.UNEXPECTED);
});
test("không coi mã không liên quan là conflict", () => {
  const error = new errors.ApiError(400, "MSG-GEN-01", "server detail", { legacyCode: "MSG01" });
  assert.equal(errors.isApiError(error, "MSG06"), false);
});
test("mã không biết và alias sai kiểu không hiện detail tùy ý", () => {
  const error = new errors.ApiError(400, "UNKNOWN", "private diagnostic", { legacyCode: 123 });
  assert.equal(messages.errorText(error), messages.MESSAGES.UNEXPECTED);
});
test("mã kỹ thuật Zalo giữ thông báo riêng", () => {
  const error = new errors.ApiError(403, "ZALO_APPROVAL_PENDING", "private diagnostic");
  assert.notEqual(messages.errorText(error), messages.MESSAGES.UNEXPECTED);
});

const inbox = await import(moduleUrl(await readFile(new URL("../src/features/notifications/model/inbox-contract.ts", import.meta.url), "utf8")));
const oldNotification = { id: "122bb318-a72e-49aa-a8d7-a6169f889007", type: "WATER_MEASUREMENT_OVERDUE", title: "Title", body: "Old body",
  relatedRecordType: "FarmingZone", relatedRecordCode: "DEMO-01", createdAt: "2026-10-30T00:00:00Z", readAt: null, isMandatory: false };
test("inbox giữ schema cũ và bỏ trường người nhận ngoài hợp đồng", () => {
  const result = inbox.parseNotificationPage({ items: [{ ...oldNotification, recipientAccountId: "private" }], total: 1, unreadCount: 1 });
  assert.equal(result.items[0].isMandatory, false); assert.equal(JSON.stringify(result).includes("private"), false);
});
test("inbox v2 dịch tham số nguyên tử và giữ ID riêng với mã hiển thị", () => {
  const result = inbox.parseNotificationPage({ items: [{ ...oldNotification, mandatory: true, relatedRecordId: oldNotification.id, messageCode: "MSG-WATER-06", messageParams: { zone_name: "A", last_date: "2026-10-01" } }], total: 1, unreadCount: 1 });
  assert.equal(result.items[0].isMandatory, true); assert.equal(result.items[0].relatedRecordCode, "DEMO-01");
  assert.equal(result.items[0].relatedRecordId, oldNotification.id); assert.ok(result.items[0].localizedContent.body.includes("01/10/2026"));
});
test("inbox không hạ v2 sai tham số về schema cũ", () => {
  assert.throws(() => inbox.parseNotificationPage({ items: [{ ...oldNotification, mandatory: true, relatedRecordId: null, messageCode: "MSG-WATER-06", messageParams: { zone_name: [] } }], total: 1, unreadCount: 1 }));
});

const push = await import(moduleUrl(await readFile(new URL("../src/features/notifications/model/push-contract.ts", import.meta.url), "utf8")));
test("catalog Push mới giữ tùy chọn khi chưa có thiết bị và khóa loại bắt buộc", () => {
  const catalog = push.parsePushCatalog({ types: [{ type: "WATER_ALERT", name: "Water", mandatory: true, push: true }, { type: "WORK_ASSIGNMENT", name: "Work", mandatory: false, push: true }], pushAllowedOnDevice: false });
  assert.deepEqual(push.pushChanges(catalog, { WATER_ALERT: false, WORK_ASSIGNMENT: false }), [{ type: "WORK_ASSIGNMENT", push: false }]);
  assert.throws(() => push.parsePushCatalog({ ...catalog, types: [{ ...catalog.types[0], push: false }] }));
  assert.throws(() => push.parsePushCatalog({ ...catalog, types: [catalog.types[0], catalog.types[0]] }));
});
test("notice của lần lưu Push phải có mã tương ứng", () => {
  const saved = { types: [], pushAllowedOnDevice: false, message: "Saved", messageCode: "MSG-GEN-05", notice: "No device", noticeCode: "MSG-ACCOUNT-21" };
  assert.equal(push.parsePushSaved(saved).notice, "No device"); assert.throws(() => push.parsePushSaved({ ...saved, noticeCode: null }));
});
