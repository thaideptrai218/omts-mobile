import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/shared/theme/use-app-theme";
import { ScreenContainer } from "@/shared/ui/screen-container";

const rootScreenEdges = ["bottom", "left", "right"] as const;

export default function Index() {
  const theme = useAppTheme();

  return (
    <ScreenContainer
      contentStyle={styles.container}
      edges={rootScreenEdges}
    >
      <View
        style={[
          styles.brandMark,
          {
            backgroundColor: theme.colors.brand,
            borderRadius: theme.radii.lg,
            height: theme.sizes.brandMark,
            marginBottom: theme.spacing.lg,
            width: theme.sizes.brandMark,
          },
        ]}
      >
        <Text
          accessibilityLabel="OMTS"
          style={[
            styles.brandText,
            theme.typography.heading,
            { color: theme.colors.onBrand },
          ]}
        >
          O
        </Text>
      </View>

      <Text
        style={[
          theme.typography.title,
          {
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm,
            maxWidth: theme.sizes.contentMaxWidth,
          },
        ]}
      >
        Quản lý vùng nuôi ngay tại hiện trường
      </Text>
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textSecondary,
            maxWidth: theme.sizes.contentMaxWidth,
          },
        ]}
      >
        OMTS giúp công việc hằng ngày rõ ràng, dễ theo dõi và phù hợp khi
        kết nối mạng không ổn định.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    flex: 1,
    justifyContent: "center",
  },
  brandMark: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    textAlign: "center",
  },
});
