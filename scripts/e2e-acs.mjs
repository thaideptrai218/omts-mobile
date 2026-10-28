// Kịch bản chạy thử end-to-end các màn tài khoản trên bản xem thử trình duyệt.
// Không phải test runner của CI; chạy tay khi sửa phần tài khoản. Cần:
//   1. Backend develop chạy local ở http://localhost:5198 (Development, SMS giả).
//   2. `npm start` đang chạy (http://localhost:3000, proxy /api sang backend).
//   3. Chrome cài sẵn và playwright-core tải tạm:  npm i --no-save playwright-core
//   Chạy:  node scripts/e2e-acs.mjs   (ảnh chụp vào node_modules/.cache/e2e-shots)
// Mobile chỉ có "Liên kết tài khoản" bằng số điện thoại Zalo. Các endpoint Zalo (api/auth/zalo/link, /login,
// DELETE api/me/zalo-link) chưa có trên backend: kịch bản giả lập bằng page.route, bên trong lấy phiên thật của
// một tài khoản thương lái chuẩn bị sẵn qua API, nên mọi màn sau liên kết chạy với backend thật.
import { chromium } from "playwright-core";
import fs from "node:fs";

const APP = "http://localhost:3000";
const API = "http://localhost:5198";
const SHOTS = new URL("../node_modules/.cache/e2e-shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
function check(name, ok, info = "") {
  results.push({ name, ok, info });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${info ? " — " + info : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function devCode(kind, query) {
  const list = await (await fetch(`${API}/api/dev/${kind}?${query}`)).json();
  // Hộp thư giả trả mới nhất trước; lấy theo sentAt cho chắc.
  const last = [...list].sort((a, b) => a.sentAt.localeCompare(b.sentAt)).pop();
  const m = (last?.text ?? "").match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}
async function apiJson(path, body, token) {
  const res = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
/** Phiên thật từ backend bằng mật khẩu (chỉ để giả lập endpoint Zalo; app không có mật khẩu). */
async function realTokens(identifier, password) {
  return apiJson("/api/auth/login", { identifier, password, clientType: "Mobile", deviceName: "e2e-zalo-mock" });
}
/** Chuẩn bị tài khoản thương lái có số đã xác minh qua API, đóng vai "HTX đã tạo tài khoản với số Zalo này". */
async function prepareTrader(phone, password) {
  const s = await apiJson("/api/verifications", { channel: "Sms", target: phone });
  const code = await devCode("sms", `phoneNumber=${phone}`);
  const v = await apiJson(`/api/verifications/${s.body.verificationId}/verify`, { code });
  return apiJson("/api/auth/register", { channel: "Sms", identifier: phone, password, passwordConfirmation: password, verificationToken: v.body.verificationToken });
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "vi-VN" });
// Bản giả của zmp-sdk khi dev (src/services/zalo.ts): access token và token số điện thoại.
const zalo = { accessToken: "fake:zalo-e2e", phoneToken: "fake:phone", declinePhone: false };
await context.addInitScript((z) => { window.__OMTS_FAKE_ZALO__ = z; }, zalo);
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
if (process.env.TRACE) {
  page.on("request", (r) => { if (/zalo/.test(r.url())) console.log("  REQ", new Date().toISOString().slice(11, 23), r.method(), r.url().replace(APP, "")); });
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("  NAV", new Date().toISOString().slice(11, 23), new URL(f.url()).pathname); });
}
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });

/** Trạng thái giả lập của backend Zalo: số Zalo thuộc tài khoản nào, Zalo đang liên kết với ai. */
const mock = { linkedTo: null, password: null, phoneOwner: null, locked: false, loginCalls: 0, linkBodies: [] };
await page.route("**/api/auth/zalo/login", async (route) => {
  mock.loginCalls += 1;
  if (!mock.linkedTo) return route.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "ZALO_NOT_LINKED", detail: "This Zalo account is not linked to OMTS yet." }) });
  const t = await realTokens(mock.linkedTo, mock.password);
  if (t.status === 200) mock.lastTokens = t.body;
  return route.fulfill({ status: t.status, contentType: "application/json", body: JSON.stringify(t.body) });
});
await page.route("**/api/auth/zalo/link", async (route) => {
  mock.linkBodies.push(route.request().postDataJSON());
  if (mock.locked) return route.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG13", detail: "This account cannot be used at the moment. Please contact the support channel." }) });
  if (!mock.phoneOwner) return route.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "ZALO_PHONE_NOT_FOUND", detail: "No OMTS account uses this phone number.", maskedPhone: "09******89" }) });
  mock.linkedTo = mock.phoneOwner;
  const t = await realTokens(mock.linkedTo, mock.password);
  if (t.status === 200) mock.lastTokens = t.body;
  return route.fulfill({ status: t.status, contentType: "application/json", body: JSON.stringify({ ...t.body, oldDocumentsHidden: false, notice: null }) });
});
await page.route("**/api/me/zalo-link", (route) => { mock.linkedTo = null; return route.fulfill({ status: 204 }); });

