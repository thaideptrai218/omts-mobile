import { forwardRef, useState } from "react";
import type { TextInput } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/shared/theme/use-app-theme";
import { TextField, type TextFieldProps } from "@/shared/ui/text-field";

export type PasswordFieldProps = Omit<
  TextFieldProps,
  "multiline" | "secureTextEntry" | "trailingContent"
>;

export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordField(
    {
      autoCapitalize = "none",
      autoCorrect = false,
      disabled = false,
      editable = true,
      readOnly = false,
      spellCheck = false,
      ...fieldProps
    },
    ref,
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const theme = useAppTheme();

    const isDisabled = disabled || !editable || readOnly;
    const toggleLabel = isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu";

    return (
      <TextField
        {...fieldProps}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        disabled={disabled}
        editable={editable}
        readOnly={readOnly}
        ref={ref}
        secureTextEntry={!isVisible}
        spellCheck={spellCheck}
        trailingContent={
          <Pressable
            accessibilityLabel={toggleLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled }}
            disabled={isDisabled}
            onPress={() => setIsVisible((current) => !current)}
            style={({ pressed }) => [
              styles.toggle,
              {
                minHeight: theme.sizes.touchTarget,
                minWidth: theme.sizes.touchTarget,
                opacity: isDisabled
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
                theme.typography.label,
                {
                  color: isDisabled
                    ? theme.colors.onDisabled
                    : theme.colors.brand,
                },
              ]}
            >
              {isVisible ? "Ẩn" : "Hiện"}
            </Text>
          </Pressable>
        }
      />
    );
  },
);

const styles = StyleSheet.create({
  toggle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
