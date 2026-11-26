# Soát bố cục toàn app trên khổ điện thoại (26/11/2026)

## 1. Vấn đề và phạm vi

Người dùng yêu cầu soát lại toàn bộ app mobile, từng component và từng file CSS, rồi sửa những chỗ lỗi hoặc thiếu: mất nút,
tràn ngang, các phần đè lên nhau. Đợt này không thêm bước nghiệp vụ nào. Các sửa đổi chỉ làm cho nút, chữ và số hiện đúng
và bấm được.

Có hai cách soát chạy song song:

- **Chạy app thật trong Chrome không giao diện**, mở 120 màn bằng bốn vai: Chủ HTX, thương lái, nhân viên và quản lý vùng.
  - Mỗi màn được đo ở ba khổ: 360×780 cỡ chữ thường, 320×640 với "Chữ rất lớn", và 360 ở chế độ tối.
  - Script đăng nhập tài khoản demo, đi từng đường dẫn bằng `history.pushState` rồi đo trên DOM: tràn ngang, phần tử bị cắt,
    nút bị lớp khác che (`elementFromPoint` tại tâm nút sau khi cuộn nút vào giữa màn), chữ đè chữ, chữ nhỏ hơn 0,9375rem,
    từ bị bẻ giữa chừng (`Range.getClientRects` trả hai dòng cho một từ), hai khối có viền đứng sát nhau, và lỗi trong console.
  - Backend là bản `develop` chạy trên một database riêng (`OMTS_UiReview`), nạp bằng `seed --bootstrap --demo`, nên database
    `OMTS` đang dùng không bị đụng tới.
- **Đọc code theo mảng**: CSS chung và component dùng chung; vùng nuôi và truy xuất; mua hàng và bán hàng; lương, khách
  hàng và tổ chức; tài chính, nhân công, khiếu nại, nhật ký và báo cáo. Mỗi lỗi được kiểm lại trong code hoặc trên màn chạy
  thật rồi mới sửa.

## 2. Nguyên nhân gốc và cách sửa ở CSS chung

### Số tiền bị bẻ giữa chữ số

`.row__value` từng có `flex: none; max-width: 40%; overflow-wrap: anywhere`. Ở khổ 320px với chữ 21px, cột số chỉ còn khoảng
104px, nên "12.500.000 đ" bị bẻ thành "12.500.00" và "0 đ", dễ đọc thành hai số khác nhau. Các nhãn trong cột chữ cũng không
co được nên đè lên số.

Cách sửa: dòng được phép xuống hàng (`.row { flex-wrap: wrap }`, cột chữ `flex: 1 1 7rem`). Số bên phải bỏ `anywhere` và
dùng `margin-left: auto`, nên khi hàng hẹp cả con số xuống dòng dưới và canh phải, không bao giờ bị bẻ. `.menu-row` (dòng
"Cỡ chữ") và `.summary__value` sửa theo cùng một cách.

### Bảng con (sheet) ép danh sách còn một vệt

`.sheet-form.form` vừa là cột flex vừa có `max-height`. Khi nội dung cao hơn giới hạn, trình duyệt co các khối con thay vì
cuộn. `.rows` có `overflow: hidden` nên kích thước tối thiểu tự động của nó là 0, và toàn bộ phần co dồn vào danh sách: sheet
các lô của Báo cáo chỉ còn 0 đến 20px cho danh sách lô.

Cách sửa: `.sheet-form > * { flex-shrink: 0 }`. Đồng thời bỏ `.workforce-sheet` và `.yield-sheet`: hai quy tắc này ghi đè giới
hạn chiều cao của `.sheet-form` bằng `75vh`, cao hơn giới hạn chừa menu Zalo trên máy thấp.

### Nội dung sheet của ZaUI không tự cuộn

ZaUI đặt con của `Sheet` vào `.zaui-sheet-content { overflow: hidden; touch-action: none }`. Bảng "Thông tin HTX" ở tab Tài
khoản dài hơn màn hình nên mất hai dòng cuối, "Hỗ trợ và khiếu nại" và "Phiên bản", mà Zalo bắt buộc phải hiện. Đã bọc
bảng trong `.sheet-form`. Các sheet khác trong app đều đã có `.sheet-form`; đã kiểm bằng script.

### Thẻ dính nhau

`.card` và `.rows` không có lề ngoài. Đặt hai khối liền nhau trong một mục (`section.block`) hoặc ngay trong thân trang thì
chúng dính thành một khối, và bóng dưới của thẻ trên đè lên viền thẻ dưới. Quy tắc mới:

