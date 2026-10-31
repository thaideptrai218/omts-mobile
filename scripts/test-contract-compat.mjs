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
