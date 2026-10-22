# Review luồng session Mobile — 22/10/2026

> Cập nhật tiếp theo cùng ngày: người dùng đã yêu cầu sửa SESSION-UX-01. Finding này **đã đóng trong phạm vi mock** với regression expired → login có MSG19 và explicit logout không MSG19. Xem [báo cáo triển khai tiếp theo](MOBILE_MSG19_PROFILE_ASSEMBLY_2026-10-22.md). Phần bên dưới giữ nguyên kết quả review tại thời điểm trước khi sửa, không phải trạng thái còn mở hiện tại.

## Kết luận

Luồng mock đã ghép đủ để review login → forced password → xác minh một email/SĐT → account → logout. Kiểm tra source và test bổ sung chưa tái hiện lỗi mở lại app sau logout trong các tình huống đã xét. **Có một finding P2 về thông báo hết phiên còn mở**; không coi đây là bản đã nghiệm thu API/Expo Go hoặc sẵn sàng merge.

Lượt này review và bổ sung test/báo cáo; không sửa runtime để giải quyết finding mới khi người dùng chưa yêu cầu triển khai phần sửa đó. Các thay đổi runtime thuộc lát ghép luồng trước được đưa vào cùng commit theo yêu cầu commit/push hiện tại.

## Finding còn mở: SESSION-UX-01 — P2

**Vấn đề:** session hết hạn đưa người dùng về login nhưng chưa giữ lý do hết phiên để hiển thị `MSG19`. Người dùng đang thao tác có thể thấy màn đăng nhập mà không hiểu vì sao phải đăng nhập lại.

**Bằng chứng code:**

- `src/features/session/domain/mobile-session.ts`: signedOut chỉ có status, chưa có terminal reason.
- `src/features/session/state/mobile-session-store.ts`: expired gọi hideAndClear; sau khi clear, store chỉ publish `{ status: "signedOut" }`.
- `src/features/auth/components/session-login-controller.tsx`: mỗi lần mount, feedback khởi tạo null. Lỗi từ một controller bảo vệ đã unmount không được mang sang login.
- `session-feedback.ts` có mapping MSG19 nhưng mapping đó tự nó không vận chuyển message qua lần thay route/unmount.

**Tác động:** điều kiện bảo vệ vẫn đúng — không vào app khi expired. Lỗ hổng nằm ở giải thích trạng thái cho người dùng, không phải phát hiện bypass hoặc lộ protected content trong review này. Các test expired ở service chứng minh signedOut, chưa chứng minh có banner trên màn login.

**Đề xuất sửa nhỏ tiếp theo:** thêm reason hẹp vào signedOut, phân biệt explicit logout và session expired; login đọc reason và render MSG19 qua catalog. Không đặt token/OTP/server prose trong route params, không lưu reason nhạy cảm vào storage; xóa hoặc thay reason khi người dùng bắt đầu login mới. Thêm component regression cho expired → login có MSG19, còn explicit logout → login không báo lỗi hết phiên. Đây là sửa UX theo kết quả đã có, không cần thay nghiệp vụ BA; chưa thực hiện trong lượt review này.

## Phạm vi đã review

- Root auth/onboarding/app guards, index trung tính, không lấy credential từ URL.
- Contract session/gateway, explicit mock mode và fail-closed khi chưa cấu hình adapter thật.
- Thứ tự forced password trước contact verification; chỉ chọn liên hệ đã khai báo; email hoặc SMS thành công là đủ.
- Giới hạn OTP/expiry/cooldown và Back chọn lại kênh; không reset ngân sách chỉ vì quay màn.
- Single-flight refresh, rotation cũ trả muộn, generation/epoch và thứ tự save/clear.
- Logout local-first, offline không tạo queue; cleanup lỗi giữ root trung tính, không phục hồi tài khoản từ storage chưa xóa.
- Handler có thật mới hiện action; mock không phải bằng chứng API/permission navigation/business feature đã xong.

