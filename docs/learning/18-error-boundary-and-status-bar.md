# Màn báo lỗi thay cho màn trắng, và chiều cao thanh trạng thái Android (26/11/2026)

## 1. Vấn đề

Đây là hai việc còn lại sau đợt soát bố cục ở [bài 17](17-mobile-layout-review.md).

- **Màn trắng.** React gỡ toàn bộ cây giao diện khi một component ném lỗi lúc vẽ mà không có error boundary nào bắt. Chỉ
  cần một màn nhận JSON lệch model (ví dụ `items` thiếu) hoặc tải hỏng file mã của màn khi mạng yếu là cả Mini App thành
  màn trắng. Zalo coi màn trắng là vi phạm (CLAUDE.md mục 4).
- **Thanh trạng thái Android.** Đầu trang tự vẽ chừa `--top-safe = max(var(--zaui-safe-area-inset-top), 28px)`. Trên
  Android, biến `--zaui-safe-area-inset-top` chỉ mang chiều cao thật của thanh trạng thái khi app gọi `configAppView`, mà app
  chưa gọi. Máy có thanh trạng thái cao hơn 28px (camera đục lỗ) sẽ có nút "Quay lại" nằm một phần dưới thanh trạng thái.

## 2. Khái niệm

### Error boundary

Error boundary là một class component có `static getDerivedStateFromError`. Khi một component con ném lỗi trong lúc vẽ,
React dừng ở boundary gần nhất và vẽ màn thay thế của nó, thay vì gỡ cả app. Boundary chỉ bắt lỗi lúc vẽ; lỗi trong xử lý
bấm nút hay trong `await` gọi API không tới đây, vì từng màn đã tự báo lỗi đó bằng `FormError` hoặc `Loadable`.

Có hai loại lỗi cần xử lý khác nhau:

- **Lỗi vẽ** (dữ liệu lệch, lỗi code): dựng lại màn từ đầu có thể chạy được, vì dữ liệu tải lại có thể đã khác. Để dựng lại,
  boundary đổi `key` của phần con.
- **Lỗi tải mã màn** (`Failed to fetch dynamically imported module`): trình duyệt nhớ lần tải hỏng của module đó trong cả
  phiên trang, nên dựng lại vẫn hỏng. Phải tải lại app.
  - Màn báo lỗi về trang chủ trước rồi mới `location.reload()`, để lần tải lại mở địa chỉ gốc của Mini App chứ không phải
    một đường dẫn con.

### `configAppView`

Tài liệu: https://docs.zaloplatforms.com/docs/MA/api/user-interface/view/configAppView, có từ SDK 2.25.0, không cần xin
quyền.

Trong zmp-sdk 2.53.3 (`apis/common/apis/general/view.js`), `configHeader` chạy trên Android với `statusBarType` là
`transparent` hoặc `hidden` và ẩn action bar. Khi đó nó gán `--zaui-safe-area-inset-top` bằng
`ZaloJavaScriptInterface.getStatusBarHeight() / devicePixelRatio`. Nếu không, biến này là `env(safe-area-inset-top, 0px)`,
thường bằng 0 trong webview Android.

App gọi `configAppView({ statusBarType: "transparent", actionBar: { hide: true } })`, đúng bằng cấu hình đã có trong
`app-config.json` (`statusBar: "transparent"`, `actionBarHidden: true`). Vì vậy giao diện của Zalo không đổi gì; chỉ có
biến chiều cao được gán. `--top-safe` vẫn giữ tối thiểu 28px, nên chỗ chừa chỉ có thể lớn lên.

## 3. Trong code OMTS

- `src/components/ErrorBoundary/ErrorBoundary.tsx`: boundary dùng chung. Nó nhận `fallback({ chunk, retry })` và đổi `key`
  để dựng lại phần con.
- `src/components/PageErrorBoundary/PageErrorBoundary.tsx`: màn báo lỗi của từng màn, dùng `ManagePage` nên vẫn có
  "Quay lại".
  - Lỗi vẽ: "Màn này vừa gặp lỗi", nút "Thử lại" và "Về trang chủ".
  - Lỗi tải mã: "Không tải được màn này", nút "Tải lại app".
- `src/routes/AppRoutes.tsx`: mọi route bọc `guard(...)`. Màn lỗi chỉ thay màn đó, thanh dưới và các màn khác vẫn dùng được.
  - `AnimationRoutes` của ZaUI chuyển nguyên `element`, nên bọc thêm không ảnh hưởng hiệu ứng chuyển trang.
- `src/App.tsx` và `src/components/AppCrash/AppCrash.tsx`: lưới cuối cho lỗi ở khung app (router, thanh dưới, kiểm tra
  phiên). Vì nằm ngoài router nên chỉ có nút "Tải lại app".
- `src/services/zaloService.ts` `applyAppView()`, gọi trong `src/main.tsx` lúc mở app. Ngoài Zalo, lời gọi bị từ chối và
  được bỏ qua.

## 4. Kiểm tra

- `npm run lint`, `npm run typecheck` và `npm run build` đạt.
- Chạy app trong Chrome không giao diện, với backend `develop` và dữ liệu demo, đăng nhập Chủ HTX:
  - `/api/zones` trả `{}`: màn Vùng nuôi lỗi khi vẽ và hiện "Màn này vừa gặp lỗi". Thanh "Quay lại" và hai nút vẫn bấm
    được, app không trắng.
  - Trả lại dữ liệu đúng rồi bấm "Thử lại": màn dựng lại, hiện đủ danh sách vùng.
  - Bấm "Về trang chủ": về `/`, trang chủ chạy bình thường.
  - Chặn file `WaterPage.tsx`: màn Chỉ số nước hiện "Không tải được màn này" với nút "Tải lại app".
- **Chưa thử trong Zalo trên điện thoại:**
  - Chiều cao thanh trạng thái Android chỉ đo được trong Zalo.
  - Cần kiểm trên một máy có camera đục lỗ rằng nút "Quay lại" nằm dưới thanh trạng thái.

## 5. Câu hỏi bảo vệ

- **Vì sao không bọc một boundary quanh cả `AnimationRoutes`?**
  - Muốn màn hỏng tự hết khi chuyển trang thì boundary phải đổi `key` theo đường dẫn. Đổi `key` như vậy sẽ dựng lại toàn
    bộ cây route mỗi lần chuyển trang, nên mất hiệu ứng và mất trạng thái màn trước.
  - Bọc từng route thì mỗi màn có boundary riêng, rời màn là boundary đó mất theo.
- **Vì sao "Thử lại" không dùng được cho lỗi tải mã?** Theo HTML, khi tải một module hỏng, trình duyệt ghi lần hỏng đó vào
  bảng module của trang. Mọi lần `import()` sau tới cùng địa chỉ đều trả lỗi ngay, không tải lại.
- **Gọi `configAppView` có đổi giao diện không?** Không: các tham số trùng `app-config.json`. Hàm chỉ có thêm tác dụng phụ
  là gán chiều cao thanh trạng thái trên Android.
