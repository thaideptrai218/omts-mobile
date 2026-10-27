// Kịch bản chạy thử end-to-end các màn tài khoản (ACS-01…07) trên bản xem thử trình duyệt.
// Không phải test runner của CI; chạy tay khi sửa phần tài khoản. Cần:
//   1. Backend develop chạy local ở http://localhost:5198 (Development, SMS/email giả), có Chủ HTX "owner".
//   2. `npm start` đang chạy (http://localhost:3000, proxy /api sang backend).
//   3. Chrome cài sẵn và playwright-core tải tạm:  npm i --no-save playwright-core
//   Chạy:  OWNER_PASSWORD=<mật khẩu owner> node scripts/e2e-acs.mjs   (ảnh chụp vào node_modules/.cache/e2e-shots)
// Hai endpoint Zalo (api/auth/zalo/link, /login, DELETE api/me/zalo-link) chưa có trên backend: kịch bản giả lập
// bằng page.route, bên trong đổi mật khẩu thật lấy phiên thật, nên mọi màn sau liên kết chạy với backend thật.
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
/** Phiên thật từ backend bằng mật khẩu (chỉ để giả lập endpoint Zalo). */
async function realTokens(identifier, password) {
  return apiJson("/api/auth/login", { identifier, password, clientType: "Mobile", deviceName: "e2e-zalo-mock" });
}
/** Tạo thương lái thật qua API (đăng ký bằng SĐT) để giả lập "tạo tài khoản từ số Zalo". */
async function createTrader(phone, password) {
  const s = await apiJson("/api/verifications", { channel: "Sms", target: phone });
  const code = await devCode("sms", `phoneNumber=${phone}`);
  const v = await apiJson(`/api/verifications/${s.body.verificationId}/verify`, { code });
  const r = await apiJson("/api/auth/register", { channel: "Sms", identifier: phone, password, passwordConfirmation: password, verificationToken: v.body.verificationToken });
  return r;
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "vi-VN" });
// Bản giả của zmp-sdk khi dev (src/services/zalo.ts): access token và token số điện thoại.
const zalo = { accessToken: "fake:zalo-e2e", phoneToken: "fake:phone", declinePhone: false };
await context.addInitScript((z) => { window.__OMTS_FAKE_ZALO__ = z; }, zalo);
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
if (process.env.TRACE) {
  page.on("request", (r) => { if (/password\/code|verifications|zalo/.test(r.url())) console.log("  REQ", new Date().toISOString().slice(11, 23), r.method(), r.url().replace(APP, "")); });
  page.on("response", async (r) => { if (/password\/code|verifications/.test(r.url())) console.log("  RES", new Date().toISOString().slice(11, 23), r.status(), (await r.text().catch(() => "")).slice(0, 100)); });
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("  NAV", new Date().toISOString().slice(11, 23), new URL(f.url()).pathname); });
}
page.on("response", async (res) => {
  // Đổi mật khẩu trả cặp token mới cho máy này: ghi lại để kiểm tra thu hồi khi đăng xuất offline.
  if (res.url().endsWith("/api/me/password") && res.status() === 200) {
    const body = await res.json().catch(() => null);
    if (body?.tokens) mock.lastTokens = body.tokens;
  }
});
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });

/** Trạng thái giả lập của backend Zalo: ai đang "liên kết", mật khẩu thật tương ứng. */
const mock = { linkedTo: null, password: null, phoneOwner: null, created: false, notice: null, locked: false, loginCalls: 0 };
await page.route("**/api/auth/zalo/login", async (route) => {
  mock.loginCalls += 1;
  if (!mock.linkedTo) return route.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "ZALO_NOT_LINKED", detail: "This Zalo account is not linked to OMTS yet." }) });
  const t = await realTokens(mock.linkedTo, mock.password);
  if (t.status === 200) mock.lastTokens = t.body;
  return route.fulfill({ status: t.status, contentType: "application/json", body: JSON.stringify(t.body) });
});
await page.route("**/api/auth/zalo/link", async (route) => {
  const req = route.request().postDataJSON();
  if (mock.locked) return route.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG13", detail: "This account cannot be used at the moment. Please contact the support channel." }) });
  if (!mock.phoneOwner) {
    if (!req.createTrader) return route.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "ZALO_PHONE_NOT_FOUND", detail: "No OMTS account uses this phone number.", maskedPhone: "09******89" }) });
    const r = await createTrader(mock.newPhone, mock.newPassword);
    mock.phoneOwner = mock.newPhone; mock.password = mock.newPassword; mock.created = true; mock.notice = r.body?.notice ?? null;
  }
  mock.linkedTo = mock.phoneOwner;
  const t = await realTokens(mock.linkedTo, mock.password);
  if (t.status === 200) mock.lastTokens = t.body;
  return route.fulfill({ status: t.status, contentType: "application/json", body: JSON.stringify({ ...t.body, created: mock.created, oldDocumentsHidden: !!mock.notice, notice: mock.notice }) });
});
await page.route("**/api/me/zalo-link", (route) => { mock.linkedTo = null; return route.fulfill({ status: 204 }); });

