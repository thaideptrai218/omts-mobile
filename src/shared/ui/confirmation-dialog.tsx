import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useReducedMotion } from "@/shared/accessibility/use-reduced-motion";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";

export type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  description: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  testID?: string;
  title: string;
  visible: boolean;
};

export function ConfirmationDialog({
  cancelLabel = "Hủy",
  confirmLabel,
  confirmVariant = "primary",
  description,
  isConfirming = false,
  onCancel,
  onConfirm,
  testID,
  title,
  visible,
}: ConfirmationDialogProps) {
  const theme = useAppTheme();
  const reduceMotion = useReducedMotion();

  const requestClose = () => {
    if (!isConfirming) {
      onCancel();
    }
  };

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      hardwareAccelerated
      onRequestClose={requestClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme.colors.overlay,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <Pressable
          accessibilityElementsHidden
          accessible={false}
          disabled={isConfirming}
          importantForAccessibility="no-hide-descendants"
          onPress={requestClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          accessibilityViewIsModal
          onAccessibilityEscape={requestClose}
          style={[
            styles.dialog,
            theme.elevation.overlay,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.lg,
              borderWidth: theme.borderWidths.default,
              gap: theme.spacing.lg,
              padding: theme.spacing.lg,
              shadowColor: theme.colors.shadow,
            },
          ]}
          testID={testID}
        >
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            <AppButton
              label={confirmLabel}
              loading={isConfirming}
              onPress={onConfirm}
              variant={confirmVariant}
            />
            <AppButton
              disabled={isConfirming}
              label={cancelLabel}
              onPress={onCancel}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 440,
    width: "100%",
  },
  overlay: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