`:where(.screen__body, .block) > :where(.card, .rows) + :where(.card, .rows) { margin-top: 12px }`

`:where` có độ ưu tiên 0, nên không lấn bất kỳ quy tắc lề nào đã có. Quy tắc chỉ áp cho con trực tiếp của trang hoặc của
mục, không áp trong cột `.form`, vì ở đó `gap` đã lo khoảng cách.

### Các chỗ nhỏ khác

- `body { overflow-wrap: break-word }`: chuỗi dài không có khoảng trắng (đường link, ghi chú gõ liền) xuống dòng thay vì đẩy
  trang tràn ngang. Chuỗi chỉ bị bẻ khi một dòng không chứa nổi, nên số tiền và mã ngắn không bị ảnh hưởng.
- Nhãn trạng thái đặt thẳng trong `.form` bị kéo dài hết chiều ngang thẻ. Sửa bằng `.form > .badge { align-self: flex-start }`.
- Bảng thông tin (`Facts`, `dl.info.card`) đặt trong một thẻ khác thành hai viền lồng nhau. Sửa bằng `.card .info.card`, bỏ
  khung trong.
- Nhóm nút trong chân trang cộng thêm lề trên. Sửa bằng `.page-footer .action-row, .page-footer .button-stack { margin: 0 }`.
- Snackbar từng nằm cố định cách đáy 92px nên che nút trên của chân trang hai nút, và che cả phao Quét mã.
  - `ManagePage` giờ đo chân trang bằng `ResizeObserver` và gán `--page-footer-height`, để snackbar nổi ngay trên chân trang.
  - Ở các tab chính, snackbar cao thêm 26px để nằm trên đỉnh phao.
- Thanh tab dưới, khổ 320px với "Chữ rất lớn": nhãn đậm "Tổng quan" xuống hai dòng và tràn khỏi thanh. Ở cỡ chữ này nhãn
  giữ một dòng, cỡ 0,9375rem, và biểu tượng không bị co.
- Chuông "Thông báo" ở chỗ hẹp: con số chưa đọc nổi ở góc trên bên phải nút, để chữ không bị gãy thành "Thông / báo".
- Chế độ tối: nền `--brand-soft` gần trùng màu thẻ (1,07:1), nên tab đang chọn, dòng đang bấm và thông báo chưa đọc trông
  như không có trạng thái.
  - Chỉ nền của các trạng thái này đổi sang `#164a5c`: chữ thường trên nền này đạt 9:1, chữ phụ 6,3:1.
  - Vạch màu mặc định của việc cần xử lý dùng `--brand-text`.
- Khung chọn vùng ảnh (`ImageFrame`): lớp làm tối dùng `box-shadow` 9999px, nên khung ngoài phải `overflow: hidden`, và
  cái đó cắt luôn nút kéo 48px ở góc. Giờ lớp tối nằm riêng và chỉ lớp đó bị cắt theo mép ảnh, còn nút kéo luôn hiện trọn.
- `.empty--compact` trước đây chưa có quy tắc nào. Lỗi dạng một chuỗi liền trong `.form-error` giờ xuống dòng.

## 3. Sửa trong từng màn

- **Cổng quyền** của Lương, Mua bán, Khiếu nại và Công việc: nếu lần tải `api/me/permissions` lúc mở app bị lỗi (mất mạng),
  màn đứng mãi ở "Đang tải...". `PermissionsPending` giờ tự tải lại quyền; lỗi thì hiện chữ lỗi và nút "Thử lại".
- **Nhân viên**:
  - Thẻ nhắc mở tài khoản sau khi cho nghỉ việc xếp chữ và nút theo cột dọc.
  - "Cho nghỉ việc" và "Sửa hồ sơ" trong thân trang chỉ hiện với người được quản lý hồ sơ đó, giống chân trang.
- **Gộp hồ sơ khách hàng**: hồ sơ đang giữ lại bị bỏ ngay lúc tải danh sách. Trước đây danh sách đếm "1 hồ sơ" rồi hiện một
  khung trống.
- **Kế hoạch ngày công**: danh sách nhân viên hoặc người phụ trách trống thì có câu giải thích, thay vì một nút bị khóa
  không rõ lý do.
- **Vai trò**: chín mã chức năng mới của backend (`CASH_BOOK`, `INPUT_ISSUES`, `SALES_ORDERS`…) có tên tiếng Việt, không
  còn hiện mã tiếng Anh.
