import { Button } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";

/**
 * Màn báo lỗi cuối cùng khi phần khung của app (router, thanh dưới, kiểm tra phiên) bị lỗi lúc vẽ. Nằm ngoài router nên
 * chỉ có nút tải lại app; lỗi của từng màn đã được `PageErrorBoundary` chặn trước, không tới đây.
 */
export function AppCrash() {
  return (
    <div className="screen app-crash" role="alert">
      <Empty
        icon="zi-warning-circle"
        title="Ứng dụng vừa gặp lỗi"
        text="Những gì đã lưu không bị ảnh hưởng. Bấm Tải lại app để mở lại."
        action={
          <Button fullWidth size="large" onClick={() => window.location.reload()}>
            Tải lại app
          </Button>
        }
      />
    </div>
  );
}