const shot = (name) => page.screenshot({ path: `${SHOTS}${name}.png` });
/** Mở một mục trong tab Tài khoản bằng điều hướng trong app (tải lại trang sẽ mất phiên ngoài Zalo). */
async function goAccount(rowText) {
  // Trang chi tiết không có thanh tab: lùi lịch sử (trong app, không tải lại) tới khi thấy thanh tab.
  for (let i = 0; i < 5 && (await page.locator(".bottom-nav").count()) === 0; i++) {
    await page.goBack({ waitUntil: "commit" }).catch(() => {});
    await sleep(500);
  }
  if (path() !== "/account") {
    await page.locator(".bottom-nav .zaui-bottom-navigation-item:has-text('Tài khoản')").click();
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
const link = (text) => page.locator(`.link-button:has-text("${text}")`).first();
const inputs = () => page.locator("form input:not([type=hidden])");
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

const MSG18 = "Your password has been changed.";
const MSG19 = "Your login session has expired. Please log in again.";
const MSG07 = "No connection. The data is kept temporarily on the device and synchronized once online; protected data is not displayed from the local copy.";
const MSG13 = "This account cannot be used at the moment. Please contact the support channel.";
const MSG16 = "The verification code is incorrect or has expired. You can enter it again or request a new code.";
const MSG15 = "If the information is valid, a verification code will be sent to the email or phone number you just entered.";
const MSG17 = "The current password is incorrect. Your password has not been changed.";
const MSG23 = "This notification item is mandatory and cannot be turned off.";

const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "Demo@1234";
const phone = "09" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
const email = `e2e${Date.now()}@demo.local`;
mock.newPhone = phone; mock.newPassword = "Trader123";

try {
  // A. Mở app chưa liên kết: zalo/login im lặng bị 404, trang chủ công khai.
  await open("/");
  await sleep(1200);
  check("A home public", (await page.textContent("body")).includes("Truy xuất nguồn gốc hàu"));
  check("A silent zalo login attempted, stays guest", mock.loginCalls >= 1 && path() === "/", `calls=${mock.loginCalls}`);
  await shot("A-home-public");

  // B. Liên kết: từ chối số điện thoại; tài khoản khóa (MSG13); owner mật khẩu tạm → cổng
  await btn("Liên kết tài khoản").click();
  check("B → /link", await waitPath("/link"), path());
  await shot("B-link");
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = true; });
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("B phone declined message", (await formError()).includes("chưa chia sẻ số điện thoại"));
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = false; });
  mock.locked = true;
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("B locked account → MSG13", (await formError()).includes(MSG13));
  mock.locked = false;
  // Nhân viên do Chủ HTX tạo: mật khẩu tạm (cổng đổi mật khẩu) và số điện thoại chưa xác minh (cổng SĐT).
  const owner = await realTokens("owner", OWNER_PASSWORD);
  const roles = (await apiJson("/api/roles", undefined, owner.body.accessToken)).body;
  const zoneManager = roles.find((r) => r.name === "Zone Manager");
  const staffPhone = "09" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  const staffUser = "zm" + String(Date.now()).slice(-6);
  const createdStaff = await fetch(API + "/api/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${owner.body.accessToken}` },
    body: JSON.stringify({ displayName: "Zone Manager E2E", username: staffUser, phoneNumber: staffPhone, email: null, employeeId: null, grants: [{ zoneId: null, roleId: zoneManager.id }] }),
  }).then((r) => r.json());
  check("B staff account created with temporary password", !!createdStaff.temporaryPassword, JSON.stringify(createdStaff).slice(0, 120));
  mock.phoneOwner = staffUser; mock.password = createdStaff.temporaryPassword; mock.created = false;
  await btn("Liên kết bằng số điện thoại Zalo").click();
  const atGate = await waitPath("/gate/password");
  check("B staff linked → /gate/password", atGate, path());
  await shot("B-gate-password");
  if (atGate) {
    await inputs().nth(0).fill("wrong1234");
    await inputs().nth(1).fill("Staff12345");
    await inputs().nth(2).fill("Staff12345");
    await btn("Lưu mật khẩu").click();
    check("B wrong current → MSG17", (await formError()).includes(MSG17));
    await inputs().nth(0).fill(createdStaff.temporaryPassword);
    await btn("Lưu mật khẩu").click();
    mock.password = "Staff12345";
    check("B forced change → /gate/phone (staff phone unverified)", await waitPath("/gate/phone"), path());
    const sb = await snackbarText(MSG18);
    check("B MSG18 snackbar", sb.includes(MSG18), sb);
    const maskedStaff = staffPhone.slice(0, 2) + "******" + staffPhone.slice(-2);
    await page.locator(".segmented__item").first().waitFor({ timeout: 8000 }).catch(() => {});
    check("B staff sees masked owner-entered number", (await page.textContent("body")).includes(maskedStaff), maskedStaff);
    await shot("B-gate-phone-staff");
    await btn("Gửi mã xác minh").click();
    check("B confirm number → /verify", await waitPath("/verify"), path());
    await page.locator(".code-input").fill(await devCode("sms", `phoneNumber=${staffPhone}`));
    check("B phone verified → home", await waitPath("/"), path());
    await page.locator(".actions__item").first().waitFor({ timeout: 10000 }).catch(() => {});
    const actions = await page.locator(".actions__item").count();
    check("B zone manager dashboard filtered by permissions", actions > 0 && actions < 8, `${actions} actions`);
    await shot("B-home-zone-manager");
  }

  // C. Đăng xuất online → trang chủ công khai; mở lại /link → vào thẳng (đã liên kết)
  await open("/account");
  await page.locator(".menu-row:has-text('Đăng xuất')").click();
  await modalAction("Đăng xuất");
  check("C logout → /", await waitPath("/"), path());
  // Bản xem thử trình duyệt không có nativeStorage nên không tải lại trang (cờ đã đăng xuất chỉ còn trong bộ nhớ).
  const callsBefore = mock.loginCalls;
  await btn("Liên kết tài khoản").click();
  await sleep(800);
  check("C after logout no silent login, on /link", path() === "/link" && mock.loginCalls === callsBefore, `path=${path()} calls=${mock.loginCalls - callsBefore}`);
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = true; });
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("C relink without phone prompt → home", await waitPath("/"), path());
  await page.evaluate(() => { window.__OMTS_FAKE_ZALO__.declinePhone = false; });
  await open("/account");
  await page.locator(".menu-row:has-text('Hủy liên kết Zalo')").click();
  await modalAction("Hủy liên kết");
  check("C unlink → /", await waitPath("/"), path());
  check("C unlink cleared mock", mock.linkedTo === null);

  // D. Số chưa có tài khoản → tạo thương lái từ số Zalo
  mock.phoneOwner = null; mock.linkedTo = null; mock.created = false;
  await open("/link");
  await btn("Liên kết bằng số điện thoại Zalo").click();
  await page.locator(".zaui-modal-content").waitFor({ timeout: 8000 });
  check("D not found → modal", (await page.textContent(".zaui-modal-content")).includes("Chưa có tài khoản OMTS nào dùng số 09******89"));
  await shot("D-not-found");
  await modalAction("Tạo tài khoản thương lái");
  check("D trader created → home", await waitPath("/", 20000), path());
  let sb = await snackbarText("Đã tạo tài khoản thương lái");
  check("D created notice", sb.includes("Đã tạo tài khoản thương lái"), sb);
  await page.locator(".actions__item").first().waitFor({ timeout: 10000 }).catch(() => {});
  await shot("D-home-trader");

  // E. Hồ sơ: đổi tên, thêm email có xác minh
  await goAccount("Hồ sơ cá nhân");
  check("E → /account/profile", await waitPath("/account/profile"), path());
  await page.locator("form .zaui-input").first().waitFor({ timeout: 10000 });
  await shot("E-profile");
  await page.locator("form input").nth(0).fill("Thương lái E2E");
  await btn("Lưu thay đổi").click();
  sb = await snackbarText("Personal profile saved.");
  check("E profile saved MSG10", sb.includes("Personal profile saved."), sb);
  await page.locator(".readonly__value").click();
  sb = await snackbarText("You cannot change your username");
  check("E username → MSG20", sb.includes("You cannot change your username yourself"), sb);
  await btn("Thêm email").click();
  await page.locator(".zaui-sheet form input").first().waitFor();
  await page.locator(".zaui-sheet form input").nth(0).fill(email);
  await page.locator(".zaui-sheet form input").nth(1).fill("Trader123");
  await page.locator(".zaui-sheet .zaui-btn:has-text('Gửi mã')").click();
  check("E contact change → /verify", await waitPath("/verify"), path());
  const notice = await page.locator(".form-note").first().textContent().catch(() => "");
  check("E MSG62 shown", notice.includes("A verification code has been sent to") && notice.includes("old email remains in use"), notice);
  await shot("E-verify");
  await page.locator(".code-input").fill("000000");
  check("E wrong code → MSG16", (await formError()).includes(MSG16));
  const emailCode = await devCode("email", `to=${email}`);
  check("E email code received", !!emailCode, emailCode ?? "none");
  await page.locator(".code-input").fill("");
  await page.locator(".code-input").fill(emailCode);
  check("E confirmed → profile", await waitPath("/account/profile"), path());
  sb = await snackbarText("Personal profile saved.");
  check("E confirm notice", sb.includes("Personal profile saved."), sb);
  await page.locator(".badge--success:has-text('Verified')").first().waitFor({ timeout: 8000 }).catch(() => {});
  check("E email badge Verified", (await page.locator(".badge--success:has-text('Verified')").count()) >= 1);
  await shot("E-profile-verified");

  // F. Tùy chọn thông báo
  await goAccount("Tùy chọn thông báo");
  check("F → /account/notifications", await waitPath("/account/notifications"), path());
  await page.locator(".pref").first().waitFor({ timeout: 10000 });
  const body = await page.textContent("body");
  check("F MSG23 on mandatory rows", body.includes(MSG23));
  check("F push unavailable text", body.includes("Push chưa khả dụng"));
  const emailSwitch = page.locator(".pref").first().locator(".pref__row:has-text('Email') input[type=checkbox]");
  const wasChecked = await emailSwitch.isChecked();
  await emailSwitch.click({ force: true });
  await btn("Lưu tùy chọn").click();
  sb = await snackbarText("Notification settings saved.");
  check("F prefs saved", sb.includes("Notification settings saved."), sb);
  check("F email toggle persisted", (await emailSwitch.isChecked()) === !wasChecked);
  await shot("F-notification-prefs");

  // G. Đổi mật khẩu bằng mã email
  await goAccount("Đổi mật khẩu");
  check("G → /account/password", await waitPath("/account/password"), path());
  await page.locator(".link-button--inline").waitFor({ timeout: 10000 });
  await page.locator(".link-button--inline").click();
  check("G password code → /verify", await waitPath("/verify"), path());
  const pwCode = await devCode("email", `to=${email}`);
  console.log("  pwCode", pwCode, new Date().toISOString().slice(11, 23));
  await page.locator(".code-input").fill(pwCode);
  check("G verified → /account/password", await waitPath("/account/password"), path());
  check("G verified note", (await page.textContent("body")).includes("Đã xác minh bằng mã gửi về email"));
  await inputs().nth(0).fill("Trader456");
  await inputs().nth(1).fill("Trader456");
  await btn("Lưu mật khẩu").click();
  check("G password changed → /account", await waitPath("/account"), path());
  mock.password = "Trader456";
  sb = await snackbarText(MSG18);
  check("G MSG18", sb.includes(MSG18), sb);
  if (process.env.STOP_AFTER === "G") throw new Error("stop after G");

  // H. Đăng xuất offline: xếp hàng thu hồi, gửi khi có mạng
  const before = await realTokens(phone, "Trader456"); // phiên khác của cùng tài khoản để so sánh
  const sessionRt = mock.lastTokens?.refreshToken ?? null;
  await goAccount();
  await context.setOffline(true);
  await sleep(700);
  check("H offline banner", (await page.textContent("body")).includes(MSG07));
  await page.locator(".menu-row:has-text('Đăng xuất')").click();
  await modalAction("Đăng xuất");
  check("H offline logout → /", await waitPath("/"), path());
  sb = await snackbarText("No connection.");
  check("H MSG07 snackbar", sb.includes(MSG07), sb);
  await shot("H-offline-logout");
  await context.setOffline(false);
  await sleep(3000);
  if (sessionRt) {
    const refreshOld = await apiJson("/api/auth/refresh", { refreshToken: sessionRt });
    check("H old refresh token rejected after reconnect", refreshOld.status === 401, `status ${refreshOld.status}`);
  } else {
    check("H old refresh token rejected after reconnect", false, "refresh token của phiên không đọc được từ storage");
  }
  check("H other session of same account still valid", (await apiJson("/api/me/profile", undefined, before.body.accessToken)).status === 200);

  // I. Khôi phục mật khẩu (bản web) từ màn liên kết. Đợi hết cửa sổ rate limit (10 lời gọi mã/phút/IP).
  await sleep(62000);
  await btn("Liên kết tài khoản").click();
  await waitPath("/link");
  await link("Quên mật khẩu").click();
  await waitPath("/recover");
  await inputs().nth(0).fill(phone);
  await btn("Gửi mã").click();
  check("I recovery → /verify", await waitPath("/verify"), `${path()} ${path() === "/recover" ? await formError() : ""}`);
  check("I MSG15 shown", (await page.textContent("body")).includes(MSG15));
  const recCode = await devCode("sms", `phoneNumber=${phone}`);
  await page.locator(".code-input").fill(recCode);
  check("I verified → /recover/reset", await waitPath("/recover/reset"), path());
  await inputs().nth(0).fill("short1");
  await inputs().nth(1).fill("short1");
  await btn("Đặt lại mật khẩu").click();
  check("I weak password → MSG01", (await formError()).includes("Password is invalid"));
  await inputs().nth(0).fill("Trader789");
  await inputs().nth(1).fill("Trader789");
  await btn("Đặt lại mật khẩu").click();
  check("I reset → /link", await waitPath("/link"), path());
  mock.password = "Trader789";
  sb = await snackbarText(MSG18);
  check("I MSG18 after reset", sb.includes(MSG18), sb);
  check("I reset ended other sessions", (await apiJson("/api/me/profile", undefined, before.body.accessToken)).status === 401);

  // J. Phiên hết hạn: refresh bị từ chối → MSG19 → /link
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("J relink", await waitPath("/"), path());
  await page.route("**/api/auth/refresh", (r) => r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG19", detail: MSG19 }) }));
  await page.route("**/api/me/profile", (r) => r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({ code: "MSG19", detail: MSG19 }) }));
  await goAccount("Hồ sơ cá nhân");
  check("J expired → /link", await waitPath("/link"), path());
  sb = await snackbarText("Your login session has expired");
  check("J MSG19 snackbar", sb.includes(MSG19), sb);
  await page.unroute("**/api/auth/refresh");
  await page.unroute("**/api/me/profile");

  // K. Cổng số điện thoại (tài khoản đăng ký bằng email, chưa có số): giả lập liên kết trả phiên có phoneVerificationRequired
  const email2 = `gate${Date.now()}@demo.local`;
  const s = await apiJson("/api/verifications", { channel: "Email", target: email2 });
  const v = await apiJson(`/api/verifications/${s.body.verificationId}/verify`, { code: await devCode("email", `to=${email2}`) });
  await apiJson("/api/auth/register", { channel: "Email", identifier: email2, password: "Trader123", passwordConfirmation: "Trader123", verificationToken: v.body.verificationToken });
  mock.phoneOwner = email2; mock.password = "Trader123"; mock.created = false; mock.linkedTo = null;
  await open("/link");
  await btn("Liên kết bằng số điện thoại Zalo").click();
  check("K → /gate/phone", await waitPath("/gate/phone"), path());
  check("K MSG67 shown", (await page.textContent("body")).includes("Your account needs a verified phone number"));
  await shot("K-gate-phone");
  const phone2 = "09" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  await inputs().nth(0).fill(phone2);
  await btn("Gửi mã xác minh").click();
  check("K phone → /verify", await waitPath("/verify"), path());
  await page.locator(".code-input").fill(await devCode("sms", `phoneNumber=${phone2}`));
  check("K phone verified → home", await waitPath("/"), path());
  await page.locator(".actions__item").first().waitFor({ timeout: 10000 }).catch(() => {});
  check("K dashboard after gate", (await page.locator(".actions__item").count()) > 0);
} catch (e) {
  console.log("ERROR", e);
  await shot("error");
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
