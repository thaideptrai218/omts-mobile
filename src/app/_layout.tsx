import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { OfflineBanner } from "@/features/connectivity/components/offline-banner";
import {
  ConnectivityProvider,
  useConnectivity,
} from "@/features/connectivity/state/connectivity-provider";
import {
  MobileSessionProvider,
  useMobileSession,
} from "@/features/session/state/mobile-session-provider";
import { useAppTheme } from "@/shared/theme/use-app-theme";

function SessionNavigator() {
  const theme = useAppTheme();
  const { snapshot, store } = useMobileSession();
  const insets = useSafeAreaInsets();
  const { status } = useConnectivity();
  const active = snapshot.status === "active" ? snapshot.session : null;
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <OfflineBanner />
      {store ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            textAlign: "center",
            padding: 4,
            paddingTop: status === "offline" ? 4 : insets.top + 4,
          }}
        >
          Dữ liệu trải nghiệm
        </Text>
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Protected guard={snapshot.status === "signedOut"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!active && active.nextAction !== "ready"}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={active?.nextAction === "ready"}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const theme = useAppTheme();
  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <MobileSessionProvider>
          <StatusBar style={theme.colorScheme === "dark" ? "light" : "dark"} />
          <SessionNavigator />
        </MobileSessionProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
