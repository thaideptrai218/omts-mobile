import { router } from "expo-router";
import { Text, View } from "react-native";
import { useAppTheme } from "@/shared/theme/use-app-theme";
import { AppButton } from "@/shared/ui/app-button";
import { useMobileSession } from "../state/mobile-session-provider";
import { SessionPage } from "../components/session-page";
import { SessionLogoutAction } from "../components/session-logout-action";

export function SessionAccountScreen() {
  const { snapshot } = useMobileSession();
  const theme = useAppTheme();
  if (snapshot.status !== "active" || snapshot.session.nextAction !== "ready")
    return null;
  const { session } = snapshot;
  return (
    <SessionPage
      title={session.displayName}
      description={`@${session.username}`}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Text
          accessibilityRole="header"
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary },
          ]}
        >
          Phân công của bạn
        </Text>
        {session.grants.map((grant) => (
          <View
            key={`${grant.zoneName}:${grant.roleName}`}
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              padding: theme.spacing.md,
              borderRadius: theme.radii.lg,
              gap: theme.spacing.xs,
            }}
          >
            <Text
              style={[
                theme.typography.bodyStrong,
                { color: theme.colors.textPrimary },
              ]}
            >
              {grant.roleName}
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary },
              ]}
            >
              {grant.zoneName}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: theme.spacing.sm }}>
        <Text
          accessibilityRole="header"
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary },
          ]}
        >
          Thông tin liên hệ
        </Text>
        {session.contacts.map((contact) => (
          <Text
            key={contact.channel}
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary },
            ]}
          >
            {contact.channel === "email" ? "Email" : "Điện thoại"}:{" "}
            {contact.maskedRecipient}
            {"\n"}
            {contact.verified ? "Đã xác minh" : "Chưa xác minh"}
          </Text>
        ))}
      </View>
      <AppButton
        label="Đổi mật khẩu"
        variant="secondary"
        onPress={() => router.push("/security")}
      />
      <SessionLogoutAction />
    </SessionPage>
  );
}
