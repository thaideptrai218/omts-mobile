import { ReactNode } from "react";
import { Button, Sheet } from "zmp-ui";
/**
 * Hỏi lại trước thao tác không hoàn tác được. Hai nút lớn xếp dọc, luôn có nút quay lại; `danger` tô đỏ nút xác nhận.
 * Khi `busy` thì khóa cả hai nút và không cho đóng sheet, để người dùng thấy thao tác đang chạy.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmText,
  cancelText = "Không, quay lại",
  danger = false,
  busy = false,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: ReactNode;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title={title}>
      <div className="sheet-form form">
        <div className="form__intro">{message}</div>
        <div className="sheet-actions">
          <Button fullWidth size="large" type={danger ? "danger" : undefined} loading={busy} disabled={busy} onClick={onConfirm}>
            {confirmText}
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onClose}>
            {cancelText}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
