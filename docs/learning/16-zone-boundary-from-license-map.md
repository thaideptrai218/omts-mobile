# Ranh giới vùng nuôi đọc từ sơ đồ cấp phép khu vực biển

## 1. Vấn đề và phạm vi đã chốt

- Người dùng yêu cầu (25/11/2026): mở rộng OCR để quét **sơ đồ khu vực biển đề nghị cấp phép nuôi trồng thủy sản**,
  lấy vĩ độ, kinh độ các điểm góc, khoanh vùng bằng GeoJSON; sau này Chủ HTX thêm bè mà nằm ngoài vùng thì báo ngay.
- Đã hỏi và chốt: bè ngoài ranh giới **chỉ cảnh báo, vẫn cho lưu** (giống quy tắc bè cách vùng hơn 5 km chốt 11/11/2026).
  Backend trả lưu ý `RAFT_OUTSIDE_ZONE_BOUNDARY`, không có mã lỗi MSG mới.
- Ranh giới lưu trên **vùng nuôi** (`FarmingZone.BoundaryGeoJson`), API riêng `PUT /api/zones/{id}/boundary`, để sửa thông tin
  vùng (`PUT /api/zones/{id}`) không vô tình xóa ranh giới.

## 2. Khái niệm

### Sơ đồ ghi tọa độ hệ VN-2000, bản đồ dùng WGS84

