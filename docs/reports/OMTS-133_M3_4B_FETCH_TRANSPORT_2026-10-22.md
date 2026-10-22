# OMTS-133 — M3.4b unauthenticated fetch transport

## Kết quả

Đã thêm `ApiTransport`, một boundary HTTP chưa gắn auth. Transport ghép base URL với relative path, gửi JSON, xử lý 204/body rỗng, parse JSON success, chuyển HTTP failure qua `ApiProblem`, và chuẩn hóa network/timeout/cancelled/invalid-response failure.

Transport trả success data là `unknown`. Endpoint adapter ở bước sau phải validate/map DTO trước khi feature sử dụng. Không có token, refresh, cookie hoặc session logic trong lớp này.

## URL và request safety

- Base URL đi qua cùng parser với runtime config.
- Path phải là relative path như `api/auth/login`.
- Path bắt đầu bằng `/`, chứa `..`, backslash hoặc đổi origin bị từ chối trước fetch.
- GET có JSON body bị từ chối vì hành vi qua HTTP stack/proxy không ổn định.
- Content-Type JSON chỉ được tự thêm khi có body và caller chưa cung cấp header tương đương.

## Timeout và cancellation

Mỗi request có internal AbortController. Timer abort request khi quá hạn; external signal của caller cũng được forward. Cùng là abort nhưng kết quả vẫn tách `timeout` và `cancelled`, vì timeout là lỗi chờ network còn caller cancellation thường là người dùng rời màn hoặc service chủ động dừng.

Default 15 giây là technical default có thể override theo request/constructor; đây không phải policy backend hoặc token lifetime.

## Response policy

- 204 hoặc body rỗng thành success `data: null`.
- JSON hợp lệ thành `unknown` data.
- success body không phải JSON thành `invalidResponse`.
- error body JSON hoặc text đều qua safe problem parser.
- exception không được đưa nguyên văn vào display message.

## Test

11 test riêng bao phủ JSON request/success, no-content, coded HTTP problem, malformed success, network rejection, timeout, caller cancellation, unsafe paths và GET body. Typecheck, lint và diff-check đều pass sau thay đổi.

## Defense Q&A

**Vì sao không dùng Axios?**

React Native đã có Fetch API. Boundary nhỏ này đủ cho nhu cầu hiện tại, giảm dependency và vẫn cho phép inject fetch khi test. Nếu sau này đổi thư viện, feature adapter không cần đổi vì chỉ phụ thuộc contract transport.

**Vì sao transport không tự refresh khi gặp 401?**

Refresh là orchestration của session và phải single-flight theo contract rotation. Trộn vào transport cơ bản trước khi session design được duyệt sẽ tạo dependency vòng và quyết định bảo mật ngầm.
