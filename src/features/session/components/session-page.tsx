import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { ScreenContainer } from "@/shared/ui/screen-container";
import { KeyboardSafeForm } from "@/shared/ui/keyboard-safe-form";

export function SessionPage({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  const theme = useAppTheme();
  return (
    <ScreenContainer padded={false}>
      <KeyboardSafeForm>
        <View
          style={{
            backgroundColor: theme.colors.surfaceRaised,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radii.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
        >
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={[theme.typography.label, { color: theme.colors.brand }]}
            >
              OMTS
            </Text>
            <Text
              accessibilityRole="header"
              style={[
                theme.typography.title,
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
          {children}
        </View>
      </KeyboardSafeForm>
    </ScreenContainer>
  );
}
