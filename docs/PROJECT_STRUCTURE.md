# Cấu trúc OMTS Mobile

Cập nhật 31/10/2026. Chia mã theo nghiệp vụ: màn hình, API, trạng thái và thành phần riêng của một chức năng nằm cùng chỗ.

```text
omts-mobile/
├── src/
│   ├── app.ts                 Điểm vào của Zalo CLI
│   ├── env.d.ts               Kiểu biến môi trường Vite
│   ├── app/                   Khởi tạo, ghép router, khung ứng dụng
│   │   ├── layout.tsx
│   │   ├── session-guard.tsx
│   │   └── components/        Thanh điều hướng, splash, trạng thái mạng
│   ├── features/
│   │   ├── account/           Liên kết Zalo, tài khoản, hồ sơ cá nhân
│   │   ├── dashboard/         Trang chủ và tổng quan theo quyền
│   │   ├── development/       Công cụ chuyển vai trò trong bản dev
│   │   ├── farming/           Vùng nuôi, bè, bản đồ, OCR, chỉ số nước
│   │   ├── notifications/     Hộp thông báo, tùy chọn, chuông
│   │   ├── organization/      Nhân viên, tài khoản, vai trò, hồ sơ HTX
│   │   ├── purchasing/        Nhà cung cấp, vật tư, phiếu nhập
│   │   ├── sales/             Yêu cầu mua theo lồng, sản phẩm bán
│   │   ├── traceability/      Tra cứu nguồn gốc, lô mẫu được ghi rõ
│   │   └── workforce/         Phân công, chấm công, nghỉ phép
│   ├── shared/
│   │   ├── api/               HTTP, lỗi, hợp đồng, phân trang
│   │   ├── auth/              Phiên, token, quyền, nativeStorage
│   │   ├── config/            Biến môi trường, thông tin HTX dùng chung
│   │   ├── hooks/             Tải dữ liệu, thao tác, phân trang
│   │   ├── lib/               Định dạng, tọa độ, thông báo, UUID
│   │   ├── navigation/        Danh mục chức năng và điều hướng
│   │   ├── platform/          Zalo SDK, kết nối mạng, mã quét
│   │   ├── preferences/       Cỡ chữ
│   │   ├── routing/           Tải màn theo yêu cầu
│   │   ├── styles/            SCSS và Tailwind
│   │   └── ui/                Form, lịch, header, bảng, dòng danh sách
│   └── static/images/         Ảnh phải import để Vite đóng gói
├── scripts/testing/           Kịch bản kiểm tra thủ công
├── docs/                      Ngữ cảnh, cấu trúc, hợp đồng, ghi chép
├── .github/                   CI và quy trình GitHub
├── app-config.json            Cấu hình cửa sổ Mini App
├── vite.config.mts            Build, alias @, proxy API
├── package.json
└── www/                       File build sinh ra, không commit
```

Mỗi feature chỉ tạo thư mục cần dùng: `pages`, `components`, `api`, `model`, `hooks`, `styles`. Nhóm quản lý có `routes.tsx`; `app/layout.tsx` ghép các nhóm. Không tạo thư mục trống để đủ mẫu.

- Sửa nghiệp vụ tại `features/<nghiệp-vụ>/`; ví dụ đơn mua ở `features/sales/pages` và `features/sales/api`.
- Phần dùng nhiều nơi đặt trong shared. `Paged` ở `shared/api/paged.ts`, UUID ở `shared/lib/operation-id.ts`; không lấy tiện ích chung từ một nghiệp vụ khác.
- App ghép các feature. Feature không import app; shared không import app hoặc feature. ESLint chặn các import alias vi phạm.
- UI chỉ gọi service/API module; HTTP và refresh ở shared, Zalo SDK ở `shared/platform`.
- Header chung nhận chuông từ nơi gọi; shared không tự nạp nghiệp vụ thông báo.
- URL chức năng độc lập đường dẫn file; chuyển folder không đổi URL hay API backend.
- Cấu hình Vite/Zalo/TypeScript giữ ở gốc vì công cụ đọc tại đó. Giữ `src/app.ts` làm entry của Zalo CLI.
- `.env`, token, log, bản build và script thử tạm không đặt trong source/commit.

Kiểm tra: `npm run lint`, `npm run typecheck`, `npm run build`. Kịch bản tài khoản cũ ở `scripts/testing/e2e-acs.mjs`; đọc điều kiện chạy ở đầu file.

Quy định Zalo ở `CLAUDE.md`, ngữ cảnh chức năng ở `PROJECT_CONTEXT.md`. Việc sắp xếp folder không chứng minh lỗi mở link trên Zalo đã được xử lý; trạng thái đó ghi riêng trong `learning/08-device-white-screen.md`.
