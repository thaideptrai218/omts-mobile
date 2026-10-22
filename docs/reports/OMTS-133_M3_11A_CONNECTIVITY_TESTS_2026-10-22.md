# OMTS-133 — M3.11a connectivity behavior tests

## Kết quả

Đã bổ sung 8 test cho domain connectivity, provider lifecycle và global offline banner. `ConnectivityProvider` nhận một source tùy chọn để test dependency injection; production vẫn mặc định dùng singleton Expo Network service.

## Các hành vi đã chứng minh

- snapshot có bằng chứng mất kết nối thành `offline`;
- snapshot có bằng chứng kết nối thành `online`;
- thiếu cả hai bằng chứng giữ `unknown`;
- khi hai field mâu thuẫn, bằng chứng offline thắng để tránh gửi mutation khi Internet không reachable;
- live listener update không bị initial async lookup cũ ghi đè;
- unsubscribe được gọi khi provider unmount;
- MSG07 banner xuất hiện với alert semantics khi offline;
- online không hiển thị offline alert.

## Vì sao inject service qua prop

Provider trước đây import singleton trực tiếp nên test phải mock module toàn cục. Prop `service` có default production giữ API sử dụng hiện tại, đồng thời cho test truyền fake source có kiểm soát. Đây là dependency injection ở ranh giới provider, không đưa repository/native module vào UI.

## Phạm vi chưa làm

- Chưa test Expo Network adapter trên thiết bị thật.
- Chưa chứng minh thay đổi Wi-Fi/4G/airplane mode thực tế.
- Chưa có local offline reason cho từng mutation vì các màn mutation chưa xây.
- Không có queue/sync/conflict behavior và test không giả định các chức năng đó.

## Defense Q&A

**Vì sao live update phải thắng initial lookup?**

Initial promise có thể hoàn thành muộn hơn event listener. Nếu ghi đè, app sẽ quay về trạng thái cũ dù thiết bị đã báo trạng thái mới hơn.

**Vì sao không coi unknown là offline?**

Unknown chỉ nói chưa có dữ liệu. Hiển thị mất mạng lúc khởi động sẽ là thông báo sai và có thể vô hiệu hóa thao tác không cần thiết.
