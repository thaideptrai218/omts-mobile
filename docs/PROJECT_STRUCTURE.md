# Cấu trúc OMTS Mobile

Cập nhật 31/10/2026 theo cây thư mục người dùng yêu cầu. Màn hình và service nghiệp vụ nằm trong feature; phần dùng chung có các thư mục riêng ngay dưới `src/`.

```text
omts-mobile/
├── src/
│   ├── assets/
│   │   ├── images/            Ảnh import để Vite đóng gói
│   │   └── styles/            SCSS toàn ứng dụng và Tailwind
│   ├── components/            Component dùng chung, mỗi component một folder
│   │   ├── PageHeader/PageHeader.tsx
│   │   ├── DateField/DateField.tsx
│   │   ├── BottomNav/BottomNav.tsx
│   │   └── ...
│   ├── features/
│   │   ├── auth/              Liên kết Zalo, phiên, quyền, đăng xuất
│   │   │   ├── components/SessionGuard/SessionGuard.tsx
│   │   │   ├── pages/LinkAccountPage.tsx
│   │   │   ├── models/        Session, LinkAccount, Permissions, FlashMessage
│   │   │   ├── services/      linkService, sessionService, authService, permissionsService
│   │   │   ├── hooks/useLogout.ts
│   │   │   └── state/authAtoms.ts
│   │   ├── account/           Tài khoản và hồ sơ cá nhân
│   │   ├── dashboard/         Component tổng quan và service số liệu
│   │   ├── development/       Công cụ chuyển vai trò trong bản dev
│   │   ├── farming/           Vùng nuôi, bè, bản đồ, OCR, chỉ số nước
│   │   ├── notifications/     Hộp thông báo, tùy chọn, chuông
│   │   ├── organization/      Nhân viên, tài khoản, vai trò, hồ sơ HTX
│   │   ├── purchasing/        Nhà cung cấp, vật tư, phiếu nhập
│   │   ├── sales/             Yêu cầu mua theo lồng, sản phẩm bán
│   │   ├── traceability/      Tra cứu nguồn gốc, lô mẫu được ghi rõ
│   │   └── workforce/         Phân công, chấm công, nghỉ phép
│   ├── hooks/                 useLoad, useAction, usePaged, useScan, useOpenFeature
│   ├── models/                Kiểu dùng chung: Pagination, Http, UI, Navigation, Coordinates
│   ├── layouts/MainLayout.tsx Khung chung của Mini App
│   ├── pages/                 HomePage.tsx, FeaturePage.tsx
│   ├── routes/                AppRoutes.tsx, các nhóm route và lazyPage.tsx
│   ├── services/              httpClient, Zalo SDK, storage, kết nối, cỡ chữ
│   ├── contexts/              AppProviders.tsx: provider ZaUI và snackbar hiện có
│   ├── utils/                 Định dạng, tọa độ, mã quét, UUID, nhãn và dịch lỗi
│   ├── constants/             Cấu hình môi trường, thông tin HTX, thông báo, danh mục chức năng
│   ├── App.tsx                Ghép providers, MainLayout và AppRoutes
│   ├── main.tsx               Khởi tạo cấu hình/phiên/kết nối và mount React
│   ├── app.ts                 Điểm vào của Zalo CLI, import main.tsx
│   └── env.d.ts               Kiểu biến môi trường Vite
├── scripts/testing/           Kịch bản kiểm tra thủ công
├── docs/                      Ngữ cảnh, cấu trúc, hợp đồng, ghi chép
├── .github/                   CI và quy trình GitHub
├── app-config.json            Cấu hình cửa sổ Mini App
├── vite.config.mts            Build, alias @, proxy API
├── package.json
└── www/                       File build sinh ra, không commit
```

Feature dùng `models`, `pages`, `components`, `services`, `hooks` theo nhu cầu; atom nằm ở `state`, dữ liệu mẫu nằm ở `data`. Model và DTO nhóm theo đối tượng, ví dụ `features/farming/models/Zone.ts`, `features/farming/models/Raft.ts`, `features/sales/models/PurchaseRequest.ts`. Component có style riêng đặt style cạnh component, như `features/farming/components/RaftMap/RaftMap.scss`.

```text
features/sales/
├── models/
│   ├── SalesProduct.ts        Sản phẩm và dữ liệu lưu sản phẩm
│   ├── PurchaseRequest.ts     Yêu cầu mua, trạng thái, dữ liệu form và phản hồi
│   └── PurchaseStaffing.ts    Kế hoạch nhân lực, lời mời và phản hồi ca
├── services/                 salesService.ts, purchaseStaffingService.ts
├── pages/                    Các màn của nghiệp vụ
└── components/               Component riêng của nghiệp vụ
```

- Sửa nghiệp vụ tại `features/<nghiệp-vụ>/`; API của feature đặt trong `services/`.
- Kiểu dữ liệu nghiệp vụ, DTO request/response, bộ lọc và dữ liệu form nằm trong `features/<nghiệp-vụ>/models/`; kiểu chung nằm trong `src/models/`. Service và UI dùng `import type` trực tiếp, không import model qua service.
- Model chỉ chứa khai báo kiểu và import type; không gọi API/SDK, không giữ atom hay dữ liệu mẫu. Service không khai báo type/interface hoặc kiểu object request/response trực tiếp; ESLint kiểm tra các ranh giới này. Props và trạng thái hiển thị chỉ dùng trong một component được giữ cạnh component đó.
- Component dùng chung ở `components/<Tên>/<Tên>.tsx`; hooks dùng chung ở `hooks/`; hàm thuần ở `utils/`; hằng số ở `constants/`.
- `Paged` ở `models/Pagination.ts`, UUID ở `utils/operationId.ts`. HTTP client ở `services/httpClient.ts`, logic phiên/refresh ở `features/auth/services/sessionService.ts`, SDK Zalo ở `services/zaloService.ts`.
- `routes/AppRoutes.tsx` ghép các nhóm `farmingRoutes`, `organizationRoutes`, `purchasingRoutes`, `salesRoutes`, `workforceRoutes`. Feature không import layout/trang tổng quát/router/provider cấp ứng dụng. Component chung không tự import nghiệp vụ. ESLint chặn các import alias này.
- UI gọi service; service gọi HTTP hoặc SDK. Header chung nhận chuông qua props.
- `contexts/AppProviders.tsx` ghép provider hiện có; state vẫn dùng Jotai và store mặc định để service và UI cùng đọc một phiên.
- URL chức năng độc lập đường dẫn file; chuyển folder không đổi URL hay API backend.
- Dự án dùng TypeScript nên file tương ứng mẫu `.jsx/.js` là `.tsx/.ts`.
- Cấu hình Vite/Zalo/TypeScript giữ ở gốc. Giữ `src/app.ts` làm entry của Zalo CLI; chuỗi khởi tạo là `app.ts` → `main.tsx` → `App.tsx`. Trên Windows cần import rõ `@/App.tsx` để tránh nhầm với `app.ts`; TypeScript bật `allowImportingTsExtensions` cùng `noEmit`.
- `.env`, token, log, bản build và script thử tạm không đặt trong source/commit.

Kiểm tra: `npm run lint`, `npm run typecheck`, `npm run build`. Kịch bản tài khoản cũ ở `scripts/testing/e2e-acs.mjs`; đọc điều kiện chạy ở đầu file.

Quy định Zalo ở `CLAUDE.md`, ngữ cảnh chức năng ở `PROJECT_CONTEXT.md`. Việc sắp xếp folder không chứng minh lỗi mở link trên Zalo đã được xử lý; trạng thái đó ghi riêng trong `learning/08-device-white-screen.md`.
