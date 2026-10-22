import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";

import { useAppTheme } from "@/shared/theme/use-app-theme";

const allEdges: Edges = ["top", "right", "bottom", "left"];

type ScreenContainerProps = PropsWithChildren<{
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edges;
  padded?: boolean;
  testID?: string;
}>;

export function ScreenContainer({
  children,
  contentStyle,
  edges = allEdges,
  padded = true,
  testID,
}: ScreenContainerProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.content,
          {
            maxWidth: theme.sizes.contentMaxWidth,
            paddingHorizontal: padded ? theme.spacing.lg : theme.spacing.none,
            paddingVertical: padded ? theme.spacing.lg : theme.spacing.none,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    flex: 1,
    width: "100%",
  },
  safeArea: {
    flex: 1,
  },
});
