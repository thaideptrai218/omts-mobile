import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import { ConfirmationDialog } from "@/shared/ui/confirmation-dialog";

type LogoutConfirmationDialogProps = Readonly<{
  confirming: boolean;
  connectivity: ConnectivityStatus;
  onCancel: () => void;
  onConfirm: (connectivity: ConnectivityStatus) => void;
  visible: boolean;
}>;

export function LogoutConfirmationDialog({
  confirming,
  connectivity,
  onCancel,
  onConfirm,
  visible,
}: LogoutConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      confirmLabel="Đăng xuất"
      confirmVariant="danger"
      description="Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng OMTS trên thiết bị này."
      isConfirming={confirming}
      onCancel={onCancel}
      onConfirm={() => onConfirm(connectivity)}
      testID="logout-confirmation-dialog"
      title="Xác nhận đăng xuất"
      visible={visible}
    />
  );
}
