# Bản đồ bè VIETMAP

## Mục đích và luồng dữ liệu

Từ chi tiết vùng chọn **Bản đồ bè**. Màn `/manage/zones/:id/map` gọi `getZone` và `listRafts` qua service hiện có; backend tiếp tục kiểm tra quyền. VIETMAP cung cấp nền Hybrid, còn mã bè, trạng thái và tọa độ lấy từ OMTS. SDK và CSS chỉ tải khi mở màn bản đồ.

Đặt `VITE_VIETMAP_API_KEY` trong `.env`, dùng khóa **Tilemap**, rồi build lại. Đây là khóa phía client, không phải bí mật backend; cấu hình giới hạn sử dụng và quota trong VIETMAP Console. Kiểm tra hạn chế domain/referrer trên Zalo thực tế vì các Mini App dùng chung origin `https://h5.zdn.vn`.

## Cách hoạt động

- SDK nhận `[longitude, latitude]`; không đảo thành `[latitude, longitude]`.
- Ghim xanh là vị trí vùng, nhãn bè mở trang chi tiết tương ứng. Tọa độ một điểm không đủ để vẽ ranh giới.
- Không xin vị trí điện thoại hoặc gọi API tìm đường, địa chỉ.
- Bỏ qua tọa độ null, không hữu hạn hoặc ngoài phạm vi; hiện số bè đã ghim.
- Có trạng thái thiếu khóa, thiếu tọa độ, đang tải, lỗi và thử lại; không tự tạo cache/offline queue.
- Khi rời màn, hủy timer, ResizeObserver và `map.remove()` để giải phóng WebGL.

## Lỗi khi tích hợp

Lệnh `npm run typecheck` phát hiện TS2550 (`flatMap` không thuộc lib TypeScript hiện tại) và TS2322 (`attributionControl: true` không đúng kiểu SDK đang cài). Nguyên nhân là khác biệt cấu hình ứng dụng và kiểu SDK; sửa bằng `reduce` và `attributionControl: {}`, không thay target toàn dự án. Sau sửa chạy lại typecheck, lint và production build.

## Kiểm chứng thực tế còn cần

`npm run build` ban đầu lỗi `Failed to resolve entry for package`: cả bản npm mặc định `7.0.0-pre.1` và bản `6.0.1` không khai báo main/module. Ghim phiên bản `6.0.1` theo tài liệu và thêm alias khớp chính xác tên package trong Vite tới `dist/vietmap-gl.js`; giữ import gốc để TypeScript vẫn lấy kiểu SDK. Production build sau sửa đã đạt, bản đồ xuất thành chunk riêng.

Với khóa Tilemap hợp lệ, mở vùng có tọa độ trong Zalo: kiểm tra ảnh nền, ghim đúng vị trí, thao tác chạm, mở chi tiết và quay lại; thử mất mạng, key bị từ chối và vùng không có tọa độ. Build thành công chưa chứng minh bản đồ chạy được trên thiết bị.

## Câu hỏi giải thích

## Kiểm tra cấu hình và deploy (30/10/2026)

### Chẩn đoán bản đồ không tải

Tải được `hm/style.json` không đủ để kết luận key dùng được: kiểm tra tiếp một tile vector và một tile vệ tinh theo URL trong style. Cả hai trả HTTP 423, nội dung `Your request is limited`, với cả request thông thường và request có Origin/Referer Zalo; tham số key của tile khớp key cấu hình. Đây là lỗi từ dịch vụ tile, chưa xác định được do loại key, quyền dịch vụ hay quota/credit nếu chưa xem Console. Không lặp request liên tục để tránh tăng tải.

Sửa giao diện để phân biệt 423/429 (giới hạn dịch vụ), 401/403 (từ chối truy cập), mạng/lỗi khác và tải chậm. Không hiển thị hoặc ghi log URL SDK có key. Lỗi timeout được xóa nếu map tải thành công sau đó; lỗi tài nguyên được giữ để không báo thành công khi nền bị thiếu. Cần key/quota hợp lệ và thử trên thiết bị để xác nhận ảnh nền thực tế.

Khóa Tilemap trong `.env` đã tải thành công style Hybrid version 8 với hai nguồn openmaptiles và satellite-tile; không ghi khóa vào log. Build đạt. Kiểm tra `/health/ready` của backend đang cấu hình chưa kết nối được, nên chưa xác nhận ghim bè với dữ liệu thật.

`zmp deploy --passive --existing` lỗi `No asset defined` vì bản build Vite thông thường không chuẩn bị danh sách asset cho deploy theo chế độ existing. Dùng `zmp deploy --passive --desc ...` để Zalo CLI build và tạo cấu hình asset; deploy Development thành công, version `zdev-8006c54c`.

- Vì sao không cần Leaflet? VIETMAP GL JS đã cung cấp bản đồ và marker.
- Vì sao backend không gọi API bản đồ? SDK tải nền trực tiếp; API OMTS chỉ cung cấp dữ liệu bè được phép xem.
- Vì sao chưa có đường đi ra bè? Phạm vi hiện tại là hiển thị tọa độ; tài liệu routing mô tả phương tiện đường bộ, chưa chứng minh hỗ trợ tuyến tàu trên biển.

Nguồn: bộ tài liệu `C:/Users/HP/Downloads/vietmap-agent-docs`, `map-display.txt`, `console.txt`; https://maps.vietmap.vn/docs/sdk-web-gl/overview/.