Bảng "Tọa độ các điểm góc khu N" có hai cách ghi cùng một điểm: vĩ độ, kinh độ (độ-phút-giây) và X, Y (mét). Cả hai thuộc hệ
**VN-2000**; X là hướng bắc, Y là hướng đông của phép chiếu UTM múi 3°, hệ số 0,9999, kinh tuyến trục theo tỉnh (Quảng Ninh
107°45'). GPS điện thoại và bản đồ Vietmap dùng **WGS84**. Hai hệ dùng cùng elipxoit nhưng gốc lệch nhau, ở Vân Đồn khoảng
195 m về phía đông và 110 m về phía nam. Dùng thẳng số trên giấy làm tọa độ bản đồ là sai khoảng 220 m, đủ để báo nhầm mọi bè.

Đổi hệ: vĩ/kinh độ → tọa độ địa tâm X, Y, Z → phép Helmert 7 tham số (EPSG "VN-2000 to WGS 84 (2)", QĐ 05/2007/QĐ-BTNMT,
quy ước coordinate frame) → vĩ/kinh độ WGS84. Đổi X, Y ↔ vĩ/kinh độ dùng chuỗi Krüger của phép chiếu Transverse Mercator.

### Hai cột tự kiểm tra nhau

Vĩ/kinh độ chiếu sang X, Y (cùng hệ VN-2000, không cần đổi hệ) phải trùng X, Y in trên giấy, lệch dưới 0,3 m do làm tròn.
Nếu lệch quá 3 m thì có ít nhất một chữ số đọc sai. Đây là cách duy nhất để biết OCR đọc đúng mà không cần người dò từng số.

### GeoJSON

Ranh giới là `FeatureCollection` (RFC 7946): mỗi khu một `Feature` có `Polygon` một vòng, điểm là `[kinh độ, vĩ độ]` WGS84,
điểm đầu trùng điểm cuối; `properties` giữ tên khu và tên điểm góc (A1, A2…). Vietmap vẽ thẳng được dữ liệu này.

## 3. Mã nguồn

| Tệp | Vai trò |
| --- | --- |
| `src/features/farming/utils/vn2000.ts` | Đổi VN-2000 ↔ WGS84, X/Y ↔ vĩ/kinh độ, đọc và viết độ-phút-giây |
| `src/features/farming/utils/cornerTable.ts` | Đọc chữ OCR của bảng thành các điểm góc, chọn cách hiểu khớp X, Y |
| `src/utils/tableImage.ts` | Ngưỡng Otsu, tự chỉnh nghiêng, xóa đường kẻ ô trên ảnh xám |
| `src/utils/imageFile.ts` (`ocrImage`, `rotatedPreview`) | Cắt, xoay, phóng to, làm sạch ảnh trước khi đọc |
| `src/services/ocrService.ts` | Chạy tesseract.js trên thiết bị (dùng chung với OCR giấy tờ bè) |
| `src/features/farming/utils/zoneBoundary.ts` | Đối chiếu điểm, dựng GeoJSON, điểm trong/ngoài vùng, diện tích, đường tự cắt, điểm lạc |
| `src/features/farming/pages/ZoneBoundaryPage.tsx` | Màn `/manage/zones/:id/boundary` |
| `src/features/farming/utils/boundaryLayers.ts` | Vẽ ranh giới lên Vietmap |
| `RaftFormPage`, `LocationInput`, `LocationMap`, `RaftMap` | Báo ngay khi ghim bè ngoài ranh giới, hỏi lại khi lưu, tô đỏ bè ngoài vùng |

## 4. Luồng dữ liệu

1. Chi tiết vùng → **Ranh giới vùng** → **Chụp hoặc chọn ảnh sơ đồ**.
2. Sheet "Chọn bảng tọa độ": **Xoay ảnh 90°** tới khi chữ nằm ngang, kéo khung quanh một hoặc nhiều bảng.
3. `ocrImage`: cắt và xoay ảnh gốc, phóng chữ lên khoảng 30 px, ảnh xám, tự chỉnh nghiêng (±5°), xóa đường kẻ ô.
4. `recognizeText(layout: "table")`: tesseract PSM 4 (một cột nhiều dòng) để giữ nguyên từng hàng của bảng.
5. `extractCornerTable`: tách khu theo dòng "Tọa độ các điểm góc khu N", đọc kinh tuyến trục ở đầu bảng, mỗi dòng sinh nhiều
   cách hiểu rồi chọn cặp vĩ/kinh độ và X, Y khớp nhau.
6. Màn hình hiện từng điểm với nhãn: Khớp X, Y / Lệch X, Y n m / Chưa có X, Y để đối chiếu / Xa các điểm khác. Chạm điểm để sửa.
7. **Xem ranh giới trên bản đồ** vẽ bản nháp cùng các bè; **Lưu ranh giới** gửi GeoJSON WGS84. Điểm lệch, chưa đối chiếu,
   điểm lạc, đường tự cắt hoặc bè hiện có nằm ngoài đều được hỏi lại trước khi lưu.
8. Thêm hoặc sửa bè: ghim ngoài ranh giới hiện cảnh báo ngay dưới ô tọa độ (mọi cách nhập: GPS, bản đồ, OCR, gõ tay), bản đồ
   chọn vị trí vẽ ranh giới, bấm Lưu thì hỏi "Vẫn lưu?". Backend vẫn tự kiểm tra và trả `RAFT_OUTSIDE_ZONE_BOUNDARY`.

## 5. Lỗi gặp và chẩn đoán

- **Tesseract bỏ gần hết bảng**. Ảnh bảng in có kẻ ô, đọc PSM 6 (mặc định của tesseract.js) chỉ ra hai dòng tiêu đề. PSM 3 đọc
  được bảng thẳng nhưng chỉ nghiêng 0,7° là hỏng; sau khi xóa đường kẻ, PSM 3 lại đọc theo cột (hết cột vĩ độ mới tới kinh độ).
  Đo trên ảnh thử: tự chỉnh nghiêng + xóa đường kẻ + PSM 4 cho kết quả ổn định nhất.
- **Chỉnh nghiêng luôn ra 0°**. Lấy mẫu điểm ảnh cách 3 px nhưng đếm theo từng hàng 1 px: lưới lấy mẫu tự tạo đỉnh ở góc 0°.
  Sửa: ô đếm rộng bằng bước lấy mẫu.
- **Xóa đường kẻ ăn mất nét chữ**: chữ dính liền trong một từ tạo loạt điểm tối dài hơn ngưỡng. Sửa: đường kẻ phải dài ít nhất
  1/12 cạnh ảnh và gấp 3 lần cỡ chữ ước lượng.
- **Kinh tuyến trục đọc thành 107°00'** khi phút bị nhòe ("107°4$'"), làm mọi điểm lệch X, Y. Sửa: phút nhòe thì bỏ qua và dùng
  mặc định 107°45'; người dùng vẫn sửa được ô kinh tuyến trục.
- **Lookbehind regex** chạy được trên máy tính nhưng làm WebView iOS trước 16.4 báo lỗi cú pháp khi tải file; bộ đọc chỉ dùng
  lookahead.
- `GeoJSON.FeatureCollection` báo TS2503 vì dự án không có `@types/geojson`; kiểu `ZoneBoundary` tự khai báo là đủ cho Vietmap.
- **Bảng chỉ có X, Y viết kiểu Việt Nam không ra điểm nào** (người dùng thử ngày 25/11/2026). Sơ đồ ghi `2.315.876,23`; bước
  đổi dấu phẩy thành dấu chấm biến nó thành `2.315.876.23` và không nhóm số nào lọt vào khoảng X, Y. Ảnh người dùng gửi vẫn ra
  7/8 điểm chỉ vì OCR làm rơi hết dấu ngăn (`231587623`), riêng dòng còn giữ dấu (`437.532,19`) bị bỏ. Sửa: `thousands` trong
  `normalize` gộp số có dấu ngăn hàng nghìn (phần nguyên từ 6 chữ số) trước khi đổi dấu phẩy. Cùng ảnh đó còn hai lỗi tên
  điểm: đường kẻ ô thành chữ số rác ("7 K2", "1 K3") và hai dòng mất tên liền nhau thì dòng sau không nối được tên; `label`
  bỏ qua một chữ số rác đứng riêng, `ordered` lấy tên vừa đặt của dòng trước.
- **Trong Zalo trên iPhone, bộ đọc chữ không chạy** (người dùng thử ngày 25/11/2026), dù cùng mã chạy được trên Chrome máy
  tính. Màn hình lúc đầu chỉ báo "Chưa đọc được ảnh": tesseract.js trả chuỗi hoặc undefined chứ không phải `Error`, nên rơi vào
  câu mặc định. Đọc mã tesseract.js 7 (`createWorker.js`, `worker-script/index.js`): lỗi trong lúc tải lõi, tải dữ liệu chữ hay
  đọc ảnh đều được worker bắt và gửi về dạng `reject` (đi qua `errorHandler`, ra câu "Không đọc được ảnh. Vui lòng thử ảnh rõ
  hơn…"); chỉ khi chính tệp worker không tải hoặc không chạy được thì `worker.onerror` mới trả chuỗi. Vậy lỗi nằm ở bước
  `new Worker(<tệp worker của app>)`. Sửa: `loadWorkerSource` nạp mã worker bằng `fetch` ở luồng chính rồi chạy từ Blob URL.
  Mọi câu lỗi của bộ đọc giờ kèm "(chi tiết: …)" để biết chính xác nguyên nhân nếu còn gặp; câu chung chung chỉ còn cho
  trường hợp không ai ngờ tới.

## 6. Kiểm chứng

- Phép đổi hệ so với pyproj 3.8 (EPSG:4756 → EPSG:4326 và phép chiếu tmerc 107°45'): sai khác dưới 1e-7 độ (dưới 1 cm).
- Bảng thử sinh bằng pyproj (số khớp thật), in bằng Times New Roman, làm mờ, nghiêng 0 đến 2°, chữ 12 đến 18 px, đọc bằng
  tesseract.js 7 thật rồi qua bộ đọc: 69 điểm trên 8 ảnh khó, 43 điểm khớp X, Y, 4 điểm báo lệch, 4 điểm đọc sai nằm trong nhóm
  "chưa đối chiếu" (nhãn cảnh báo, hỏi lại khi lưu), các điểm còn lại đọc đúng.
- Một chữ số X sai 50 m bị báo "Lệch X, Y 50 m"; ranh giới lưu rồi mở lại vẫn ra đúng số trên giấy và vẫn khớp.
- Ảnh bảng "Tọa độ các điểm góc khu 1" người dùng chụp (311×371, chỉ có X, Y, số kiểu Việt Nam), chạy trong Chrome qua đúng
  `readCornerTable`: 8/8 điểm, đúng tên K1 đến K8. Hai điểm sai một chữ số do ảnh quá nhỏ: K1 lệch 100 km (màn hình báo
  "Xa các điểm khác"), K6 lệch 10 m (không phát hiện được vì bảng không có vĩ/kinh độ để đối chiếu; mọi điểm của bảng này đều
  mang nhãn "Chưa có vĩ/kinh độ để đối chiếu"). Bảng chỉ có X, Y thì người dùng phải dò từng số với giấy.
- `npm run lint`, `npm run typecheck`, `npm run build` đạt.
- **Chưa thử**: ảnh chụp thật của sơ đồ trên điện thoại trong Zalo. Ảnh mẫu người dùng gửi chỉ 960×1280, chữ trong bảng cao
  khoảng 4 px nên không OCR được; cần chụp gần bảng (chữ cao ít nhất khoảng 15 px trong ảnh).

## 7. Câu hỏi bảo vệ

- **Sao không lấy luôn số trên giấy làm tọa độ bản đồ?** Giấy ghi hệ VN-2000, bản đồ và GPS dùng WGS84, lệch khoảng 220 m ở
  Vân Đồn. Phải đổi bằng 7 tham số chính thức.
- **Làm sao biết OCR đọc đúng?** Mỗi điểm có hai cách ghi độc lập (vĩ/kinh độ và X, Y). Chiếu một cách sang cách kia, lệch dưới
  3 m thì cả hai cùng đúng; xác suất hai cột cùng sai mà vẫn khớp nhau là rất nhỏ.
- **Sao ảnh không gửi lên server để đọc?** OCR chạy trên điện thoại bằng tesseract.js như OCR giấy tờ bè: không gửi ảnh giấy
  phép ra ngoài, không tốn chi phí dịch vụ OCR. Đổi lại phải tự làm sạch ảnh và tự sửa lỗi đọc.
- **Sao bè ngoài vùng không bị chặn?** Quyết định của PM (25/11/2026): GPS điện thoại sai vài mét, bè có thể bị trôi hoặc đặt
  tạm; app cảnh báo rõ và hỏi lại, quyết định cuối thuộc về Chủ HTX. Backend vẫn kiểm tra độc lập với app.
- **Một sơ đồ có nhiều khu thì sao?** Mỗi khu là một Feature; một vùng nuôi có thể gồm một hoặc nhiều khu. Bè nằm trong bất kỳ
  khu nào của vùng đều tính là trong ranh giới.
