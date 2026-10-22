import { useId, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import {
  normalizeVerificationCode,
  verificationCodeLength,
} from "@/features/verification/domain/verification-code";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export type VerificationCodeFieldProps = Omit<
  TextInputProps,
  | "autoComplete"
  | "inputMode"
  | "keyboardType"
  | "maxLength"
  | "onChangeText"
  | "secureTextEntry"
  | "style"
  | "textContentType"
  | "value"
> & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  errorMessage?: string;
  label?: string;
  onChangeCode: (code: string) => void;
  value: string;
};

export function VerificationCodeField({
  accessibilityHint,
  accessibilityLabel,
  containerStyle,
  disabled = false,
  editable = true,
  errorMessage,
  label = "Mã xác minh",
  nativeID,
  onBlur,
  onChangeCode,
  onFocus,
  readOnly = false,
  value,
  ...inputProps
}: VerificationCodeFieldProps) {
  const generatedId = useId().replaceAll(":", "");
  const [isFocused, setIsFocused] = useState(false);
  const theme = useAppTheme();

  const code = normalizeVerificationCode(value);
  const inputId = nativeID ?? `verification-code-${generatedId}`;
  const labelId = `${inputId}-label`;
  const isEditable = editable && !disabled && !readOnly;
  const activeIndex = Math.min(code.length, verificationCodeLength - 1);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        nativeID={labelId}
        style={[
          theme.typography.label,
          {
            color: isEditable
              ? theme.colors.textPrimary
              : theme.colors.textMuted,
            marginBottom: theme.spacing.xs,
          },
        ]}
      >
        {label}
      </Text>

      <View style={[styles.cells, { gap: theme.spacing.xs }]}>
        {Array.from({ length: verificationCodeLength }, (_, index) => {
          const isActive = isFocused && index === activeIndex;
          const digit = code[index] ?? "";

          return (
            <View
              aria-hidden
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: isEditable
                    ? theme.colors.surface
                    : theme.colors.surfaceMuted,
                  borderColor: errorMessage
                    ? theme.colors.danger
                    : isActive
                      ? theme.colors.focus
                      : theme.colors.borderStrong,
                  borderRadius: theme.radii.md,
                  borderWidth:
                    errorMessage || isActive
                      ? theme.borderWidths.emphasis
                      : theme.borderWidths.default,
                  minHeight: theme.sizes.fieldHeight,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.heading,
                  {
                    color: isEditable
                      ? theme.colors.textPrimary
                      : theme.colors.onDisabled,
                  },
                ]}
              >
                {digit}
              </Text>
            </View>
          );
        })}

        <TextInput
          {...inputProps}
          accessibilityHint={errorMessage ?? accessibilityHint}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityLabelledBy={labelId}
          accessibilityState={{ disabled: !isEditable }}
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
          autoCorrect={false}
          caretHidden
          editable={isEditable}
          importantForAutofill="yes"
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={verificationCodeLength}
          nativeID={inputId}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onChangeText={(nextValue) => {
            onChangeCode(normalizeVerificationCode(nextValue));
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          readOnly={readOnly}
          selectionColor="transparent"
          style={[StyleSheet.absoluteFill, styles.input]}
          textContentType="oneTimeCode"
          value={code}
        />
      </View>

      {errorMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            theme.typography.caption,
            { color: theme.colors.danger, marginTop: theme.spacing.xs },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  cells: {
    flexDirection: "row",
    position: "relative",
    width: "100%",
  },
  container: {
    width: "100%",
  },
  input: {
    backgroundColor: "transparent",
    color: "transparent",
    opacity: 0.02,
  },
});
