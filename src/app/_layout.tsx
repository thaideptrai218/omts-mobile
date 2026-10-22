import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "@/features/connectivity/components/offline-banner";
import { ConnectivityProvider } from "@/features/connectivity/state/connectivity-provider";
import { useAppTheme } from "@/shared/theme/use-app-theme";

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <StatusBar style={theme.colorScheme === "dark" ? "light" : "dark"} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <OfflineBanner />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: theme.colors.background },
              headerShadowVisible: false,
              headerStyle: { backgroundColor: theme.colors.surface },
              headerTintColor: theme.colors.textPrimary,
              headerTitle: "OMTS",
            }}
          />
        </View>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