const shot = (name) => page.screenshot({ path: `${SHOTS}${name}.png` });
/** Mở một mục trong tab Tài khoản bằng điều hướng trong app (tải lại trang sẽ mất phiên ngoài Zalo). */
async function goAccount(rowText) {
  // Trang chi tiết không có thanh tab: lùi lịch sử (trong app, không tải lại) tới khi thấy thanh tab.
  for (let i = 0; i < 5 && (await page.locator(".tabbar").count()) === 0; i++) {
    await page.goBack({ waitUntil: "commit" }).catch(() => {});
    await sleep(500);
  }
  if (path() !== "/account") {
    await page.locator(".tabbar__item:has-text('Tài khoản')").click();
    await waitPath("/account");
    await sleep(400);
  }
  if (rowText) {
    await page.locator(`.menu-row:has-text("${rowText}")`).click();
    await sleep(400);
  }
}
/** Tải lại app ở một đường dẫn và chờ splash biến mất (splash chặn click). */
async function open(p) {
  await page.goto(APP + p);
  await page.locator(".splash").waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
  await sleep(300);
}
const path = () => new URL(page.url()).pathname;
const btn = (text) => page.locator(`.zaui-btn:has-text("${text}")`).first();
async function snackbarText(expect = "", timeout = 8000) {
  const el = expect ? page.locator(`.zaui-snackbar:has-text("${expect}")`).first() : page.locator(".zaui-snackbar").first();
  await el.waitFor({ state: "visible", timeout }).catch(() => {});
  return (await el.textContent().catch(() => "")) ?? "";
}
async function waitPath(p, timeout = 10000) {
  await page.waitForURL((u) => u.pathname === p, { timeout }).catch(() => {});
  return path() === p;
}
async function formError() {
  const el = page.locator(".form-error").first();
  await el.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  return (await el.textContent().catch(() => "")) ?? "";
}
async function modalAction(text) {
  await page.locator(`.zaui-modal-content-action:has-text("${text}")`).first().click();
}

const MSG19 = "Your login session has expired. Please log in again.";
const MSG07 = "No connection. The data is kept temporarily on the device and synchronized once online; protected data is not displayed from the local copy.";
const MSG13 = "This account cannot be used at the moment. Please contact the support channel.";
const MSG23 = "This notification item is mandatory and cannot be turned off.";

const phone = "09" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
const PASSWORD = "Trader123";

