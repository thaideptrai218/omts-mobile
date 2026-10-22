# OMTS-133 — M1 Connectivity foundation

## Cái gì đã làm

- Cài `expo-network` và `expo-secure-store` bằng Expo CLI để lấy đúng phiên bản tương thích SDK 57.
- Tạo message catalog ban đầu với `MSG07`.
- Tách connectivity thành domain mapper, repository interface, Expo Network adapter, service và React provider.
- Gắn offline banner toàn cục trong root layout, có safe-area padding và accessibility alert.
- Chuyển `docs/learning/` thành tài liệu local-only theo yêu cầu của Duy Thái.

## Tại sao kiến trúc này được chọn

UI không gọi `expo-network` trực tiếp. Native module là chi tiết hạ tầng và có thể khó giả lập trong test; repository chuyển snapshot native thành ba trạng thái domain `online`, `offline`, `unknown`. Provider chỉ biết service và banner chỉ biết context. Khi cần mock hoặc test lỗi mạng, adapter có thể đổi mà không sửa component.

`unknown` khác `offline`: lúc app vừa khởi động, native API có thể chưa trả kết quả. Nếu coi `unknown` là offline, người dùng sẽ thấy cảnh báo sai trong chốc lát.

Banner hiện không nói dữ liệu sẽ được tự lưu hay tự đồng bộ. SRS `MSG07` có bối cảnh offline draft/logout, nhưng `OMTS-133` chưa định nghĩa queue, conflict hoặc persistence cho mutation. Tự hứa đồng bộ ở UI khi chưa có cơ chế là sai trải nghiệm và sai nghiệp vụ.

## Data flow

```text
Expo Network event
  → ExpoNetworkRepository
  → toConnectivityStatus()
  → ConnectivityService
  → ConnectivityProvider
  → OfflineBanner
  → MSG07 frontend copy
```

Initial snapshot và live event có thể chạy gần nhau. Provider đánh dấu khi đã nhận live event để kết quả initial chậm hơn không ghi đè trạng thái mới.

## Lỗi thực tế và cách khắc phục

### Expo Doctor báo năm package patch lệch SDK

- Lệnh gây lỗi: `npx expo-doctor`.
- Kết quả quan trọng: 20/21 checks pass; `@expo/ui`, `expo`, `expo-constants`, `expo-linking` và `expo-router` thấp hơn patch mà SDK 57 mong đợi.
- Nguyên nhân gốc: scaffold dùng bộ patch cũ; sau khi cài module mới, registry/Expo metadata đã chỉ ra bộ patch SDK 57 mới hơn.
- Cách kiểm tra: chạy lại `npx expo install --fix`, sau đó kiểm tra `npm ls` và Expo Doctor.
- Cách sửa: chỉ nâng patch bằng `npx expo install --fix`; không dùng `npm audit fix --force`.
- Bằng chứng: Expo 57.0.30, Router 57.0.28; Expo Doctor đạt 21/21.

### npm audit vẫn báo advisory bắc cầu

- Lệnh: `npm audit --omit=dev`.
- Kết quả: 29 advisory, gồm 11 moderate và 18 high trong Expo/Metro/config dependency tree.
- Nguyên nhân: advisory nằm trong dependency bắc cầu của toolchain, không phát sinh từ code connectivity.
- Vì sao chưa auto-fix: npm đề xuất hạ Expo xuống 44 hoặc chuyển Router sang major không tương thích. Đây là lỗi dây chuyền nghiêm trọng hơn bản advisory hiện tại.
- Xử lý: giữ bộ SDK được Expo Doctor xác nhận và theo dõi bản vá tương thích từ Expo; không che giấu audit result.

## Kiểm chứng

- `npm run lint`: pass;
- `npm run typecheck`: pass;
- `npx expo-doctor`: 21/21 pass;
- `npx expo export --platform web`: pass, sinh route `/`;
- `git diff --check`: pass.

Chưa gọi lát này là hoàn tất `OMTS-133`: SecureStore mới được cài, chưa có token repository; chưa có session bootstrap, refresh coordinator, route groups, permission navigation hoặc QA API.

## Defense Q&A

**Tại sao component không dùng thẳng `Network.useNetworkState()`?**

Vì như vậy UI phụ thuộc trực tiếp module native, khó mock và lặp listener khi nhiều màn cùng dùng. Repository/service tạo một ranh giới để thay adapter và tập trung một nguồn trạng thái.

**Banner offline có chứng minh app hỗ trợ làm việc offline không?**

Không. Banner chỉ chứng minh app nhận biết mất mạng và cảnh báo. Offline draft, retry, merge và conflict là các hành vi nghiệp vụ riêng, chỉ được triển khai khi ticket/SRS quy định.
