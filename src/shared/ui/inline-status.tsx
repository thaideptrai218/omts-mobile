import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import type { AppTheme } from "@/shared/theme/theme";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export type InlineStatusVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type InlineStatusProps = Omit<ViewProps, "children" | "style"> & {
  announce?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  variant?: InlineStatusVariant;
};

type StatusPalette = {
  accent: string;
  background: string;
  foreground: string;
};

function getStatusPalette(
  theme: AppTheme,
  variant: InlineStatusVariant,
): StatusPalette {
  switch (variant) {
    case "info":
      return {
        accent: theme.colors.info,
        background: theme.colors.infoSurface,
        foreground: theme.colors.onInfoSurface,
      };
    case "success":
      return {
        accent: theme.colors.success,
        background: theme.colors.successSurface,
        foreground: theme.colors.onSuccessSurface,
      };
    case "warning":
      return {
        accent: theme.colors.warning,
        background: theme.colors.warningSurface,
        foreground: theme.colors.onWarningSurface,
      };
    case "danger":
      return {
        accent: theme.colors.danger,
        background: theme.colors.dangerSurface,
        foreground: theme.colors.onDangerSurface,
      };
    case "neutral":
    default:
      return {
        accent: theme.colors.textMuted,
        background: theme.colors.surfaceMuted,
        foreground: theme.colors.textPrimary,
      };
  }
}

export function InlineStatus({
  accessibilityLabel,
  announce = false,
  label,
  style,
  variant = "neutral",
  ...viewProps
}: InlineStatusProps) {
  const theme = useAppTheme();
  const palette = getStatusPalette(theme, variant);

  return (
    <View
      {...viewProps}
      accessibilityLabel={accessibilityLabel ?? `Trạng thái: ${label}`}
      accessibilityLiveRegion={announce ? "polite" : "none"}
      accessible
      style={[
        styles.container,
        {
          alignSelf: "flex-start",
          backgroundColor: palette.background,
          borderRadius: theme.radii.pill,
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        },
        style,
      ]}
    >
      <View
        accessible={false}
        style={[styles.dot, { backgroundColor: palette.accent }]}
      />
      <Text style={[theme.typography.caption, { color: palette.foreground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
