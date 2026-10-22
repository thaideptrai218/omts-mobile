# OMTS-133 — M2 component-test foundation

## Kết quả

Đã thiết lập Jest bằng `jest-expo`, React Native Testing Library 14.1 và `test-renderer` 1.2.0. Alias `@/` được map vào `src/`; TypeScript nhận Jest globals; README có một bộ lệnh kiểm tra chuẩn.

Hai suite hiện có 10 test, bao phủ:

- controlled TextField và error association;
- password show/hide;
- button press và pending accessibility state;
- danger banner role/accessible name;
- empty state không tự tạo retry;
- inline status có nhãn chữ;
- skeleton group là một progressbar;
- confirmation dialog gọi đúng cancel handler.

## Lỗi 1 — test dependencies bị đặt sai nhóm

Lệnh theo tài liệu Expo trên Windows là `npx expo install ... "--" --dev`. Expo CLI đã gọi `npm install --save --dev`, đồng thời NPM báo `npm warn config dev`. Sau lệnh, bốn package test nằm trong `dependencies` thay vì `devDependencies`.

Nguyên nhân là cách NPM hiện tại diễn giải `--dev` trong chuỗi lệnh con, không phải các package cần chạy trong production. Đã chuyển khai báo root sang `devDependencies` và đồng bộ `package-lock.json`. Root lockfile sau đó được kiểm tra trực tiếp để bảo đảm hai file khớp.

## Lỗi 2 — peer dependency không tương thích

RNTL 14 kéo `test-renderer@1.3.1`; package này kéo `react-reconciler@0.34.0`, yêu cầu React `^19.3.0`. Expo SDK 57 khóa React `19.2.3`, nên `npm ls` trả `ELSPROBLEMS` và đánh dấu React invalid.

Không dùng `--force` và không nâng React ngoài ma trận Expo. Metadata NPM cho thấy `test-renderer@1.2.0` dùng reconciler 0.33 và chấp nhận React `^19.0.0`, nên đã pin 1.2.0. Sau sửa, `npm ls @testing-library/react-native test-renderer react react-reconciler --depth=2` không còn invalid peer.

## Lỗi 3 — test Modal timeout

Lần chạy đầu cho 4/5 test pass. Test `ConfirmationDialog` vượt timeout 5 giây trong `userEvent.press`; khi Jest teardown, query đang chờ sinh thêm lỗi dây chuyền `import after the Jest environment has been torn down`.

Các test khác dùng `userEvent` bình thường, còn lỗi chỉ xuất hiện qua native `Modal`, nên giả thuyết là chuỗi press đầy đủ không hoàn tất trong test renderer. Đã dùng `fireEvent.press` riêng tại ranh giới native này để kiểm tra handler trực tiếp, thay vì tăng timeout. Lần chạy sau 5/5 pass; toàn suite cuối cùng 10/10 pass.

## Cảnh báo dependency

NPM báo một số package gián tiếp deprecated và 57 vulnerability trong cây test/build lớn. Không chạy `npm audit fix --force` vì lệnh có thể nâng breaking dependency trái Expo SDK. Đây cần được audit riêng theo đường dẫn dependency và bản vá tương thích, không trộn vào UI micro-task.

## Defense Q&A

**Vì sao test theo role/name thay vì testID?**

Vì role/name gần với cách người dùng và screen reader tìm control. Nếu accessibility bị mất, test cũng thất bại; testID chỉ chứng minh một node tồn tại.

**Vì sao không dùng `--force` để hết peer warning?**

`--force` chỉ bỏ qua kiểm tra, không làm hai runtime tương thích. Pin phiên bản reconciler phù hợp với React của Expo mới xử lý nguyên nhân gốc.
