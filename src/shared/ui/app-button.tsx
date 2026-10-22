import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { AppTheme } from "@/shared/theme/theme";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type AppButtonProps = Omit<
  PressableProps,
  "children" | "disabled" | "style"
> & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
};

type ButtonPalette = {
  background: string;
  border: string;
  foreground: string;
};

function getButtonPalette(
  theme: AppTheme,
  variant: ButtonVariant,
  disabled: boolean,
): ButtonPalette {
  if (disabled) {
    if (variant === "ghost") {
      return {
        background: "transparent",
        border: "transparent",
        foreground: theme.colors.onDisabled,
      };
    }

    return {
      background: theme.colors.disabled,
      border: theme.colors.disabled,
      foreground: theme.colors.onDisabled,
    };
  }

  switch (variant) {
    case "secondary":
      return {
        background: theme.colors.surface,
        border: theme.colors.brand,
        foreground: theme.colors.brand,
      };
    case "danger":
      return {
        background: theme.colors.danger,
        border: theme.colors.danger,
        foreground: theme.colors.onDanger,
      };
    case "ghost":
      return {
        background: "transparent",
        border: "transparent",
        foreground: theme.colors.brand,
      };
    case "primary":
    default:
      return {
        background: theme.colors.brand,
        border: theme.colors.brand,
        foreground: theme.colors.onBrand,
      };
  }
}

export function AppButton({
  accessibilityLabel,
  accessibilityState,
  containerStyle,
  disabled = false,
  fullWidth = true,
  label,
  loading = false,
  loadingLabel = "Đang xử lý",
  variant = "primary",
  ...pressableProps
}: AppButtonProps) {
  const theme = useAppTheme();
  const isUnavailable = disabled || loading;
  const palette = getButtonPalette(theme, variant, disabled);

  return (
    <Pressable
      {...pressableProps}
      accessibilityLabel={
        accessibilityLabel ?? (loading ? `${label}. ${loadingLabel}` : label)
      }
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isUnavailable,
      }}
      disabled={isUnavailable}
      style={({ pressed }) => [
        styles.button,
        {
          alignSelf: fullWidth ? "stretch" : "flex-start",
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderRadius: theme.radii.md,
          borderWidth: theme.borderWidths.default,
          minHeight: theme.sizes.buttonHeight,
          opacity:
            pressed && !isUnavailable
              ? theme.opacity.pressed
              : theme.opacity.visible,
          paddingHorizontal: theme.spacing.lg,
        },
        containerStyle,
      ]}
    >
      <View style={[styles.content, { gap: theme.spacing.xs }]}>
        {loading ? (
          <ActivityIndicator
            accessible={false}
            color={palette.foreground}
            size="small"
          />
        ) : null}
        <Text
          style={[
            theme.typography.bodyStrong,
            { color: palette.foreground, textAlign: "center" },
          ]}
        >
          {loading ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
});
