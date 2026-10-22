import { View } from "react-native";
import { useMobileSession } from "../state/mobile-session-provider";
import { OnboardingContactController } from "../components/onboarding-contact-controller";
import { SessionPasswordController } from "../components/session-password-controller";
import { SessionLogoutAction } from "../components/session-logout-action";

export function OnboardingScreen() {
  const { snapshot } = useMobileSession();
  if (snapshot.status !== "active") return null;
  const { session } = snapshot;
  if (session.nextAction === "changePassword")
    return (
      <View style={{ flex: 1 }}>
        <SessionPasswordController forced />
        <SessionLogoutAction docked />
      </View>
    );
  if (session.nextAction === "verifyContact") {
    return (
      <OnboardingContactController key={session.accountId} session={session} />
    );
  }
  return null;
}
