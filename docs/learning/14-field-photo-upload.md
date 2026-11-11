# Tải ảnh và các màn hiện trường của Chủ HTX — 04/11/2026

## Vấn đề

Đối chiếu SRS V8 cho thấy backend đã có API nhưng mobile chưa dùng, vì `httpClient` chỉ gửi JSON. Đợt này làm trên mobile, không sửa backend: chụp máy đo (WATER-01), biểu đồ nước (WATER-03), ảnh bè (FARM-04), thêm/sửa/thay giấy tờ vùng (FARM-03), trả hàng nhà cung cấp (PURCHASE-02).

## Khái niệm và luồng dữ liệu

- **Multipart:** `RequestOptions.form` nhận `FormData`. Không tự đặt `Content-Type`, vì trình duyệt phải tự thêm `boundary`.
- **Lấy ảnh:** `choosePhoto` trong `services/zaloService.ts` gọi `chooseImage` rồi `fetch` blob URL thành `Blob`.
- **Đọc ảnh là bản nháp:** `POST …/water-measurements/recognize` lưu ảnh và tạo bản nháp, kể cả khi OCR lỗi. Màn chi tiết mở sẵn sheet xác nhận; người đo đối chiếu với ảnh rồi mới xác nhận (NFR-05).
- **Chống trùng:** mỗi ảnh có một `clientOperationId`. Chỉ khi mất mạng mới giữ ảnh để "Gửi lại ảnh" với đúng mã đó; lỗi khác phải chọn ảnh mới.
- **Biểu đồ:** SVG tự vẽ, không thêm thư viện. pH và độ mặn khác thang đo nên tách hai biểu đồ, không dùng hai trục. Kỳ thiếu số đo làm đứt đường; kỳ vượt ngưỡng có chấm đỏ kèm nhãn chữ.
- **Trả hàng:** server yêu cầu tiền trừ công nợ + tiền hoàn lại = giá trị hàng trả. Form tính ước tính theo cùng công thức, trừ công nợ trước; nếu làm tròn lệch, server trả số đúng trong thông báo lỗi.

## Lỗi đã gặp

- **Bộ chọn ảnh bị khóa mãi:** đọc `zmp-sdk/apis/apis/chooseImage.js` thấy SDK tạo `<input type=file>` và không nghe sự kiện hủy, nên người dùng đóng bộ chọn thì promise không bao giờ xong. Vì vậy không đặt `busy` hay bọc `choosePhoto` trong `useAction`; chỉ khóa nút sau khi đã có ảnh.
- **Footer che nút cuối form:** đặt dòng lỗi trong `.page-footer` làm footer cao hơn phần chừa sẵn 96px. Playwright báo hết giờ chờ `filechooser` vì nút chọn ảnh nằm dưới footer. Đổi sang snackbar để footer giữ nguyên chiều cao.
- **Bấm "Xong" không lưu ngày:** `DatePicker` chỉ gọi `onChange` khi quay bánh xe. `DateField` nhận ngày hôm nay khi chưa có giá trị mà người dùng bấm "Xong".
- **Ba nút tràn ngang ở màn bè:** `.action-row` chia đều không đủ chỗ cho "Đổi ảnh", "Sửa", "Ngừng dùng". Tách nút ảnh ra một hàng.
- **`vite --port 3100` trả 404:** `root` là `./src` còn `index.html` ở gốc repo; phải chạy bằng `zmp start --no-frame`. Dừng task không tắt tiến trình con trên Windows nên cổng vẫn bận (`Port 3100 is already in use`); phải tìm đúng PID theo dòng lệnh rồi tắt.

## Kiểm chứng

`npm run typecheck`, `npm run lint`, `npm run build`. Chrome 390×844 với backend thật: chọn tệp qua `chooseImage` thật, 23/24 bước đạt. Bước còn lại do `GET /api/me/test-role` trả 404, không thuộc phần này.

**Chưa kiểm chứng:**

- Máy thật trong Zalo: camera, blob URL trên iOS/Android.
- OCR thật: backend mới chỉ có bản giả (`Ocr:Provider = Fake`), ngoài Development thì luôn báo không đọc được và người đo nhập tay.
- Nút "Gửi lại ảnh" khi mất mạng thật.

## Khác SRS

- API bè chỉ nhận một ảnh, SRS cho tối đa 3.
- SRS yêu cầu chọn bè và đo cả nhiệt độ; API số đo hiện không có hai trường này.
- Giấy tờ trên mobile chỉ tải được ảnh; PDF vẫn ở bản web.

## Câu hỏi bảo vệ

- **Vì sao không tự đặt `Content-Type` cho multipart?** Trình duyệt mới biết chuỗi `boundary`; đặt tay sẽ thiếu nó và server không tách được các phần.
- **Vì sao OCR chỉ tạo bản nháp?** OCR có thể đọc sai; số chưa xác nhận không được tính vào thống kê và cảnh báo (NFR-05).
- **Vì sao hai biểu đồ thay vì một biểu đồ hai trục?** Tỉ lệ hai trục là tùy ý nên dễ tạo ra tương quan giả giữa pH và độ mặn.
