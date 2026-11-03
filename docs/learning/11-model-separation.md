# Tách model và DTO frontend — 31/10/2026

## Yêu cầu

Sau khi chia lại folder, model vẫn nằm lẫn trong service. Người dùng yêu cầu tách hết. Phạm vi gồm model nghiệp vụ, DTO request/response, bộ lọc, dữ liệu form và các kiểu dùng chung đang khai báo trong service, state, constants hoặc utility.

Tách 138 khai báo có tên và 25 kiểu object viết trực tiếp trong hàm. Gộp hai khai báo Tone có cùng định nghĩa, kết quả là 162 kiểu trong 46 file model. Tên trường, kiểu nullable/optional, giá trị trạng thái và dữ liệu API giữ nguyên.

## Cách chia

Model của feature ở `features/<tên>/models/`, nhóm theo đối tượng. Ví dụ:

| Nghiệp vụ | Model |
|---|---|
| Vùng và bè | `farming/models/Zone.ts`, `Raft.ts`, `ZoneLicense.ts`, `WaterMeasurement.ts` |
| Yêu cầu mua | `sales/models/SalesProduct.ts`, `PurchaseRequest.ts` |
| Nhân sự và phân quyền | `organization/models/Employee.ts`, `Account.ts`, `Role.ts`, `Cooperative.ts` |
| Mua vật tư | `purchasing/models/Supplier.ts`, `PurchaseReceipt.ts`, `SupplierPayment.ts` |
| Phân công và chấm công | `workforce/models/WorkAssignment.ts`, `Attendance.ts`, `LeaveRequest.ts` |
| Phiên và quyền | `auth/models/Session.ts`, `Permissions.ts`, `LinkAccount.ts` |
| Hồ sơ và thông báo | `account/models/Profile.ts`, `notifications/models/Notification.ts`, `NotificationPreferences.ts` |

Kiểu dùng chung ở `src/models/`: HTTP, lỗi API, phân trang, tọa độ, điều hướng, giao diện, tùy chọn cỡ chữ và adapter Zalo. Props và trạng thái hoạt ảnh chỉ dùng trong một component giữ cạnh component đó.

## Luồng phụ thuộc

Màn hình import kiểu từ model và gọi hàm từ service. Service import type từ model rồi gọi HTTP hoặc SDK. Model chỉ khai báo kiểu, không chứa API, atom, dữ liệu mẫu hay logic chạy.

```ts
import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { getPurchaseRequest } from "@/features/sales/services/salesService";
```

`import type` được bỏ khi build JavaScript. Nó mô tả hình dạng dữ liệu và giúp TypeScript kiểm tra; không tạo thêm đối tượng, không lưu DB và không xác thực JSON ở runtime.

File `services/accountContracts.ts` được chia về model của auth/account/notifications/organization; `Paged` chuyển sang `models/Pagination.ts`. Consumer import thẳng từ model, service không re-export các kiểu cũ. Atom thông báo ở `notifications/state/inboxAtoms.ts`; lô truy xuất mẫu ở `traceability/data/sampleLot.ts`.

## Kiểm chứng

- `npm run typecheck`, `npm run lint`, `npm run build`: đạt.
- So sánh JavaScript phát sinh của 141 module trước/sau: phần xử lý giống nhau; chỉ chuẩn hóa tên module cho hai file state/dữ liệu được chuyển vị trí và dấu phẩy cuối trong import để đối chiếu.
- Đối chiếu AST của 162 định nghĩa model với khai báo gốc: giữ nguyên hình dạng dữ liệu. Kiểu cảnh báo nước dùng `ZoneListItem` thay cho tham chiếu cục bộ `(typeof items)[number]`, vốn được suy ra từ danh sách `ZoneListItem`.
- Toàn bộ 25 service không còn type alias, interface hoặc object type trực tiếp. Mỗi model chỉ có khai báo kiểu và import type.
- 48 đường dẫn màn hình giữ nguyên. Hash `.env` và `.env.example` trước/sau giống nhau.
- Không đổi API/backend, DB, cơ chế phiên hay dependencies. Không chạy Device hoặc khởi động lại backend/tunnel.

ESLint chặn định nghĩa model trong service, import service/màn hình/hook từ model và khai báo mã chạy trong model. Quy tắc này giúp file mới tiếp tục đúng cấu trúc.

## Lỗi gặp trong bộ đối chiếu

Lệnh `node %TEMP%/omts-verify-models.cjs` ban đầu báo JavaScript khác vì printer giữ dấu phẩy cuối của import cũ. Chuẩn hóa AST của danh sách import rồi đối chiếu lại, không sửa mã ứng dụng vì khác biệt này.

Bản kiểm tra định nghĩa model đầu tiên gộp mọi khoảng trắng trong chuỗi kỳ vọng; comment một dòng làm phần khai báo phía sau bị đọc thành comment, gây TypeError khi lấy node. Đổi sang đọc AST trực tiếp từ bản chụp source gốc, bỏ comment khi in để so sánh. Sau sửa, toàn bộ định nghĩa và JavaScript đều khớp.

## Câu hỏi bảo vệ

- Vì sao frontend dùng type/interface? Các đối tượng nhận từ JSON cần một hợp đồng kiểu để UI và service thống nhất trường dữ liệu; không cần thêm entity class chỉ để sao chép dữ liệu.
- Model có kiểm tra JSON trả về không? TypeScript kiểm tra khi phát triển/build. Runtime validation là bước riêng, không được thêm ngầm trong lần tách file.
- Vì sao không import type qua service? Model là nguồn định nghĩa dữ liệu; import trực tiếp tách phụ thuộc dữ liệu khỏi nơi thực hiện HTTP và tránh hai chỗ export cùng một hợp đồng.

Xem [cấu trúc hiện hành](../PROJECT_STRUCTURE.md) để thêm file mới.
