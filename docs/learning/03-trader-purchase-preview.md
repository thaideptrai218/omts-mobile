# Xem thử yêu cầu mua của thương lái

> Lịch sử: bản xem thử này đã được thay bằng yêu cầu mua theo số lồng, lưu qua API ngày 31/10/2026. Xem `07-cage-purchase-requests.md`.

## Phạm vi

Yêu cầu người dùng: “làm thử 1 chút trader”. Làm trước màn mua hàng, form và xem lại bản nháp. Không triển khai API bán hàng, không báo đã gửi HTX, không tạo hóa đơn/công nợ giả. Sản phẩm ghi rõ là mẫu. Bản nháp chỉ tồn tại trong component, rời màn hoặc đổi tài khoản sẽ mất; đây không phải hàng đợi offline và không tự đồng bộ.

Nguồn đã đọc:

- [SRS Part II v2, cập nhật 27/10](https://drive.google.com/file/d/1y0OwcL3Yilx6dAzbyLk2xuSKR9uoWIcz/view): §10.1 SALE-01, §10.2 SALE-02, §10.10 SALE-10, §10.15 DEBT-04, §10.16 CLAIM-01.
- [OMTS-223](https://welterial.atlassian.net/browse/OMTS-223): sản phẩm và yêu cầu mua.
- [OMTS-224](https://welterial.atlassian.net/browse/OMTS-224): hóa đơn và sao kê riêng của trader.
- [OMTS-225](https://welterial.atlassian.net/browse/OMTS-225): khiếu nại theo hóa đơn.

SRS đã thay đơn bán cũ bằng yêu cầu mua và hóa đơn. Yêu cầu không chốt giá, không giữ hàng; không tự dựng luồng phiếu cân/lịch giao riêng từ menu mock. SALE-01 nhắc “approximate amount”; Jira diễn giải là số kg dự kiến. Bản xem thử không thêm trường tiền hoặc tự chốt hợp đồng API.

## Luồng và mã nguồn

Trang chủ trader → Mua hàng của tôi (`/account/purchases`) → Tạo yêu cầu mua thử → sản phẩm mẫu, số kg, ngày nhận, ghi chú → Xem trước → Sửa thông tin hoặc Về danh sách.

- `services/trader/purchase-preview.ts`: kiểu xem thử, sản phẩm mẫu, kiểm tra giá trị và ngày lịch Việt Nam. Không gọi HTTP/storage.
- `pages/trader/purchases.tsx`: màn được tải riêng; kiểm tra session, quyền Trader và accountId trước khi mount workspace. Workspace có key accountId để không giữ bản nháp của người trước.
- Không thay đổi bootstrap/token/permission payload hoặc chính sách cache. Không tạo API mới.
- Trang chủ trader bỏ các số công nợ và việc cần làm giả; các chức năng chưa có vẫn dùng trang giải thích hiện hữu.

## Kiểm tra

- `npm run typecheck`, `npm run lint`, `npm run build`: đạt.
- Chạy kiểm tra trực tiếp module bằng TypeScript transpile + Node: nhận số thập phân dấu phẩy; chặn 0, số âm, chữ, Infinity, ký pháp khoa học và dấu phẩy lặp; chặn ngày quá khứ, ngày lịch không tồn tại; kiểm tra ngày Việt Nam qua ranh giới UTC.
- Chrome headless, viewport 390×844, dùng phiên và permissions giả trong bộ kiểm tra: chặn 0 kg; review hiển thị 150,5 kg; sửa giữ bản nháp; hóa đơn hiện chưa hỗ trợ; không gửi mutation API; đổi accountId ẩn workspace; không có runtime error.
- Chưa kiểm chứng tài khoản Zalo trader thật hoặc backend bán hàng, vì luồng gửi thật chưa được triển khai.

## Lỗi trong bộ kiểm tra và xử lý

Script kiểm tra chạy từ thư mục tạm bằng `node`: import `/services/session/session.ts` lỗi fetch vì dev server đang phục vụ từ root repo; sửa thành `/src/services/session/session.ts`. Lần tiếp theo vẫn lỗi vì route Playwright `**/api/**` khớp nhầm file `/src/services/api/http.ts` và `errors.ts`; chỉ giả phản hồi khi pathname bắt đầu `/api/`, các module Vite được continue. Chạy lại toàn bộ luồng thành công. Đây là lỗi cấu hình bộ kiểm tra, không phải lỗi xác thực của app.

## Câu hỏi giải thích

- Vì sao chưa có nút gửi thật? Backend local chưa có API SALE-01; báo gửi thành công sẽ sai thực tế.
- Vì sao không hiện nợ bằng 0? Chưa có dữ liệu công nợ không đồng nghĩa không nợ.
- Vì sao ngày theo Việt Nam? Đây là ngày nghiệp vụ của HTX, không phụ thuộc múi giờ điện thoại.
- Vì sao không dùng bản nháp này cho offline? Bản xem thử chỉ kiểm tra giao diện; offline queue/sync cần yêu cầu riêng đã được duyệt.
