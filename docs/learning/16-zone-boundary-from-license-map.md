# Ranh giới vùng nuôi đọc từ sơ đồ cấp phép khu vực biển

## 1. Vấn đề và phạm vi đã chốt

- **Cập nhật 26/11/2026:** ảnh bản đồ không còn đọc bằng Tesseract trên điện thoại. Ảnh được **gửi lên máy chủ OMTS và đọc bằng
  Google Gemini**; chỉ đọc các bảng tọa độ điểm góc, bỏ qua phần hình vẽ. Phần đổi hệ VN-2000 → WGS84, đối chiếu, bản đồ và lưu
  giữ nguyên. Hệ quả riêng tư: ảnh giấy phép rời điện thoại và rời máy chủ HTX tới Google; khóa Gemini miễn phí chỉ để thử, ảnh
  thật của HTX cần khóa có thanh toán (Google không dùng dữ liệu của khóa trả phí để huấn luyện). Mục 5 và 6 ghi lại cách đọc
  cũ bằng Tesseract, giữ làm lịch sử và để hiểu vì sao có bước đối chiếu X, Y.
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
| `src/features/farming/components/ZoneMapScan/ZoneMapScan.tsx` | Nút "Chụp bản đồ giấy phép": chụp, thu nhỏ ảnh, gửi, chờ kết quả, đưa vào màn hình |
| `src/components/PhotoCapture/PhotoCapture.tsx` | Chạm một lần mở camera sau; "Chọn ảnh có sẵn" là đường dự phòng; nút tự mở khóa sau 2 giây |
| `src/hooks/useScanJob.ts` | Gửi ảnh nhận `scanId`, hỏi lại mỗi 2 giây tới khi xong, tối đa 120 giây, hủy được |
| `src/components/ScanProgress/ScanProgress.tsx`, `src/utils/scanErrorText.ts` | "Đang đọc ảnh… (thường 20–60 giây)", nút Hủy, lỗi bận/quá giới hạn/không đọc được bằng tiếng Việt |
| `src/features/farming/services/scanService.ts` | `startBoundaryScan`, `boundaryScan` (và hai hàm cho giấy tờ bè) |
| `src/features/farming/utils/boundaryScan.ts` | Kết quả máy chủ → `CornerTableReading`, gộp khu vào danh sách, so diện tích tính từ X, Y với diện tích giấy ghi |
| `src/utils/imageFile.ts` (`scanPhoto`) | Thu ảnh về cạnh dài 3072 px, tối đa 4 MB, JPEG chất lượng 0,9 trước khi gửi |
| `src/features/farming/utils/zoneBoundary.ts` | Đối chiếu điểm, dựng GeoJSON, điểm trong/ngoài vùng, diện tích, đường tự cắt, điểm lạc |
| `src/features/farming/pages/ZoneBoundaryPage.tsx` | Màn `/manage/zones/:id/boundary` |
| `src/features/farming/utils/boundaryLayers.ts` | Vẽ ranh giới lên Vietmap |
| `RaftFormPage`, `LocationInput`, `LocationMap`, `RaftMap` | Báo ngay khi ghim bè ngoài ranh giới, hỏi lại khi lưu, tô đỏ bè ngoài vùng |

Đã gỡ cùng tesseract.js: `cornerTable.ts` (đọc chữ OCR thành điểm góc), `tableImage.ts` (Otsu, chỉnh nghiêng, xóa đường kẻ),
`ocrService.ts`, `zoneMapOcrService.ts`, bước khung/xoay ảnh `CornerTableScan`. Thư mục build nhẹ đi khoảng 136 KB (tệp worker
111 KB và phần mã gọi nó); lõi và model tiếng Việt của Tesseract trước đây còn tải thêm từ CDN lúc chạy.

## 4. Luồng dữ liệu

1. Chi tiết vùng → **Ranh giới vùng** → **Chụp bản đồ giấy phép** (camera sau mở ngay; "Chọn ảnh có sẵn" mở thư viện).
2. Ảnh thu về cạnh dài 3072 px, tối đa 4 MB, rồi `POST /api/zones/{id}/boundary-scans` (Chủ HTX, vùng đang dùng) trả `scanId`.
3. App hỏi `GET …/boundary-scans/{scanId}` mỗi 2 giây, tối đa 120 giây; có nút "Hủy đọc ảnh". Máy chủ bận (503 `OCR_BUSY`), vượt
   giới hạn (429) hoặc đọc không được (`UNAVAILABLE`, `TIMEOUT`, `BAD_RESPONSE`, `NOT_CONFIGURED`) đều hiện lời tiếng Việt và vẫn cho
   nhập tay.
