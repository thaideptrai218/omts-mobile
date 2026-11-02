# Chức năng của Chủ HTX trên Mini App

Cập nhật 31/10/2026, đối chiếu với OMTS.Api đang phát triển (các controller có trong `src/OMTS.Api/Controllers`).

Chủ HTX (`isCooperativeOwner`) thấy Tổng quan riêng (`src/features/dashboard/components/owner-dashboard.tsx`): việc cần xử lý và số liệu
lấy từ API thật (`src/features/dashboard/api/owner-summary.ts`), chức năng chia nhóm (`ROLES.owner.actionGroups`). Nhóm cuối
"Chưa có trên hệ thống" mở trang giải thích (`src/features/dashboard/pages/unavailable-page.tsx`).

Mỗi màn quản lý là một file tải riêng khi mở (`lazyPage` trong `src/shared/routing/lazy-page.tsx`), nên gói ban đầu
không lớn thêm theo số màn. Bản build 28/10: cả app 1,2 MB, file lớn nhất 546 KB (thư viện ZaUI + React), mỗi màn 2–7 KB.

## 1. Đã có trên mobile (nối API thật)

| Nhóm | Màn | Đường dẫn | API |
|---|---|---|---|
| Bán hàng | Yêu cầu mua: xem, chấp nhận số lồng và ngày nhận, hoặc từ chối có lý do | `/manage/purchase-requests` | `api/purchase-requests` |
| | Sản phẩm bán: thêm, sửa, ngừng bán/dùng lại | `/manage/sales-products` | `api/sales-products` |
| Vùng nuôi | Danh sách vùng (tìm, lọc trạng thái, tình trạng giấy tờ) | `/manage/zones` | `GET api/zones` |
| | Chi tiết vùng: thông tin, giấy tờ, ngưỡng nước, bè; sửa; ngừng dùng/dùng lại | `/manage/zones/:id` | `GET/PUT api/zones/{id}`, `…/discontinue`, `…/reactivate`, `GET api/zones/{id}/licenses`, `GET/PUT api/zones/{id}/water-thresholds`, `GET api/zones/{id}/rafts` |
| | Thêm/sửa vùng | `/manage/zones/new`, `/manage/zones/:id/edit` | `POST api/zones`, `PUT api/zones/{id}` |
| | Chi tiết bè: các hàng, lịch sử bố trí, chi phí vật tư; ngừng dùng/dùng lại | `/manage/rafts/:raftId` | `GET api/rafts/{id}`, `…/discontinue`, `…/reactivate` |
| | Thêm bè (số hàng, chiều dài), sửa thông tin bè | `/manage/zones/:id/rafts/new`, `/manage/rafts/:raftId/edit` | `POST api/zones/{id}/rafts`, `PUT api/rafts/{id}` |
| | Xem giấy tờ pháp lý | `/manage/licenses/:id` | `GET api/zone-licenses/{id}` |
| Chỉ số nước | Số đo theo vùng, lọc trạng thái, cảnh báo vượt ngưỡng; nhập tay (nháp hoặc xác nhận ngay) | `/manage/water?zone=` | `GET/POST api/zones/{id}/water-measurements` |
| | Chi tiết số đo: xác nhận bản nháp, sửa số đo (có lý do, báo người khác đang sửa), hủy, các phiên bản | `/manage/water/:id` | `GET api/water-measurements/{id}`, `…/confirm`, `…/corrections`, `…/void`, `…/editing` |
| Mua hàng | Nhà cung cấp: danh sách, chi tiết, thêm/sửa, ngừng dùng/dùng lại | `/manage/suppliers…` | `api/suppliers` |
| | Công nợ nhà cung cấp | `/manage/supplier-debts` | `GET api/suppliers/debts` |
| | Phiếu nhập: danh sách có tổng tiền, chi tiết, lập/sửa nháp, hoàn tất, hủy, ghi trả tiền | `/manage/purchases…` | `api/purchase-receipts`, `POST api/supplier-payments` |
| | Các lần trả tiền nhà cung cấp | `/manage/supplier-payments` | `GET api/supplier-payments` |
| | Danh mục vật tư: thêm, sửa, ngừng dùng/dùng lại | `/manage/input-items` | `api/farming-input-items` |
| | Chi phí vật tư theo bè | `/manage/raft-costs` | `GET api/purchase-receipts/raft-material-costs` |
| Tổ chức | Nhân viên: danh sách, chi tiết, thêm/sửa, cho nghỉ/làm lại | `/manage/employees…` | `api/employees` |
| | Tài khoản: danh sách, chi tiết, khóa/mở khóa, cấp/thu hồi vai trò theo vùng | `/manage/accounts…` | `api/accounts`, `api/accounts/{id}/grants` |
| | Vai trò: danh sách, xem quyền và ảnh hưởng, ngừng dùng/dùng lại | `/manage/roles…` | `api/roles`, `api/permission-functions` |
| | Hồ sơ HTX: xem, sửa | `/manage/cooperative` | `GET/PUT api/cooperative/profile` |
| | Duyệt thương lái | `/account/trader-requests` | `api/trader-requests` |

