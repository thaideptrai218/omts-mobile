# Mở hai repo trong VS Code

Workspace gốc không phải một Git repository. Bản workspace có thể commit được nằm ở đây, trong repo mobile; mở `OMTS.code-workspace` cạnh file này bằng VS Code.

File dùng bố cục checkout hiện tại:

```text
OTMS/
  back-end/omts-backend/     Git repository backend
  mobile/omts-mobile/       Git repository Zalo Mini App
  web/                     Chưa có mã nguồn trong workspace này
  db-export/               Hiện trống; dành cho bản xuất DB local
```

Mỗi repo có cấu hình và lịch sử Git riêng. Nếu clone theo bố cục khác, sửa hai giá trị path của workspace cho đúng vị trí checkout trên máy.

- [Hướng dẫn cấu trúc mobile](../../docs/PROJECT_STRUCTURE.md)
- [Hướng dẫn cấu trúc backend](https://github.com/thaideptrai218/omts-backend/blob/chore/cors-zalo-mini-app/docs/PROJECT_STRUCTURE.md)

Cấu hình công cụ ở gốc từng repo, mã ở src, tài liệu ở docs, script hỗ trợ ở scripts, kiểm thử backend ở tests. Env, user-secrets, log và file build sinh ra chỉ nằm local.
