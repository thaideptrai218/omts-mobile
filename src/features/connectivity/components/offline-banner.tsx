import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useConnectivity } from "@/features/connectivity/state/connectivity-provider";
import { resolveMessage } from "@/shared/messages/message-catalog";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { MessageBanner } from "@/shared/ui/message-banner";

export function OfflineBanner() {
  const { status } = useConnectivity();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  if (status !== "offline") return null;

  const content = resolveMessage("MSG07");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.warningSurface,
          paddingTop: insets.top,
        },
      ]}
    >
      <MessageBanner
        accessibilityLiveRegion="assertive"
        accessibilityRole="alert"
        message={content.message}
        style={[
          styles.banner,
          {
            borderBottomColor: theme.colors.warning,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderRadius: theme.radii.none,
          },
        ]}
        title={content.title}
        variant={content.severity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 0,
  },
  container: {
    width: "100%",
  },
});
