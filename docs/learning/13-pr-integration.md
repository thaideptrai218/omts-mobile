# Đồng bộ PR với develop

## Ngữ cảnh

Ngày 03/11/2026, người dùng yêu cầu push code mới nhất và mở PR cho backend/mobile. Hai nhánh đã có PR nên cập nhật các PR đó vào `develop`.

## Vì sao có conflict

Git ghép thay đổi từ tổ tiên chung. `develop` mobile đã chuyển từ Expo sang bộ khung Zalo trong PR khác; nhánh hiện tại đã phát triển và tổ chức lại bộ khung này. Ghép trực tiếp làm trùng entry, cấu hình và các component mẫu cũ. Giải quyết trong worktree riêng, giữ entry `app.ts` → `main.tsx` → `App.tsx`, cấu trúc hiện tại, và loại các file khung cũ bị thêm trở lại. Commit ghép giữ lịch sử của cả hai nhánh.

## Hợp đồng lỗi

Backend develop chuyển từ `MSGnn` sang mã SRS mới và gửi `legacyCode` để tương thích trong một phiên bản. `ProblemDetails` khai báo trường này; `services/httpClient.ts` ưu tiên `legacyCode` khi tạo `ApiError`. Mã gốc vẫn nằm trong details. Backend cũ không gửi trường này nên tiếp tục dùng `code`; các màn hình và bản dịch hiện có vẫn nhận cùng mã khi backend được nâng cấp.

## Giới hạn backend

Backend develop cũng xóa các bảng scaffold cũ, trong đó có `LaborSettlements`. Nhánh nghiệp vụ đang dùng bảng này để ngăn thay đổi cài đặt chấm công khi đã chốt công. Thử ghép cho thấy repository không còn compile do thiếu entity/status. Đã hủy thử ghép trong worktree; giữ nguyên nhánh backend đã kiểm thử và để PR draft với xung đột schema được ghi rõ. Chưa thay quy tắc chốt công hay áp dụng migration xóa bảng vào DB dev.

## Kiểm tra

Mobile lint, typecheck và production build đạt trong worktree riêng. Kiểm tra ba dạng lỗi: backend cũ chỉ có `code`, backend mới có cả `code`/`legacyCode`, lỗi HTTP không có mã. Không đưa env hay build artifact vào commit. Push/PR không thay thế bước triển khai API hoặc kiểm tra luồng nhân lực trên điện thoại.

## Câu hỏi bảo vệ

- **Vì sao không tạo PR trùng?** Hai PR đang mở cùng nhánh sẽ được cập nhật khi push.
- **Vì sao backend còn draft?** Xung đột schema liên quan kiểm soát dữ liệu công/lương cần được giải quyết trước khi merge; việc push giữ nguyên code đã kiểm thử.
- **Vì sao nhận legacyCode?** Cho phép mobile và backend nâng cấp độc lập trong thời gian backend duy trì hợp đồng tương thích.
