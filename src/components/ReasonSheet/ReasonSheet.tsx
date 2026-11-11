import { ReactNode, useEffect, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { FIELD, MESSAGES } from "@/constants/messages";
/**
 * Sheet xác nhận có ô lý do (ngừng dùng, khóa, hủy phiếu…). `required` thì bắt nhập lý do. `onConfirm` trả về
 * true khi thao tác thành công để đóng sheet. `danger` tô đỏ nút xác nhận cho thao tác không hoàn tác được.
 */
export function ReasonSheet({
  visible,
  title,
  intro,
  confirmText,
  required = false,
  maxLength = 500,
  busy,
  danger = false,
  onClose,
  onConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  intro?: string;
  confirmText: string;
  required?: boolean;
  maxLength?: number;
  busy: boolean;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Sheet dùng lại cho nhiều dòng: đóng là xóa chữ đang gõ, để lý do của dòng này không sang dòng khác.
  useEffect(() => {
    if (visible) return;
    setReason("");
    setError("");
  }, [visible]);

  const submit = async () => {
    const text = reason.trim();
    if (required && !text) {
      setError(MESSAGES.MSG01(FIELD.reason));
      return;
    }
    setError("");
    if (await onConfirm(text)) {
      setReason("");
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title={title}>
      <div className="sheet-form form">
        {intro && <p className="form__intro">{intro}</p>}
        {children}
        <Input.TextArea label={required ? "Lý do (bắt buộc)" : "Lý do (không bắt buộc)"} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={maxLength} showCount disabled={busy} />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" type={danger ? "danger" : undefined} loading={busy} disabled={busy} onClick={() => void submit()}>
            {confirmText}
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onClose}>
            Không, quay lại
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
