import { forwardRef, useId, useState, type ReactNode } from "react";
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useAppTheme } from "@/shared/theme/use-app-theme";

export type TextFieldProps = Omit<TextInputProps, "style"> & {
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  errorMessage?: string;
  helperText?: string;
  trailingContent?: ReactNode;
  inputStyle?: StyleProp<TextStyle>;
  label: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      accessibilityHint,
      accessibilityLabel,
      containerStyle,
      disabled = false,
      editable = true,
      errorMessage,
      helperText,
      inputStyle,
      label,
      multiline = false,
      nativeID,
      onBlur,
      onFocus,
      placeholderTextColor,
      readOnly = false,
      trailingContent,
      ...inputProps
    },
    ref,
  ) {
    const generatedId = useId().replaceAll(":", "");
    const [isFocused, setIsFocused] = useState(false);
    const theme = useAppTheme();

    const inputId = nativeID ?? `text-field-${generatedId}`;
    const labelId = `${inputId}-label`;
    const supportMessage = errorMessage ?? helperText;
    const isEditable = editable && !disabled && !readOnly;
    const isDisabled = !isEditable;

    const borderColor = isDisabled
      ? theme.colors.border
      : errorMessage
        ? theme.colors.danger
        : isFocused
          ? theme.colors.focus
          : theme.colors.borderStrong;

    return (
      <View style={[styles.container, containerStyle]}>
        <Text
          nativeID={labelId}
          style={[
            theme.typography.label,
            {
              color: isDisabled
                ? theme.colors.textMuted
                : theme.colors.textPrimary,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>

        <View
          style={[
            styles.inputFrame,
            {
              alignItems: multiline ? "flex-start" : "center",
              backgroundColor: isDisabled
                ? theme.colors.surfaceMuted
                : theme.colors.surface,
              borderColor,
              borderRadius: theme.radii.md,
              borderWidth:
                isFocused || errorMessage
                  ? theme.borderWidths.emphasis
                  : theme.borderWidths.default,
              minHeight: theme.sizes.fieldHeight,
            },
          ]}
        >
          <TextInput
            {...inputProps}
            accessibilityHint={
              errorMessage ?? accessibilityHint ?? helperText ?? undefined
            }
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityLabelledBy={labelId}
            accessibilityState={{ disabled: isDisabled }}
            editable={isEditable}
            multiline={multiline}
            nativeID={inputId}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={
              placeholderTextColor ?? theme.colors.textMuted
            }
            readOnly={readOnly}
            ref={ref}
            selectionColor={theme.colors.brand}
            style={[
              styles.input,
              theme.typography.body,
              {
                color: isDisabled
                  ? theme.colors.onDisabled
                  : theme.colors.textPrimary,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                textAlignVertical: multiline ? "top" : "center",
              },
              inputStyle,
            ]}
            underlineColorAndroid="transparent"
          />

          {trailingContent ? (
            <View style={styles.trailingContent}>{trailingContent}</View>
          ) : null}
        </View>

        {supportMessage ? (
          <Text
            accessibilityLiveRegion={errorMessage ? "polite" : "none"}
            style={[
              theme.typography.caption,
              {
                color: errorMessage
                  ? theme.colors.danger
                  : theme.colors.textSecondary,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {supportMessage}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    alignSelf: "stretch",
    flex: 1,
    minWidth: 0,
  },
  inputFrame: {
    flexDirection: "row",
    width: "100%",
  },
  trailingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
