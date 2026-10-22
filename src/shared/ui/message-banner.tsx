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

export type MessageBannerVariant = "info" | "success" | "warning" | "danger";

export type MessageBannerProps = Omit<ViewProps, "children" | "style"> & {
  message: string;
  style?: StyleProp<ViewStyle>;
  title?: string;
  variant?: MessageBannerVariant;
};

type BannerPalette = {
  accent: string;
  background: string;
  foreground: string;
  statusLabel: string;
};

function getBannerPalette(
  theme: AppTheme,
  variant: MessageBannerVariant,
): BannerPalette {
  switch (variant) {
    case "success":
      return {
        accent: theme.colors.success,
        background: theme.colors.successSurface,
        foreground: theme.colors.onSuccessSurface,
        statusLabel: "Thành công",
      };
    case "warning":
      return {
        accent: theme.colors.warning,
        background: theme.colors.warningSurface,
        foreground: theme.colors.onWarningSurface,
        statusLabel: "Cần lưu ý",
      };
    case "danger":
      return {
        accent: theme.colors.danger,
        background: theme.colors.dangerSurface,
        foreground: theme.colors.onDangerSurface,
        statusLabel: "Có lỗi xảy ra",
      };
    case "info":
    default:
      return {
        accent: theme.colors.info,
        background: theme.colors.infoSurface,
        foreground: theme.colors.onInfoSurface,
        statusLabel: "Thông tin",
      };
  }
}

export function MessageBanner({
  accessibilityLabel,
  accessibilityLiveRegion,
  accessibilityRole,
  message,
  style,
  title,
  variant = "info",
  ...viewProps
}: MessageBannerProps) {
  const theme = useAppTheme();
  const palette = getBannerPalette(theme, variant);
  const visibleTitle = title ?? palette.statusLabel;

  return (
    <View
      {...viewProps}
      accessibilityLabel={
        accessibilityLabel ?? `${visibleTitle}. ${message}`
      }
      accessibilityLiveRegion={
        accessibilityLiveRegion ??
        (variant === "danger" ? "assertive" : "polite")
      }
      accessibilityRole={
        accessibilityRole ?? (variant === "danger" ? "alert" : undefined)
      }
      accessible
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          borderColor: palette.accent,
          borderRadius: theme.radii.md,
          borderWidth: theme.borderWidths.default,
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
        },
        style,
      ]}
    >
      <View
        accessible={false}
        style={[
          styles.accent,
          {
            backgroundColor: palette.accent,
            borderRadius: theme.radii.pill,
          },
        ]}
      />

      <View accessible={false} style={styles.content}>
        <Text
          style={[theme.typography.label, { color: palette.foreground }]}
        >
          {visibleTitle}
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: palette.foreground, marginTop: theme.spacing.xxs },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    alignSelf: "stretch",
    width: 4,
  },
  container: {
    alignItems: "stretch",
    flexDirection: "row",
    width: "100%",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
});
