# Thực hiện kế hoạch thu hoạch trên điện thoại (26/11/2026)

## 1. Vấn đề

Người dùng báo hai lỗi trên mobile:

1. "Gửi lời mời ca thì nhân viên như tự đồng ý."
2. "Nhận đơn xong, tạo kế hoạch thu hoạch rồi không biết khi nào thu xong để tạo phiếu cân gắn với lần thu đó."

### Lỗi 1 không nằm ở code `develop`

Dựng lại luồng với backend `develop` (#142) và mobile `develop`: lập kế hoạch ngày làm cho đơn, rồi mời hai nhân viên.

- Cả hai lời mời đều có `approved: null`.
- Đơn chuyển "Chờ xác nhận nhân lực", mới 0/1 người đồng ý.
- Nút "Chấp nhận đơn" bị khóa.

Hiện tượng "tự đồng ý" đúng với backend #128 (merge tối 24/11): bản đó "phân công tức thì", tạo lời mời với `Approved = true`.
#141 (25/11) đưa lại bước nhân viên đồng ý. Vậy server bị báo lỗi đang chạy bản giữa hai mốc này, cần deploy lại từ `develop`.

Thêm nữa, nhân viên chỉ trả lời được lời mời ở màn "Ca được mời" (PR #17), mà PR này chưa merge. Thiếu màn đó thì
không ai đồng ý được, và Chủ HTX không bao giờ nhận được đơn.

### Lỗi 2 là thiếu màn

Mobile chưa có màn kế hoạch thu hoạch (KHT) nào, nên sau khi nhận đơn không thấy bè nào đã thu, và "Cân tại cảng" không có
lô để cân.

## 2. Luồng của backend

1. Thương lái gửi yêu cầu mua. Backend tạo ngay đơn hàng nháp (DH) cho yêu cầu đó.
2. Chủ HTX nhận đơn khi đủ nhân viên đồng ý ca.
3. Chủ HTX lập KHT từ đơn trên web, gồm các dòng, mỗi dòng là một bè với các luống, rồi giao cho Quản lý vùng hoặc tự thu.
4. Người thực hiện ghi nhận thu từng dòng. Mỗi lần ghi gọi `POST api/rafts/{raftId}/harvest-lots` có `harvestPlanLineId`, và
   một dòng ra một lô. Lô mới ở trạng thái "Chờ cân" (2904).
5. Lô được cân từng lồng rồi bấm "Hoàn tất". Thương lái đồng ý số cân. Sau đó mới lập hóa đơn.
6. Mọi dòng có lô hoặc đã bỏ hết luống thì Quản lý vùng bàn giao, rồi Chủ HTX hoàn thành KHT. Hệ thống không tự hoàn thành.

"Phiếu cân gắn với lần thu" chính là lô của dòng KHT: ghi nhận thu xong là có lô để cân.

## 3. Phạm vi đã chốt (26/11/2026)

- **Mobile làm phần thực hiện.** Lập và giao KHT vẫn làm trên web.
- **Gọi nhân viên chỉ bằng lời mời ca của đơn.** Danh sách người thu của KHT (#142) vẫn làm trên web.

## 4. Trong code

- `features/farming/models/HarvestPlan.ts`, `services/harvestPlanService.ts`, `utils/harvestPlanText.ts`: hợp đồng của
  `api/harvest-plans` và trạng thái tiếng Việt theo `statusId`.
- **`/manage/harvest-plans`:** kế hoạch đang thực hiện, lấy từ `GET api/harvest-plans/assigned`. Chủ HTX thấy thêm kế hoạch
  đã bàn giao chờ hoàn thành.
- **`/manage/harvest-plans/:id`:** tiến độ và từng bè.
  - Bè chờ thu có nút "Ghi nhận thu hoạch", "Không thu một số luống" và "Thu lại các luống đã bỏ".
  - Bè đã thu hiện lô và nút "Cân lô này".
  - Nút Nhận, Bàn giao, Hoàn thành chỉ hiện theo `allowedActions` của backend.
- **`/manage/harvest-plans/:id/lines/:lineId`:** form ghi nhận thu.
  - Số lồng là bắt buộc. Kg ước tính, người thu và ảnh (0 đến 3) thì không.
  - Người được phân công ở bè hôm nay được chọn sẵn.
  - Lưu xong có nút "Cân lô này ngay" sang phiếu cân.
- **Màn yêu cầu mua đã nhận:** có mục "Kế hoạch thu hoạch" của đơn, lấy từ `GET api/harvest-plans?salesOrderId=`.
- **Danh mục và thông báo:**
  - Chức năng `harvestPlans` (quyền `HARVEST_PLANS`) nằm trong nhóm "Bán hàng" của Chủ HTX và trong danh sách của Quản lý vùng.
  - Ba loại thông báo `HARVEST_PLAN_*` mở thẳng kế hoạch.
  - Thêm chữ cho `MSG-PLAN-01`, `-02`, `-03`.
- Phiếu cân hiện "Chờ cân" cho lô 2904; trước đây hiện "Trạng thái khác".

## 5. Lỗi gặp khi làm

| Hiện tượng | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| Bấm "Ghi luống không thu" xong màn trắng: `Cannot read properties of undefined (reading 'statusId')` | `skip-lanes` và `unskip-lanes` trả thẳng kế hoạch (`HarvestPlanView`), không bọc trong `{ plan, message }` như nhận, bàn giao và hoàn thành | Kiểu trả về của hai service là `HarvestPlan` |
| Tạo KHT thử: 409 `MSG-PLAN-07` | KHT phải gắn ít nhất một đơn; đơn của dữ liệu demo đều đã xong | Cho thương lái demo đặt đơn mới, backend tạo đơn hàng nháp |

## 6. Kiểm tra

- `npm run lint`, `npm run typecheck` và `npm run build` đạt.
- Chạy trong Chrome không giao diện với backend `develop` và dữ liệu demo:
  1. Quản lý vùng nhận `KHT000002`.
  2. Ghi nhận thu bè B1-01 (3 lồng) thành lô `DEMO-01-B1-01-20261126-4`, mở phiếu cân: lô "Chờ cân".
  3. Bè B1-03 báo không thu hai luống kèm lý do. Kế hoạch lên 2/2 bè xong, rồi bàn giao.
  4. Chủ HTX thấy kế hoạch trong mục "Đã bàn giao, chờ hoàn thành" và bấm hoàn thành.
  5. Yêu cầu mua của đơn đó, sau khi nhân viên đồng ý và Chủ HTX nhận, hiện KHT ở trạng thái "Hoàn thành".
- Chưa thử trong Zalo trên điện thoại.

## 7. Câu hỏi bảo vệ

- **Vì sao không cho lập KHT trên điện thoại?** Lập KHT cần chọn bè và luống của nhiều vùng cùng số lồng theo đơn, nên làm
  trên màn lớn tiện hơn. Người ra bè chỉ cần nhận, ghi thu và bàn giao. Phạm vi này đã chốt với chủ dự án.
- **Lô và phiếu cân liên quan thế nào?** Không có phiếu cân riêng (chốt 17/11/2026): lô thu hoạch được cân từng lồng. Vì vậy
  ghi nhận thu một dòng KHT là tạo ra thứ cần cân.
- **Vì sao nút trên màn đi theo `allowedActions` mà không tự tính từ trạng thái?** Quy tắc chuyển trạng thái nằm ở
  `HarvestPlanRules` của backend: ai thu, trạng thái hiện tại, mọi dòng đã xong chưa. Mobile chỉ hiện đúng những gì server
  cho phép, nên không lệch quy tắc.
