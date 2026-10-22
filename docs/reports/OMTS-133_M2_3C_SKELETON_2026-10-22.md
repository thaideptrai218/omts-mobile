# OMTS-133 — M2.3c Skeleton loading

## Kết quả

Đã thêm `Skeleton`, `SkeletonGroup` và hook `useReducedMotion`. Skeleton hỗ trợ chiều rộng, chiều cao, bo góc và pulse opacity nhẹ; khi Reduce Motion bật, animation dừng ở mức opacity tĩnh.

## Quyết định kỹ thuật

Animation dùng `Animated.Value` được khởi tạo một lần bằng lazy `useState`, cùng `useNativeDriver: true` và `isInteraction: false`. Như vậy opacity chạy ở native UI thread và không chiếm interaction handle làm trì hoãn công việc khác.

Mỗi khối skeleton bị ẩn khỏi accessibility tree vì nó chỉ là hình trang trí. `SkeletonGroup` đại diện toàn bộ vùng loading bằng role progressbar và nhãn “Đang tải nội dung”, tránh screen reader đọc từng hình chữ nhật.

Hook khởi tạo Reduce Motion là `true` để không phát animation trong khoảng thời gian bất đồng bộ trước khi đọc xong preference hệ điều hành. Nếu preference tắt, pulse mới bắt đầu.

## Phạm vi sử dụng

- Dùng cho lần tải dữ liệu đầu tiên khi bố cục có thể dự đoán.
- Không dùng cho submit/mutation; các thao tác đó giữ nội dung hiện tại và dùng pending cục bộ.
- Không mô phỏng dữ liệu thật quá chi tiết hoặc tạo skeleton dài vô hạn.

## Lỗi thực tế và cách khắc phục

Lệnh `npm run typecheck` thành công, nhưng `npm run lint` báo `react-hooks/refs: Cannot access refs during render` tại biểu thức `useRef(new Animated.Value(0.72)).current`. Đây là lỗi do React Compiler/rule của React 19 coi việc đọc `.current` trong render là không an toàn; nó không phải lỗi type của React Native nên TypeScript không phát hiện.

Giả thuyết được kiểm tra bằng cách đối chiếu chính dòng lint chỉ ra: animation chưa chạy và lỗi xuất hiện trước bước export, nên không liên quan native driver hay Metro. Đã đổi sang lazy `useState(() => new Animated.Value(0.72))`. Lazy initializer chỉ chạy khi component khởi tạo, còn object `Animated.Value` vẫn giữ nguyên giữa các render mà không đọc ref trong render. Sau sửa, typecheck, lint và diff-check phải cùng thành công mới coi lỗi đã được xử lý.

## Kiểm tra còn thiếu

- Cần kiểm tra thay đổi Reduce Motion trong lúc app đang chạy trên Android/iOS.
- Cần ghép skeleton thành layout cụ thể trong từng màn thật.

## Defense Q&A

**Vì sao skeleton riêng lẻ bị ẩn khỏi screen reader?**

Vì các khối chỉ biểu diễn hình dạng, không mang dữ liệu. Đọc từng khối sẽ tạo tiếng ồn; group mới mang thông tin “đang tải”.

**Vì sao dùng native driver?**

Opacity được native driver hỗ trợ, nên animation có thể tiếp tục mượt mà ngay cả khi JavaScript thread bận.