## 2. Backend đã có API nhưng để bản web (không làm trên mobile)

| Chức năng | Lý do |
|---|---|
| Đọc số đo nước từ ảnh máy đo (OCR: `…/water-measurements/recognize`, `…/with-photo`) | Cần gửi ảnh dạng multipart; `shared/api/http.ts` chưa hỗ trợ. Nên làm tiếp trên mobile vì đo nước là việc ngoài hiện trường. |
| Ảnh bè, ảnh hóa đơn phiếu nhập, chứng nhận nhà cung cấp, logo HTX, thêm/sửa/thay giấy tờ vùng | Cùng lý do tải tệp multipart. |
| Biểu đồ và xuất Excel chỉ số nước, xuất Excel phiếu nhập | Biểu đồ cần thư viện vẽ; xuất Excel để backend sinh tệp, xem trên web. |
| Đổi bố trí hàng của bè, sơ đồ bè, tình trạng từng hàng (`api/rafts/{id}/condition`) | Cần vẽ sơ đồ, màn nhỏ khó thao tác. |
| Trả hàng nhà cung cấp, sao chép phiếu, gắn tiền trả trước vào phiếu (`…/returns`, `…/copy`, `supplier-payments/{id}/allocate`) | Nghiệp vụ kế toán ít dùng ngoài hiện trường. |
| Ngưỡng nước chung toàn HTX (`PUT api/water-thresholds`) | Mobile sửa ngưỡng từng vùng; ngưỡng chung làm trên web. |
| Tạo tài khoản nhân viên, đặt lại mật khẩu, xem trước quyền (`POST api/accounts`, `…/reset-password`, `…/permission-preview`), gỡ tài khoản khỏi hồ sơ nhân viên | Mobile không có mật khẩu; tạo tài khoản cần cấp mật khẩu tạm cho bản web. |
| Tạo, sửa, sao chép vai trò | Bảng quyền nhiều cột, cần màn rộng. |

## 3. Chưa có trên hệ thống (backend chưa có API)

Domain đã có bảng nhưng OMTS.Api chưa có controller, nên mobile chỉ hiện trang giải thích:

| Chức năng (FeatureKey) | Ghi chú |
|---|---|
| Chu kỳ nuôi, thả giống, nhật ký nuôi (`cycles`, `seeding`, `cultivationLog`) | Entity `CultivationCycle`, `SeedingEvent`, `CultivationLogEntry` |
| Thu hoạch, lô truy xuất (`harvest`, tra cứu `trace` vẫn dùng dữ liệu mẫu) | `HarvestEvent`, `TracePublication` |
| Hóa đơn, cân tại cảng, công nợ thương lái, phiếu thu, đối soát, hoàn tiền (`portWeighing`, `receivables`, `receipts`, `reconcile`, `refunds`) | Yêu cầu mua theo lồng đã có; chưa nối sang `SalesOrder`, hóa đơn hay cân thực nhận |
| Khiếu nại chất lượng, trả hàng của thương lái (`claims`) | `QualityClaim`, `PhysicalReturn` |
| Lương nhân công (`payroll`) | Phân công, chấm công và nghỉ phép cơ bản đã có API; chưa có đủ luồng tính/chốt lương |
| Báo cáo sản lượng, doanh thu (`reports`) | |
| Nhật ký hệ thống (`auditLog`) | Backend ghi audit nhưng chưa có API đọc |
| Gửi thông báo cho nhân viên, thương lái (`broadcast`) | |

Vì vậy Tổng quan của Chủ HTX chưa có sản lượng, doanh thu, công nợ thương lái; khi các API trên có, thêm vào
`features/dashboard/api/owner-summary.ts`.

## 4. Dữ liệu demo bổ sung (28/10/2026)

Thêm qua API bằng tài khoản Chủ HTX (script ngoài repo), không sửa mã seed của backend:
vùng `DEMO-04` "Vùng nuôi Bản Sen" có 6 bè, ngưỡng nước riêng và 12 ngày số đo (số đo hôm nay vượt ngưỡng độ mặn để
có cảnh báo); một số đo nháp ở `DEMO-02`; 2 nhà cung cấp; 2 phiếu nhập cho Bản Sen (1 nháp, 1 hoàn tất còn nợ);
2 nhân viên; 2 yêu cầu tài khoản thương lái đang chờ duyệt (thêm thẳng vào bảng `Accounts` vì luồng thật cần Zalo).