- **Giấy tờ của vùng**: khóa React của danh sách giấy tờ đổi sang `documentId`, vì một vùng có hai giấy phép nuôi (bản cũ
  đã thay và bản mới) nên khóa theo loại giấy bị trùng.
- **Bản đồ bè**:
  - Nhãn ghim chỉ ghi mã bè, và bản đồ được phóng tới mức 18. Trước đây nhãn "Bè B1-09 · Ngừng dùng" của các bè gần nhau
    chồng lên nhau, nên không bấm được bè bên dưới.
  - Bè ngừng dùng và bè ngoài ranh giới phân biệt bằng kiểu nhãn: nền trắng viền xám, và đỏ viền nét đứt.
  - Bản đồ xem trước ở màn ranh giới chỉ để xem: nhãn và danh sách không còn là nút bấm không làm gì.
  - Hộp tên vùng có chữ 1rem, đọc được ở chế độ tối.
  - Một ô bản đồ lỗi sau khi bản đồ đã tải xong không còn làm hiện "Không tải được bản đồ", và không khóa nút "Dùng tọa độ này".
- **Chỉ số nước**:
  - Bấm "Xem thêm" thì các số đo đã tải vẫn giữ nguyên. Trước đây cả danh sách biến thành khung chờ.
  - Chọn vùng ở "Các vùng nuôi" thì màn cuộn tới danh sách của vùng đó, và vùng đó có nhãn "Đang xem".
  - Bộ lọc ngày có nút "Quay lại" giữ nguyên khoảng ngày đang lọc.
  - Đường và dải ngưỡng của biểu đồ đọc được ở chế độ tối.
- **Sheet kéo khung trên ảnh và sheet chọn vị trí trên bản đồ**: ảnh và bản đồ nuốt thao tác vuốt, nên trên máy thấp nút
  nằm ngoài màn hình mà không vuốt tới được. Giờ ảnh và bản đồ được giữ thấp, nút dính ở đáy sheet, và có nút "Hủy".
- **Form sửa vùng, bè, giấy tờ**: tải dữ liệu lỗi thì hiện khối lỗi kèm "Thử lại", không còn để lại một form chết.
- **Ranh giới vùng**: mỗi khu là một thẻ riêng, nút "Bỏ khu này" không còn dính vào khu sau. Ví dụ định dạng tọa độ chuyển
  xuống dòng gợi ý dưới ô nhập, vì chữ mờ trong ô bị cắt.
- **Chu kỳ, thả giống, nhật ký nuôi**: chân trang dính chỉ giữ nút lưu. "Xóa…" và "Không, quay lại" chuyển xuống cuối trang,
  để bàn phím mở ra vẫn thấy ô đang gõ.
- **Truy vết lô**: khóa React không còn trùng khi một phiên thả giống phủ nhiều luống, hoặc khi có nhiều lần "Sửa dữ liệu".
- **Sửa phiếu nhập nháp**: ô "Ngày nhập" hiện ngày hôm nay thay cho ngày của phiếu, vì DatePicker của ZaUI chỉ chép giá trị
  lúc dựng mà form lại gán ngày sau khi đã hiện. Giờ form lấy giá trị phiếu nháp ngay lúc khởi tạo. Phiếu nháp có nhà cung
  cấp hoặc vật tư đã ngừng dùng thì ô chọn hiện "<tên> (ngừng dùng)" thay vì để trống.
- **Lập phiếu xuất dùng**:
  - Quyền về sau danh sách vùng thì màn không còn kẹt ở "Bạn chưa được lập phiếu…".
  - Select của ZaUI coi `""` là chưa chọn, nên "Chưa gắn lô" và "Chưa chọn" dùng một giá trị riêng.
  - Đổi vùng thì ô chọn bè được dựng lại.
  - Tải lô giống lỗi thì có nút "Tải lại lô giống".
- **Cân lồng và so sánh số cân**: bảng HTX/thương lái bị cắt cột thương lái ở khổ 320px. Giờ cột dùng `minmax(0, 1fr)`, đơn
  vị "kg" đưa lên đầu cột, và tổng hai bên xuống thành dòng riêng. Trạng thái lô hiện tiếng Việt (trước là "Open", "Closed").
- **Hóa đơn, thanh toán**:
  - Lỗi "Kết thúc bán" hiện ngay trong sheet.
  - Mã QR vẽ không được thì hiện cách chép thông tin chuyển khoản và nút "Vẽ lại mã QR". Trước đây khung chờ quay mãi.
  - Mở một hóa đơn thì dòng đó báo "Đang mở…".