4. Kết quả gồm từng khu: tên, diện tích giấy ghi, các điểm (nhãn, X, Y, vĩ/kinh độ chép nguyên nếu bảng có) và kinh tuyến trục.
   `toCornerTableReading` đổi về dạng màn hình đã dùng; kinh tuyến trục điền vào ô kinh tuyến trục (mặc định 107°45' nếu không đọc được).
5. Màn hình hiện từng điểm với nhãn: Khớp X, Y / Lệch X, Y n m / Chưa có X, Y để đối chiếu / Xa các điểm khác. Chạm điểm để sửa.
   Mỗi khu có dòng "Tính từ tọa độ: A ha · Giấy ghi: W ha" kèm nhãn xanh "Khớp diện tích" hoặc vàng "Lệch diện tích, kiểm tra lại
   tọa độ" (lệch quá 2% hoặc 0,05 ha). Diện tích tính lại theo các điểm đang hiện, nên đổi khi người dùng sửa số. Chỉ là cảnh báo.
6. **Xem ranh giới trên bản đồ** vẽ bản nháp cùng các bè; **Lưu ranh giới** gửi GeoJSON WGS84. Điểm lệch, chưa đối chiếu,
   điểm lạc, đường tự cắt, diện tích lệch hoặc bè hiện có nằm ngoài đều được hỏi lại trước khi lưu, không chặn lưu.
7. Thêm hoặc sửa bè: ghim ngoài ranh giới hiện cảnh báo ngay dưới ô tọa độ (mọi cách nhập: GPS, bản đồ, đọc ảnh, gõ tay), bản đồ
   chọn vị trí vẽ ranh giới, bấm Lưu thì hỏi "Vẫn lưu?". Backend vẫn tự kiểm tra và trả `RAFT_OUTSIDE_ZONE_BOUNDARY`.

## 5. Lỗi gặp và chẩn đoán (đọc bằng Tesseract, đã bỏ ngày 26/11/2026)

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

## 6. Kiểm chứng

- **Đọc bằng Gemini (26/11/2026):** `npm run lint`, `npm run typecheck`, `npm run build` đạt. Chưa thử ảnh thật trên Zalo và chưa so với
  bản đồ mẫu 4 khu (K1–K8, K9–K15, K16–K22, K23–K27); việc đó thuộc bước thử trên staging khi backend có Gemini.
- Các mục dưới đây là kiểm chứng của cách đọc cũ; phần đổi hệ và đối chiếu vẫn còn hiệu lực.

- Phép đổi hệ so với pyproj 3.8 (EPSG:4756 → EPSG:4326 và phép chiếu tmerc 107°45'): sai khác dưới 1e-7 độ (dưới 1 cm).
- Bảng thử sinh bằng pyproj (số khớp thật), in bằng Times New Roman, làm mờ, nghiêng 0 đến 2°, chữ 12 đến 18 px, đọc bằng
  tesseract.js 7 thật rồi qua bộ đọc: 69 điểm trên 8 ảnh khó, 43 điểm khớp X, Y, 4 điểm báo lệch, 4 điểm đọc sai nằm trong nhóm
  "chưa đối chiếu" (nhãn cảnh báo, hỏi lại khi lưu), các điểm còn lại đọc đúng.
- Một chữ số X sai 50 m bị báo "Lệch X, Y 50 m"; ranh giới lưu rồi mở lại vẫn ra đúng số trên giấy và vẫn khớp.
- `npm run lint`, `npm run typecheck`, `npm run build` đạt.
- **Chưa thử**: ảnh chụp thật của sơ đồ trên điện thoại trong Zalo. Ảnh mẫu người dùng gửi chỉ 960×1280, chữ trong bảng cao
  khoảng 4 px nên không OCR được; cần chụp gần bảng (chữ cao ít nhất khoảng 15 px trong ảnh).

## 7. Câu hỏi bảo vệ

- **Sao không lấy luôn số trên giấy làm tọa độ bản đồ?** Giấy ghi hệ VN-2000, bản đồ và GPS dùng WGS84, lệch khoảng 220 m ở
  Vân Đồn. Phải đổi bằng 7 tham số chính thức.
- **Làm sao biết OCR đọc đúng?** Mỗi điểm có hai cách ghi độc lập (vĩ/kinh độ và X, Y). Chiếu một cách sang cách kia, lệch dưới
  3 m thì cả hai cùng đúng; xác suất hai cột cùng sai mà vẫn khớp nhau là rất nhỏ.
- **Sao ảnh giờ gửi lên server để đọc?** (26/11/2026) Tesseract trên điện thoại đọc bảng in kẻ ô rất kém và phải tự làm sạch ảnh,
  sửa lỗi chữ số. Gemini đọc được cả bảng, nhưng ảnh phải rời điện thoại tới máy chủ OMTS rồi tới Google. Vì vậy app ghi rõ điều đó
  ngay dưới nút chụp, ảnh thật của HTX cần khóa Gemini có thanh toán, và người dùng vẫn đối chiếu từng điểm trước khi lưu.
- **Sao bè ngoài vùng không bị chặn?** Quyết định của PM (25/11/2026): GPS điện thoại sai vài mét, bè có thể bị trôi hoặc đặt
  tạm; app cảnh báo rõ và hỏi lại, quyết định cuối thuộc về Chủ HTX. Backend vẫn kiểm tra độc lập với app.
- **Một sơ đồ có nhiều khu thì sao?** Mỗi khu là một Feature; một vùng nuôi có thể gồm một hoặc nhiều khu. Bè nằm trong bất kỳ
  khu nào của vùng đều tính là trong ranh giới.
