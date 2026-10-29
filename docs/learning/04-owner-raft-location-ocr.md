# Owner: tạo vùng/bè, định vị và nhập giấy bằng OCR

## Nguồn và phạm vi đã chốt

- Người dùng yêu cầu kiểm tra tạo vùng/bè và thêm định vị Zalo, chọn map, OCR. Đã xác nhận OCR là đọc **thông tin bè từ giấy/biểu mẫu**, không phải suy đoán vị trí từ ảnh chụp bè.
- [SRS Part II v2 cập nhật 27/10](https://drive.google.com/file/d/1y0OwcL3Yilx6dAzbyLk2xuSKR9uoWIcz/view), FARM-02 và FARM-04: Owner quản lý vùng và bè, vị trí map. Luồng và mã trạng thái hiện có không đổi. SRS nhắc map pin tùy chọn nhưng backend local yêu cầu tọa độ; giữ nguyên hợp đồng hiện tại, không tự giải quyết khác biệt đó.
- [Zalo getLocation](https://docs.zaloplatforms.com/docs/MA/api/location/getLocation): trả token một lần, khoảng 2 phút; server gọi `graph.zalo.me/v2.0/me/info` với access_token, code và secret_key ở header.
- [Zalo chooseImage](https://docs.zaloplatforms.com/docs/MA/api/media/file/chooseImage): chọn/chụp ảnh qua SDK.
- [Tesseract.js API](https://github.com/naptha/tesseract.js/blob/master/docs/api.md): OCR trong worker, model tiếng Việt, terminate sau khi dùng.

## Cách dùng

Owner → Vùng nuôi → Thêm vùng nuôi. Trong chi tiết vùng, chọn Thêm bè; sửa bè hiện có bằng Sửa.

### Vị trí

Trong form vùng hoặc bè:

1. Nhập tay vĩ độ/kinh độ; hoặc bấm **Lấy vị trí qua Zalo** sau khi đọc lý do xin quyền.
2. App lấy access token và location token, gửi endpoint OMTS. Backend chỉ nhận Owner có Zalo ID liên kết khớp access token, trả tọa độ, không lưu vị trí/raft trong bước này.
3. Owner xem vị trí điện thoại và bấm **Dùng tọa độ này**; chỉ dùng nếu đang ở vị trí cần ghi.
4. Hoặc mở **Chọn điểm trên bản đồ**, chạm điểm hoặc kéo ghim, rồi xác nhận. Tọa độ vùng chỉ căn giữa map cho bè mới; không tự gán thành vị trí bè.
5. Bấm **Lưu** trên form mới gọi API tạo/sửa thật, theo quyền và rowVersion hiện hữu.

`services/coordinates.ts` nhận dấu chấm hoặc phẩy thập phân, kiểm tra phạm vi ±90/±180, không loại dấu chấm như phân cách hàng nghìn. Giá trị `21.123` trước đây có thể bị đọc sai bởi `parseNumber` của tiền/số lượng; tọa độ giờ dùng parser riêng.

### OCR giấy/biểu mẫu

Chọn **Đọc biểu mẫu bằng OCR** trong form bè, chọn/chụp ảnh (trình duyệt dùng file input; Zalo dùng chooseImage). Ảnh không được gửi lên server/nhà cung cấp OCR. Worker chạy trên thiết bị; mã lõi và model được tải từ CDN, cacheMethod none không yêu cầu IndexedDB. Worker JS nằm trong asset của app.

Nhận nhãn trên từng dòng, có dấu hai chấm hoặc bằng: `Mã bè`, `Kích thước`, `Số hàng`, `Dài mỗi hàng`/`Chiều dài mỗi hàng`, `Vị trí`, `Ghi chú`/`Tình trạng`, `Vĩ độ`, `Kinh độ`; có hỗ trợ nhãn không dấu và chữ hoa. Tọa độ từ OCR chỉ nhận dạng thập phân, không tự suy đoán DMS hoặc các con số không có nhãn.

Màn kiểm tra hiển thị các trường có thể sửa và chữ đọc được; độ tin cậy thấp được cảnh báo. **Áp dụng vào form** chỉ thay các ô không rỗng; có thể sửa tiếp trước khi Lưu. Khi sửa bè, OCR không thay bố trí/số hàng hiện có. Có nút hủy, thời gian chờ giới hạn, dọn worker khi hủy/rời màn. Chữ in rõ là trường hợp thử nghiệm; chữ viết tay cần kiểm tra thủ công.

## Kiểm chứng

- Backend build: 0 warning, 0 error. Toàn bộ suite cuối: Domain 2 passed; Application 129 passed; API Integration 728 passed, 104 skipped do thiếu môi trường SQL Server/Azurite; không có failure.
- Riêng nhóm Zalo liên quan: 35 passed, gồm Owner/anonymous/Trader, Zalo ID khác tài khoản, token thiếu/hết hạn, tọa độ ngoài phạm vi, Graph headers và secret không nằm trên query.
- Mobile: lint, typecheck và production build đạt; worker khoảng 111 KB, tách khỏi mã map. Map và OCR engine tải theo nhu cầu.
- Chrome 390×844: GPS giả đi qua endpoint giả và yêu cầu xác nhận; map SDK thật dùng basemap stub để kiểm tra chạm và xác nhận (không khẳng định VIETMAP tile thật hoạt động); ảnh PNG chữ in được OCR thật qua Tesseract.js, đọc mã, kích thước, 8 hàng và tọa độ; form không đổi trước xác nhận; API tạo bè nhận đúng decimal 21.123/107.456.
- Chưa xác nhận trực tiếp trên Zalo điện thoại: quyền vị trí/camera, WebAssembly/worker và tile VIETMAP thật. Không giả nhận thành công khi quyền/provider bị từ chối.

## Lỗi và cách xử lý

- Patch đầu có context không tồn tại: apply_patch từ chối toàn bộ, xác nhận không có file ghi dở rồi áp lại đúng context.
- Browser check OCR lần đầu bị reload do Vite tối ưu dependency mới: chạy lại sau khi server ổn định thì đạt.
- Bộ kiểm tra UI dùng selector mọi input nên nhìn nhầm input của Sheet OCR thành input form, báo sai “overwrote before confirmation”; giới hạn selector trong `.raft-form-fields`, chạy lại xác nhận form chỉ đổi sau khi áp dụng.
- Full backend tests ban đầu bị user-secrets chọn Graph khiến fake token bị gửi đến Zalo thật; test host chuyển Graph thành Fake chỉ trong Development, giữ nguyên unset-provider và Staging/Production. Thử ép Fake cho mọi môi trường làm các test Production thất bại, đã thay bằng PostConfigure có điều kiện. Suite cuối không lỗi.
- Một lần build test trong lúc testhost cũ giữ DLL dẫn đến MSB3027/MSB3021. Không dừng API đang chạy; đổi BaseOutputPath và chờ testhost kết thúc trước lần chạy tiếp theo.

## Giải thích khi bảo vệ

- Zalo không biết vị trí của bè từ mã bè: API cho vị trí điện thoại, Owner phải đứng đúng chỗ và xác nhận.
- App secret nằm trên backend; mobile chỉ gửi token SDK cho endpoint có xác thực và giới hạn Owner.
- Chọn map không gọi GPS và không xin quyền vị trí; OCR giấy không tự sinh tọa độ nếu giấy không ghi.
- Nhận dạng và lưu là hai bước khác nhau: OCR/GPS/map chỉ nhập dữ liệu, API tạo/sửa hiện hữu mới lưu nghiệp vụ.