- **Tổng tiền dạng hai cột** (phiếu nhập, công nợ, trả tiền nhà cung cấp, chi phí bè): số không bị bẻ giữa chữ số. Khi hai số
  không vừa một hàng thì mỗi ô chiếm một hàng.

## 4. Lỗi gặp khi dựng môi trường soát

| Lệnh, hiện tượng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| `npx vite` từ worktree: `Failed to resolve import "@/assets/styles/tailwind.scss"` | Alias `@` → `"/src"` được hiểu tương đối với `root: ./src`, thành `src/src`. `zmp start` tự xử lý, còn vite trần thì không. | Dùng file cấu hình tạm ngoài repo, với alias tuyệt đối. |
| Đăng nhập demo báo "Mất kết nối" | `$env:VITE_API_BASE_URL = ""` trong PowerShell 5.1 xóa biến thay vì gán chuỗi rỗng, nên `.env` cũ (tunnel đã chết) được dùng. | Dùng thư mục env riêng có `VITE_API_BASE_URL=` rỗng. |
| Màn ranh giới vùng, bản đồ: `Invalid hook call`, sau đó cả app trắng | Vite gặp thư viện mới (vietmap, tesseract.js, qrcode) lúc chạy nên đóng gói lại và tải lại, hai bản React lẫn vào nhau. Đây không phải lỗi của app. | Tải lại trang sau khi Vite báo "optimized dependencies changed"; script soát tự đăng nhập lại khi gặp trang trắng. |
| Script trả về rỗng khi lọc `'^/account$'` | Git Bash đổi đối số bắt đầu bằng `/` thành đường dẫn Windows. | Thêm `MSYS_NO_PATHCONV=1`. |

App chưa có error boundary, nên một lỗi render ở bất kỳ màn nào cũng làm trắng cả app. Đợt này chưa thêm error boundary vì
cần thống nhất màn lỗi hiện gì. Mục này nên làm tiếp.

## 5. Kiểm tra

- `npm run lint`, `npm run typecheck` và `npm run build` đạt. Bản build nặng 3,2 MB, không file nào quá 2 MB.
- Chạy lại script soát trên Chrome sau khi sửa: 102 màn của Chủ HTX ở 360px và ở 320px với "Chữ rất lớn", cùng 10 màn của
  thương lái. Không còn màn nào tràn ngang, có nút bị che, có thẻ dính nhau hay có số bị bẻ giữa chữ số.
  - Từ bị bẻ chỉ còn ở chuỗi dài hơn một dòng: email, đường link truy xuất, tên đăng nhập "nhanvien.chuaxacthuc".
  - Ở khổ 320px, hai nhãn bè trên bản đồ chạm nhau 5px, nhưng cả hai vẫn bấm được.
  - Bộ đếm ký tự của ô nhập nhiều dòng (ZaUI) nằm trong lề dưới của ô.
- Lỗi console còn lại không phải của màn: `GET /api/me/test-role` 404 là bộ thử vai trò chỉ có ở bản dev, và cảnh báo
  `defaultProps` đến từ Picker của ZaUI.
- Thử ghép với các PR đang mở (#16, #17, #18) bằng `git merge-tree`: không xung đột.
- Chưa thử trong Zalo trên điện thoại thật.

## 6. Câu hỏi bảo vệ

- **Vì sao không giữ `overflow-wrap: anywhere` cho số tiền?** `anywhere` cho phép bẻ ở bất kỳ ký tự nào và còn làm giảm
  kích thước tối thiểu của ô, nên cột số co lại rồi bẻ giữa chữ số. Người lớn tuổi đọc "12.500.00 / 0 đ" thành hai số. Cho
  cả con số xuống dòng dưới thì đọc đúng mà vẫn không tràn.
- **Vì sao danh sách trong sheet bị ép mỏng mà thẻ thông tin thì không?** Trong cột flex, kích thước tối thiểu tự động của
  một khối là kích thước nội dung, trừ khi khối đó có `overflow` khác `visible`. `.rows` có `overflow: hidden` để bo góc, nên
  co được về 0.
- **Vì sao quy tắc khoảng cách giữa các thẻ dùng `:where`?** Để độ ưu tiên bằng 0. Mọi quy tắc lề đã có (ví dụ
  `.weighing-lot`) vẫn thắng, nên không đổi bố cục những chỗ đang đúng.
