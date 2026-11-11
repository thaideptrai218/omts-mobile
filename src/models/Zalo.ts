/**
 * Cầu nối tới các API định danh của Zalo (CLAUDE.md mục 9). Chỉ chạy được bên trong Zalo; ngoài Zalo
 * (xem thử bằng `npm start`) `getAccessToken` trả chuỗi rỗng hoặc ném lỗi, nên ở đây đổi thành `NotInZalo`.
 * Khi dev có thể đặt `window.__OMTS_FAKE_ZALO__` để thử luồng liên kết với backend giả; đoạn đó bị loại
 * khỏi bản build production.
 */
export type FakeZalo = {
  accessToken?: string;
  phoneToken?: string;
  declinePhone?: boolean;
  scan?: string;
  locationToken?: string;
  image?: string;
  /** Giả CheckoutSDK.createOrder: trả mã đơn này rồi phát sự kiện chọn phương thức riêng. */
  checkoutOrderId?: string;
};

/** Tham số của CheckoutSDK.createOrder; server tạo và ký, app truyền nguyên vẹn. */
export type CheckoutOrderParams = {
  amount: number;
  desc: string;
  item: Record<string, unknown>[];
  extradata: string;
  method: string;
  mac: string;
};

/** Dữ liệu sự kiện PAY_BY_CUSTOM_METHOD khi người dùng chọn phương thức riêng. */
export type CustomPaymentSelection = {
  method: string;
  orderId: string;
};

export type FakeZaloWindow = {
  __OMTS_FAKE_ZALO__?: FakeZalo;
};

export type CustomPaymentEvent = {
  eventType?: string;
  data?: CustomPaymentSelection;
};
