import { getAccessToken, getPhoneNumber, openPermissionSetting } from "zmp-sdk/apis";

/**
 * Cầu nối tới các API định danh của Zalo (CLAUDE.md mục 9). Chỉ chạy được bên trong Zalo; ngoài Zalo
 * (xem thử bằng `npm start`) `getAccessToken` trả chuỗi rỗng hoặc ném lỗi, nên ở đây đổi thành `NotInZalo`.
 * Khi dev có thể đặt `window.__OMTS_FAKE_ZALO__` để thử luồng liên kết với backend giả; đoạn đó bị loại
 * khỏi bản build production.
 */

type FakeZalo = { accessToken?: string; phoneToken?: string; declinePhone?: boolean };

function fake(): FakeZalo | null {
  if (!import.meta.env.DEV) return null;
  return (window as unknown as { __OMTS_FAKE_ZALO__?: FakeZalo }).__OMTS_FAKE_ZALO__ ?? null;
}

/** App không chạy trong Zalo nên không lấy được định danh Zalo. */
export class NotInZalo extends Error {
  constructor() {
    super("NOT_IN_ZALO");
    this.name = "NotInZalo";
  }
}

/** Access token của người dùng Zalo; từ SDK 2.35 không cần người dùng xác nhận, chỉ cho ra Zalo ID. */
export async function zaloAccessToken(): Promise<string> {
  const f = fake();
  if (f?.accessToken) return f.accessToken;
  let token: string;
  try {
    token = await getAccessToken();
  } catch {
    throw new NotInZalo();
  }
  if (!token) throw new NotInZalo();
  return token;
}

export class PhonePermissionDeclined extends Error {
  constructor() {
    super("PHONE_DECLINED");
    this.name = "PhonePermissionDeclined";
  }
}

/**
 * Token số điện thoại: Zalo hiện hộp thoại xin phép, người dùng có thể từ chối. Token chỉ dùng được một
 * lần trong 2 phút và chỉ backend mới đổi được ra số thật (qua Open API, cần app secret).
 */
export async function zaloPhoneToken(): Promise<string> {
  const f = fake();
  if (f) {
    if (f.declinePhone || !f.phoneToken) throw new PhonePermissionDeclined();
    return f.phoneToken;
  }
  try {
    const { token } = await getPhoneNumber();
    if (!token) throw new PhonePermissionDeclined();
    return token;
  } catch (error) {
    if (error instanceof PhonePermissionDeclined) throw error;
    // Mọi lỗi khác của SDK (từ chối, chưa được Zalo duyệt quyền, ngoài Zalo) đều coi như không có số.
    throw new PhonePermissionDeclined();
  }
}

/**
 * Zalo ghi nhớ lựa chọn cấp quyền: đã từ chối chia sẻ số điện thoại thì `getPhoneNumber` báo lỗi ngay, không
 * hỏi lại. Mở màn quản lý quyền của Zalo để người dùng tự bật lại. Ngoài Zalo thì không làm gì.
 */
export async function openZaloPermissionSetting(): Promise<void> {
  if (fake()) return;
  try {
    await openPermissionSetting();
  } catch {
    // Ngoài Zalo hoặc bản Zalo quá cũ: không có màn này.
  }
}

/** Đang chạy bên trong Zalo (hoặc có bản giả khi dev) nên gọi được các API trên. */
export async function zaloAvailable(): Promise<boolean> {
  try {
    await zaloAccessToken();
    return true;
  } catch {
    return false;
  }
}
