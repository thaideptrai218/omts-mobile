import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConnectivity } from "@/features/connectivity/state/connectivity-provider";
import { AppButton } from "@/shared/ui/app-button";
import { useMobileSession } from "../state/mobile-session-provider";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";

export function SessionLogoutAction({ docked = false }: { docked?: boolean }) {
  const { store } = useMobileSession();
  const { status } = useConnectivity();
  const [visible, setVisible] = useState(false);
  return (
    <SafeAreaView edges={docked ? ["bottom", "left", "right"] : []}>
      <AppButton
        label="Đăng xuất"
        variant="ghost"
        onPress={() => setVisible(true)}
      />
      <LogoutConfirmationDialog
        visible={visible}
        confirming={false}
        connectivity={status}
        onCancel={() => setVisible(false)}
        onConfirm={() => {
          setVisible(false);
          void store?.logout();
        }}
      />
    </SafeAreaView>
  );
}
