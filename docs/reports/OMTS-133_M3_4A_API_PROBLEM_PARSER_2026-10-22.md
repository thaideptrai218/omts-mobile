# OMTS-133 — M3.4a API problem parser

## Kết quả

Đã thêm parser biến HTTP status và payload `unknown` thành `ApiProblem`. Parser nhận ba vị trí code đang có thể xuất hiện trong ASP.NET ProblemDetails: `code` ở top-level, `extensions.code`, rồi `title` làm phương án cuối.

Chỉ chuỗi đúng dạng `MSG` + 2–3 chữ số được giữ làm `serverMessageCode`. Giá trị kỹ thuật tùy ý như `DATABASE_TIMEOUT` không được đưa vào object hướng tới UI. Code được đưa tiếp qua message resolver; code chưa có catalog nhận safe fallback.

## Vì sao payload là unknown

Ép JSON response thành interface chỉ làm TypeScript tin dữ liệu, không kiểm tra runtime. Gateway, reverse proxy, validation framework hoặc backend version khác có thể trả null, array, HTML/text hoặc object thiếu field. Parser kiểm tra từng tầng trước khi đọc.

## Không làm trong slice này

- Chưa gọi `fetch`.
- Chưa thêm timeout/network/cancel problem.
- Chưa thêm bearer token hay refresh.
- Chưa map validation fields vì contract field-name/message chưa ổn định.

## Test

Test bao phủ top-level code, nested extension, title fallback thông qua parser logic, unknown MSG code, null/array/string và internal code không hợp lệ. Raw `detail` không trở thành user-visible message.

## Defense Q&A

**Vì sao giữ unknown `MSG12` nhưng không giữ `DATABASE_TIMEOUT`?**

`MSG12` tuân theo namespace contract và hữu ích cho diagnostics/catalog rollout. Chuỗi kỹ thuật tùy ý không phải public contract và có thể chứa thông tin nội bộ.

**Parser có quyết định retry không?**

Không. Nó chỉ chuẩn hóa lỗi. Service/feature mới biết endpoint và thao tác có an toàn để retry hay không.
