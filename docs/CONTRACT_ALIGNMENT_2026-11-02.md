# Đồng bộ contract đã duyệt — 02/11/2026

Nhánh tích hợp giữ nguyên repository Mobile gốc và các thay đổi Expo local. Target backend: tích hợp #21@6b7ce1c, #23@51420c6, #22@8078fce tại omts-backend PR25/08ebaf0. Người dùng đã duyệt D1–D3 trong chat, tài liệu gốc ở Web/docs/decisions/WEB_BACKEND_21_23_ALIGNMENT_PROPOSAL_2026-10-31.md.

- Vai trò cố định chỉ xem, bỏ API impact/ngừng/khôi phục role và ngày hiệu lực grant; vẫn cấp/thu hồi cặp vùng–role trên tài khoản theo API.
- Tùy chọn thông báo theo type: mọi thông báo vào inbox; cả Web và Mobile chỉnh optional Push; mandatory khóa bật. Cho lưu khi chưa có thiết bị và ưu tiên notice. Quyền thiết bị chỉ xin qua thao tác riêng, không tự xin khi lưu tùy chọn. Lỗi ghi phải đối chiếu/mở lại màn trước lượt mới.
- Inbox đọc schema cũ/mới, dịch các messageCode nguyên tử WATER/FARM và loại bỏ trường người nhận không thuộc DTO. Chưa tính luồng /open/deep-link theo record ID là acceptance hoàn chỉnh.
- Nhóm Material, gợi ý mã VT và đơn vị Seed chung; mã item đã dùng được sửa, nhóm/đơn vị khóa; danh mục đã ngừng phải Resume trước khi sửa. NCC dùng Address/Email, bỏ tổng nợ từ detail và đọc nợ bằng màn/endpoint có quyền riêng.

Lint, typecheck, 10 contract tests và build PASS. Vite vẫn cảnh báo chunk lớn. Chưa deploy Zalo, chưa kiểm thiết bị/provider thật hoặc browser QA3003 trong đợt này. Chưa merge develop; tạo/reset tài khoản và các khác biệt onboarding vẫn theo quyết định chờ backend trước đây.