try {
  // A. Mở app chưa liên kết: zalo/login im lặng bị 404, trang chủ công khai.
  await open("/");
  await sleep(1200);
  check("A home public", (await page.textContent("body")).includes("Truy xuất nguồn gốc hàu"));
  check("A silent zalo login attempted, stays guest", mock.loginCalls >= 1 && path() === "/", `calls=${mock.loginCalls}`);
  await shot("A-home-public");

  // B. Liên kết: chỉ có nút liên kết bằng số Zalo; từ chối số; khóa (MSG13); số chưa có tài khoản; liên kết được.
  await btn("Liên kết tài khoản").click();
  check("B → /link", await waitPath("/link"), path());
  check("B no password / recovery / sign-up on /link", !/mật khẩu|Tạo tài khoản/i.test(await page.textContent("body")));
  await shot("B-link");
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = true; });
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("B phone declined message", (await formError()).includes("chưa chia sẻ số điện thoại"));
  check("B declined → permission setting button", (await btn("Mở cài đặt quyền của Zalo").count()) === 1);
  await shot("B-declined");
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = false; });
  mock.locked = true;
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("B locked account → MSG13", (await formError()).includes(MSG13));
  mock.locked = false;
  await btn("Liên kết bằng số điện thoại Zalo").click();
  await page.locator(".form-error:has-text('09******89')").waitFor({ timeout: 8000 }).catch(() => {});
  const notFound = await formError();
  check("B not found → ask HTX, stays on /link", notFound.includes("09******89") && notFound.includes("Nhờ HTX") && path() === "/link", notFound);
  check("B link request has no createTrader", mock.linkBodies.every((b) => !("createTrader" in b)));
  await shot("B-not-found");
  const prepared = await prepareTrader(phone, PASSWORD);
  check("B trader prepared via API", prepared.status === 200 || prepared.status === 201, `status ${prepared.status}`);
  mock.phoneOwner = phone; mock.password = PASSWORD;
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("B linked → home", await waitPath("/", 20000), path());
  let sb = await snackbarText("Đã liên kết tài khoản");
  check("B linked notice", sb.includes("Đã liên kết tài khoản"), sb);
  await page.locator(".actions__item").first().waitFor({ timeout: 10000 }).catch(() => {});
  check("B dashboard after link", (await page.locator(".actions__item").count()) > 0);
  await shot("B-home-trader");

  // C. Đăng xuất online → trang chủ công khai; liên kết lại → vào thẳng (không hỏi số); hủy liên kết rồi liên kết lại.
  await goAccount();
  check("C account menu has no password row", (await page.locator(".menu-row:has-text('mật khẩu')").count()) === 0);
  await page.locator(".menu-row:has-text('Đăng xuất')").click();
  await modalAction("Đăng xuất");
  check("C logout → /", await waitPath("/"), path());
  // Bản xem thử trình duyệt không có nativeStorage nên không tải lại trang (cờ đã đăng xuất chỉ còn trong bộ nhớ).
  const callsBefore = mock.loginCalls;
  await btn("Liên kết tài khoản").click();
  await sleep(800);
  check("C after logout no silent login, on /link", path() === "/link" && mock.loginCalls === callsBefore, `path=${path()} calls=${mock.loginCalls - callsBefore}`);
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("C relink → home", await waitPath("/"), path());
  await goAccount();
  await page.locator(".menu-row:has-text('Hủy liên kết Zalo')").click();
  await modalAction("Hủy liên kết");
  check("C unlink → /", await waitPath("/"), path());
  check("C unlink cleared mock", mock.linkedTo === null);
  await btn("Liên kết tài khoản").click();
  await waitPath("/link");
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("C link again → home", await waitPath("/", 20000), path());

  // D. Hồ sơ: đổi tên; email và số điện thoại chỉ xem.
  await goAccount("Hồ sơ cá nhân");
  check("D → /account/profile", await waitPath("/account/profile"), path());
  await page.locator("form .zaui-input").first().waitFor({ timeout: 10000 });
  await shot("D-profile");
  await page.locator("form input").nth(0).fill("Thương lái E2E");
  await btn("Lưu thay đổi").click();
  sb = await snackbarText("Personal profile saved.");
  check("D profile saved MSG10", sb.includes("Personal profile saved."), sb);
  await page.locator(".readonly__value").click();
  sb = await snackbarText("You cannot change your username");
  check("D username → MSG20", sb.includes("You cannot change your username yourself"), sb);
  check("D contacts read-only", (await page.locator(".contact-row .zaui-btn").count()) === 0 && (await page.textContent("body")).includes(phone));

  // E. Tùy chọn thông báo
  await goAccount("Tùy chọn thông báo");
  check("E → /account/notifications", await waitPath("/account/notifications"), path());
  await page.locator(".pref").first().waitFor({ timeout: 10000 });
  const body = await page.textContent("body");
  check("E MSG23 on mandatory rows", body.includes(MSG23));
  check("E push unavailable text", body.includes("Push chưa khả dụng"));
  const emailSwitch = page.locator(".pref").first().locator(".pref__row:has-text('Email') input[type=checkbox]");
  const wasChecked = await emailSwitch.isChecked();
  await emailSwitch.click({ force: true });
  await btn("Lưu tùy chọn").click();
  sb = await snackbarText("Notification settings saved.");
  check("E prefs saved", sb.includes("Notification settings saved."), sb);
  check("E email toggle persisted", (await emailSwitch.isChecked()) === !wasChecked);
  await shot("E-notification-prefs");

  // F. Đăng xuất offline: xếp hàng thu hồi, gửi khi có mạng
  const before = await realTokens(phone, PASSWORD); // phiên khác của cùng tài khoản để so sánh
  const sessionRt = mock.lastTokens?.refreshToken ?? null;
  await goAccount();
  await context.setOffline(true);
  await sleep(700);
  check("F offline banner", (await page.textContent("body")).includes(MSG07));
  await page.locator(".menu-row:has-text('Đăng xuất')").click();
  await modalAction("Đăng xuất");
  check("F offline logout → /", await waitPath("/"), path());
  sb = await snackbarText("No connection.");
  check("F MSG07 snackbar", sb.includes(MSG07), sb);
  await shot("F-offline-logout");
  await context.setOffline(false);
  await sleep(3000);
  if (sessionRt) {
    const refreshOld = await apiJson("/api/auth/refresh", { refreshToken: sessionRt });
    check("F old refresh token rejected after reconnect", refreshOld.status === 401, `status ${refreshOld.status}`);
  } else {
    check("F old refresh token rejected after reconnect", false, "không đọc được refresh token của phiên");
  }
  check("F other session of same account still valid", (await apiJson("/api/me/profile", undefined, before.body.accessToken)).status === 200);

  // G. Phiên hết hạn: refresh bị từ chối → MSG19 → /link
  await btn("Liên kết tài khoản").click();
  await waitPath("/link");
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("G relink", await waitPath("/"), path());
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG19", detail: MSG19 }) }));
  await page.route("**/api/me/profile", (r) => r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG19", detail: MSG19 }) }));
  await goAccount("Hồ sơ cá nhân");
  check("G expired → /link", await waitPath("/link"), path());
  sb = await snackbarText("Your login session has expired");
  check("G MSG19 snackbar", sb.includes(MSG19), sb);
  await page.unroute("**/api/auth/refresh");
  await page.unroute("**/api/me/profile");
} catch (e) {
  console.log("ERROR", e);
  await shot("error");
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
