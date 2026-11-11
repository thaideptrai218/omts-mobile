import type { CheckoutOrderParams, CustomPaymentEvent, CustomPaymentSelection, FakeZalo, FakeZaloWindow } from "@/models/Zalo";
import { CheckoutSDK, chooseImage, EventName, events, getAccessToken, getLocation, getPhoneNumber, openDocument, openPermissionSetting, scanQRCode } from "zmp-sdk/apis";

/** Chỉ gọi sau khi người dùng bấm nút và đã được giải thích mục đích lấy vị trí. */
export async function zaloLocationToken(): Promise<string> {
  if (fake()?.locationToken) return fake()!.locationToken!;
  try {
    const { token } = await getLocation();
    if (!token) throw new Error();
    return token;
  } catch {
    throw new Error("Chưa lấy được vị trí. Vui lòng mở trong Zalo, cho phép chia sẻ vị trí và bật định vị trên điện thoại; hoặc chọn điểm trên bản đồ.");
  }
}

/** Ảnh biểu mẫu do người dùng chủ động chọn; không tải lên server. */
export async function chooseRaftFormImage(): Promise<string | null> {
  if (fake()?.image) return fake()!.image!;
  const { filePaths } = await chooseImage({ count: 1, sourceType: ["album", "camera"], cameraType: "back" });
  return filePaths?.[0] ?? null;
}

/**
 * Ảnh do người dùng chủ động chụp hoặc chọn, dạng Blob để tải lên server. `chooseImage` trả blob URL. Khi người dùng
 * đóng bộ chọn, SDK không báo gì và promise không bao giờ xong, nên nút gọi hàm này không được khóa lúc đang chọn.
 */
export async function choosePhoto(): Promise<Blob | null> {
  try {
    const path = fake()?.image ?? (await chooseImage({ count: 1, sourceType: ["album", "camera"], cameraType: "back" })).filePaths?.[0];
    if (!path) return null;
    return await (await fetch(path)).blob();
  } catch {
    throw new Error("Chưa lấy được ảnh. Bạn có thể thử lại hoặc nhập bằng tay.");
  }
}

/** Xem tệp PDF trong Zalo. Ngoài Zalo (bản dev giả lập) mở tab mới. */
export async function openPdf(url: string, title: string): Promise<void> {
  if (fake()) {
    window.open(url, "_blank");
    return;
  }
  try {
    await openDocument({ url, title, share: false, download: false, edit: false });
  } catch {
    throw new Error("Chưa mở được tệp PDF. Vui lòng cập nhật Zalo rồi thử lại, hoặc xem trên bản web.");
  }
}

const fakeSelections = new Set<(selection: CustomPaymentSelection) => void>();

/** Mở luồng thanh toán của Zalo với tham số server đã ký, trả mã đơn của Zalo. */
export async function createCheckoutOrder(params: CheckoutOrderParams): Promise<string> {
  const f = fake();
  if (f?.checkoutOrderId) {
    const orderId = f.checkoutOrderId;
    window.setTimeout(() => fakeSelections.forEach((notify) => notify({ method: JSON.parse(params.method).id, orderId })), 50);
    return orderId;
  }
  const { orderId } = await CheckoutSDK.createOrder(params);
  return orderId;
}

/** Người dùng chọn phương thức riêng trên trang thanh toán của Zalo. Trả hàm hủy đăng ký. */
export function onCustomPaymentSelected(handler: (selection: CustomPaymentSelection) => void) {
  fakeSelections.add(handler);
  const listener = (resp: CustomPaymentEvent) => {
    if (resp?.eventType === "PAY_BY_CUSTOM_METHOD" && resp.data) handler(resp.data);
  };
  events.on(EventName.OnDataCallback, listener);
  return () => {
    fakeSelections.delete(handler);
    events.off(EventName.OnDataCallback, listener);
  };
}

/** App được mở lại, ví dụ từ app ngân hàng quay về. Trả hàm hủy đăng ký. */
export function onAppResumed(handler: () => void) {
  events.on(EventName.AppResumed, handler);
  return () => {
    events.off(EventName.AppResumed, handler);
  };
}

function fake(): FakeZalo | null {
  if (!import.meta.env.DEV) return null;
  return (window as unknown as FakeZaloWindow).__OMTS_FAKE_ZALO__ ?? null;
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

/** Không mở được máy quét hoặc người dùng đóng nó mà không quét gì. */
export class ScanUnavailable extends Error {
  constructor(readonly insideZalo: boolean) {
    super("SCAN_UNAVAILABLE");
    this.name = "ScanUnavailable";
  }
}

/**
 * Mở máy quét QR của Zalo và trả nội dung mã. Quyền "quét QR của Zalo" phải được Zalo duyệt theo Mini App ID
 * (CLAUDE.md mục 5). Khi dev ngoài Zalo có thể đặt `window.__OMTS_FAKE_ZALO__.scan` để giả nội dung quét được.
 */
export async function scanQr(): Promise<string> {
  const f = fake();
  if (f?.scan) return f.scan;
  try {
    const { content } = await scanQRCode({});
    if (content) return content;
  } catch {
    // Đóng máy quét, chưa được cấp quyền, hoặc ngoài Zalo: phân biệt bên dưới.
  }
  throw new ScanUnavailable(await zaloAvailable());
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
