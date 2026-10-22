import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

import { useAppTheme } from "@/shared/theme/use-app-theme";

type KeyboardSafeFormProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
  testID?: string;
}>;

export function KeyboardSafeForm({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
  testID,
}: KeyboardSafeFormProps) {
  const theme = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ android: "height", ios: "padding" })}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: theme.sizes.contentMaxWidth,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
          },
          contentContainerStyle,
        ]}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    width: "100%",
  },
});
