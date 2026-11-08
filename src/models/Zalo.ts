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
};

export type FakeZaloWindow = {
  __OMTS_FAKE_ZALO__?: FakeZalo;
};
