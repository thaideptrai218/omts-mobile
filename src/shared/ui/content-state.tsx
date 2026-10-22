import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { AppButton, type ButtonVariant } from "@/shared/ui/app-button";
import type { AppTheme } from "@/shared/theme/theme";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export type ContentStateVariant = "empty" | "error" | "permissionDenied";

type ContentStateAction =
  | {
      actionLabel: string;
      actionLoading?: boolean;
      onAction: () => void;
    }
  | {
      actionLabel?: never;
      actionLoading?: never;
      onAction?: never;
    };

export type ContentStateProps = Omit<ViewProps, "children" | "style"> &
  ContentStateAction & {
    description: string;
    style?: StyleProp<ViewStyle>;
    title: string;
    variant?: ContentStateVariant;
  };

type StatePresentation = {
  actionVariant: ButtonVariant;
  background: string;
  foreground: string;
  marker: string;
};

function getStatePresentation(
  theme: AppTheme,
  variant: ContentStateVariant,
): StatePresentation {
  switch (variant) {
    case "error":
      return {
        actionVariant: "secondary",
        background: theme.colors.dangerSurface,
        foreground: theme.colors.onDangerSurface,
        marker: "!",
      };
    case "permissionDenied":
      return {
        actionVariant: "secondary",
        background: theme.colors.warningSurface,
        foreground: theme.colors.onWarningSurface,
        marker: "i",
      };
    case "empty":
    default:
      return {
        actionVariant: "primary",
        background: theme.colors.surfaceMuted,
        foreground: theme.colors.textSecondary,
        marker: "—",
      };
  }
}

export function ContentState({
  actionLabel,
  actionLoading = false,
  description,
  onAction,
  style,
  title,
  variant = "empty",
  ...viewProps
}: ContentStateProps) {
  const theme = useAppTheme();
  const presentation = getStatePresentation(theme, variant);

  return (
    <View
      {...viewProps}
      style={[
        styles.container,
        { gap: theme.spacing.md, padding: theme.spacing.lg },
        style,
      ]}
    >
      <View
        accessible={false}
        style={[
          styles.marker,
          {
            backgroundColor: presentation.background,
            borderRadius: theme.radii.pill,
            minHeight: theme.sizes.touchTarget,
            minWidth: theme.sizes.touchTarget,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.heading,
            { color: presentation.foreground },
          ]}
        >
          {presentation.marker}
        </Text>
      </View>

      <View style={[styles.copy, { gap: theme.spacing.xs }]}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.heading, { color: theme.colors.textPrimary }]}
        >
          {title}
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: "center" },
          ]}
        >
          {description}
        </Text>
      </View>

      {actionLabel && onAction ? (
        <AppButton
          containerStyle={styles.action}
          fullWidth={false}
          label={actionLabel}
          loading={actionLoading}
          onPress={onAction}
          variant={presentation.actionVariant}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    minWidth: 160,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  copy: {
    alignItems: "center",
    maxWidth: 400,
  },
  marker: {
    alignItems: "center",
    justifyContent: "center",
  },
});
