import { Pressable, StyleSheet, Text, View } from "react-native";

import type { RegistrationMethod } from "@/features/registration/domain/registration-form";
import { useAppTheme } from "@/shared/theme/use-app-theme";

type RegistrationMethodSelectorProps = Readonly<{
  disabled?: boolean;
  onChange: (method: RegistrationMethod) => void;
  value: RegistrationMethod;
}>;

const options: readonly Readonly<{
  label: string;
  value: RegistrationMethod;
}>[] = [
  { label: "Email", value: "email" },
  { label: "Số điện thoại", value: "phone" },
];

export function RegistrationMethodSelector({
  disabled = false,
  onChange,
  value,
}: RegistrationMethodSelectorProps) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        style={[theme.typography.label, { color: theme.colors.textPrimary }]}
      >
        Đăng ký bằng
      </Text>
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
            gap: theme.spacing.xs,
            padding: theme.spacing.xs,
          },
        ]}
      >
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              role="radio"
              aria-checked={selected}
              aria-disabled={disabled}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: selected
                    ? theme.colors.surfaceRaised
                    : "transparent",
                  borderColor: selected ? theme.colors.brand : "transparent",
                  borderRadius: theme.radii.md,
                  borderWidth: theme.borderWidths.default,
                  minHeight: theme.sizes.touchTarget,
                  opacity: disabled
                    ? theme.opacity.disabled
                    : pressed
                      ? theme.opacity.pressed
                      : theme.opacity.visible,
                  paddingHorizontal: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.bodyStrong,
                  {
                    color: selected
                      ? theme.colors.brandEmphasis
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    width: "100%",
  },
  option: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
