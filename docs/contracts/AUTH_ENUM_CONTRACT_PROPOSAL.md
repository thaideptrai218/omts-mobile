# OMTS — đề xuất contract enum cho Mobile authentication

> Ngày soạn: 22/10/2026
> Người nhận: BA, Backend và Mobile frontend
> Trạng thái: **đề xuất chờ Backend xác nhận; chưa phải contract đã triển khai**
> Backend được đối chiếu: `thaideptrai218/omts-backend` tại commit `14d7839`

## 1. Vấn đề cần giải quyết

Backend hiện nhận `clientType` và trả một số enum dưới dạng số nguyên vì serializer chưa cấu hình enum dạng chuỗi. Ví dụ request đăng nhập Mobile hiện chỉ có thể biểu diễn như sau:

```json
{
  "identifier": "nguyenvanan.4821",
  "password": "<secret>",
  "clientType": 1,
  "deviceName": "OMTS Mobile - Android"
}
```

Trong source hiện tại, `0 = Web` và `1 = Mobile`. Tuy nhiên, con số này phản ánh **thứ tự nội bộ của enum C#**, không phải một contract công khai đã được cam kết. Có ba rủi ro thực tế:

1. Nếu Mobile bỏ `clientType`, model binding dùng giá trị mặc định `0`, nên backend tạo nhầm phiên Web và áp dụng sai thời hạn phiên.
2. Nếu Mobile hard-code `1`, ứng dụng phụ thuộc vào thứ tự enum trong source backend. Một lần sắp xếp/chèn enum có thể đổi nghĩa của request mà TypeScript không phát hiện.
3. Log, OpenAPI và việc debug khó hiểu hơn vì người đọc phải nhớ `1` có nghĩa gì ở từng enum.

## 2. Contract đề xuất

### 2.1 Request đăng nhập

Mobile gửi tên enum ổn định:

```json
{
  "identifier": "nguyenvanan.4821",
  "password": "<secret>",
  "clientType": "Mobile",
  "deviceName": "OMTS Mobile - Android"
}
```

Quy ước đề xuất:

| Trường | Kiểu công khai | Giá trị cho Mobile | Bắt buộc | Ghi chú |
|---|---|---|---|---|
| `clientType` | string enum | `"Mobile"` | Có | Không được ngầm mặc định thành Web khi client gửi thiếu/sai |
| `deviceName` | string | `"OMTS Mobile - Android"` hoặc `"OMTS Mobile - iOS"` | Không | Chỉ là nhãn dễ hiểu; không phải định danh bảo mật |

Backend nên trả lỗi validation có mã ổn định khi `clientType` thiếu hoặc không hỗ trợ. Không nên âm thầm tạo phiên Web vì client không thể nhận biết sai lệch này từ response.

### 2.2 Response đăng nhập và quyền

Các enum đi qua API công khai nên đồng nhất dưới dạng chuỗi:

```json
{
  "subjectType": "Staff"
}
```

```json
{
  "dataScope": "AssignedZones"
}
```

Tên `"AssignedZones"` phía trên chỉ minh họa hình dạng contract. Backend phải xác nhận đúng danh sách giá trị domain trước khi Mobile tạo union type. Mobile không được tự đặt tên enum dựa trên số hiện tại.

## 3. Cách backend có thể triển khai an toàn

Không khuyến nghị bật `JsonStringEnumConverter` toàn cục rồi merge ngay mà không kiểm tra, vì thao tác đó có thể đổi JSON của tất cả endpoint đang dùng enum và làm hỏng Web hoặc client khác.

Phương án ưu tiên:

1. Định nghĩa DTO công khai cho auth/permission với trường enum có wire contract rõ ràng.
2. Parse `"Mobile"` theo kiểu không phân biệt hoa thường nếu nhóm muốn thân thiện với client, nhưng response luôn trả một dạng chính tắc là `"Mobile"`.
3. Từ chối giá trị không biết bằng HTTP 400 và mã lỗi ổn định; không fallback sang Web.
4. Thêm OpenAPI examples và integration tests cho request/response Mobile.
5. Nếu cần tương thích tạm thời, backend có thể nhận cả số cũ và chuỗi trong một giai đoạn ngắn, nhưng response mới chỉ trả chuỗi. Thời điểm bỏ số cũ phải được ghi rõ.

Phương án tối thiểu chấp nhận được nếu Backend chưa đổi sang chuỗi là công bố enum số như một API contract có version và test khóa giá trị. Đây chỉ là phương án dự phòng vì vẫn khó đọc và dễ dùng sai hơn chuỗi.

## 4. Quy tắc `deviceName`

`deviceName` phục vụ màn hình quản lý phiên và hỗ trợ người dùng nhận ra thiết bị. Nó **không được dùng** để xác thực, chống trùng thiết bị hoặc làm khóa database duy nhất.

Nhãn Mobile giai đoạn foundation nên chỉ gồm tên ứng dụng và hệ điều hành:

- `OMTS Mobile - Android`
- `OMTS Mobile - iOS`

Không tự động đưa họ tên, username, số điện thoại, email hoặc device identifier vào nhãn. Nếu sau này cần model thiết bị, nhóm phải đánh giá quyền riêng tư, độ ổn định của API thiết bị và hành vi khi người dùng từ chối quyền.

## 5. Ranh giới trách nhiệm phía Mobile

Sau khi contract được Backend xác nhận, Mobile sẽ đặt chi tiết wire format trong API adapter:

```text
Login form
  -> LoginCredentials (domain)
  -> Auth API adapter
  -> LoginRequestDto { clientType: "Mobile", ... }
  -> HTTP
```

Component và session state không được so sánh `subjectType === 2` hoặc tự tạo `clientType: 1`. Nếu Backend buộc giữ số trong giai đoạn chuyển tiếp, chỉ adapter được phép map số đó và mapping phải có test.

## 6. Tiêu chí Backend xác nhận M1.2

M1.2 chỉ được đánh dấu hoàn tất sau khi có đủ bằng chứng sau:

- Backend xác nhận wire value của `clientType` và enum response.
- OpenAPI hoặc DTO source phản ánh đúng contract đã xác nhận.
- QA URL và một tài khoản test hợp lệ được cung cấp.
- Đăng nhập thật từ Mobile tạo phiên có `ClientType.Mobile`.
- Phiên nhận đúng policy Mobile hiện hành; không dùng thời hạn Web.
- Request thiếu/sai `clientType` không âm thầm tạo phiên Web.

## 7. Câu hỏi cần BA/Backend trả lời

1. Backend đồng ý dùng string enum `"Mobile"` cho API công khai không?
2. Backend sẽ áp dụng DTO cục bộ hay converter toàn cục? Nếu toàn cục, endpoint nào bị thay đổi và kế hoạch tương thích Web là gì?
3. Danh sách string chính thức cho `SubjectType` và `DataScope` là gì?
4. Request thiếu `clientType` sẽ bị từ chối hay còn hỗ trợ default `Web` cho client cũ?
5. QA dùng endpoint/base URL nào và kiểm tra loại phiên Mobile ở đâu?

Cho đến khi các câu hỏi trên được trả lời, Mobile có thể tiếp tục UI foundation không phụ thuộc auth contract nhưng **chưa triển khai request đăng nhập production**.