Không thêm actor, quyền, trường dữ liệu hoặc luồng onboarding mới trong review. Không dùng label vai trò thay effective permissions.

## Bảy regression test bổ sung

1. Bootstrap read trả về credential cũ sau logout không phục hồi account.
2. Backend giả đã đổi mật khẩu thành công nhưng response bị giữ tới sau logout: kết quả về muộn vẫn không mở lại onboarding/app. Test cố ý giữ **kết quả thành công**, không chỉ để request lỗi vì mock lease đã bị revoke.
3. Bấm login hai lần không tạo request gateway thứ hai.
4. Bootstrap sau logout-clear failure thử cleanup lại, không đọc storage rồi mở lại account.
5. Refresh lỗi tạm thời giữ handle; một lần session-check retry có thể tiếp tục khi gateway hồi phục. Test này không khẳng định timeout refresh thật luôn an toàn để retry.
6. Đổi mật khẩu chuẩn giữ nguyên verified status và cặp phân công; login cũ bị từ chối, mật khẩu mới dùng được trong tiến trình mock.
7. Một lần save đã bắt đầu nhưng chưa xong phải kết thúc trước clear của logout, tránh ghi lại credential sau khi đã thoát.

Các test nằm ở `src/features/session/state/mobile-session-store.test.ts` và `services/session-access.test.ts`. Không thêm test dưới `src/app`, không hạ dependency RNTL để giả vờ có native router integration test.

## Bằng chứng kiểm tra

- `npm test`: **45 suites / 252 tests pass**, full run 34.547 giây trong lượt review này.
- `npx expo-doctor`: **21/21 pass** trong lượt review này.
- `npm run lint`, `npm run typecheck`: pass trong lượt review này.
- `npx expo export --platform web`: pass, 11 static route entries gồm route nghiệp vụ, alias nhóm và route framework; không phải 11 màn nghiệp vụ.
- `git diff --check`: pass trước staging. Learning/env/build output không thuộc phạm vi commit; kiểm tra staged paths và remote SHA là bước bàn giao Git riêng sau quality gates.
- Browser smoke login/forced gate/account/security-cancel/logout/Back/direct URL/360 CSS px là bằng chứng của lát ghép ngay trước, ghi trong `MOBILE_SESSION_ASSEMBLY_2026-10-22.md`; không tuyên bố đã chạy lại toàn bộ browser/native trong review chỉ-source/test này.
- Chưa có Expo Go, Android/iOS Back, bàn phím thật, TalkBack/VoiceOver hoặc QA API evidence. Những phần đó không được đánh dấu Done.

## Backend và khả năng làm tiếp

Xem [backend recheck](BACKEND_READINESS_RECHECK_2026-10-22.md). Backend có model tọa độ bè, refactor repository/Unit of Work và audit service trên nhánh feature. Develop mới merge domain/schema, chưa có auth controllers; nhánh auth vẫn chưa có API OTP/password/profile/recovery và vẫn giữ phone-only, 24h, booleans. Không đổi toàn bộ app sang API thật ở thời điểm này.

Thứ tự đề xuất: sửa SESSION-UX-01 → ghép profile wrapper mock từng bước → preferences wrapper mock → native QA. API adapter chạy thật chờ QA ref/URL/OpenAPI và các contract/gate được backend xác nhận. Các mục này là đề xuất tiếp theo, chưa được triển khai bởi lượt review.

## Phát hành phạm vi feature branch

Theo yêu cầu, commit/push vào `feature/OMTS-133-mobile-foundation`; **không merge develop**, không force-push. Trước push sẽ kiểm tra danh sách staged để loại `.env.local`, `docs/learning`, output build và credential thật. Chỉ báo đã push sau khi lệnh push thành công và remote SHA khớp HEAD.

Không tạo/cập nhật/đóng ticket, không sửa SRS/backend, không tạo hoặc merge PR trong lượt này. Workflow CI hiện không chạy chỉ vì feature branch được push; kết quả local không được gọi là GitHub CI xanh.
