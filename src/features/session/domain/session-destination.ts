import type { SessionSnapshot } from "./mobile-session";

export function sessionDestination(snapshot: SessionSnapshot) {
  if (snapshot.status === "signedOut") return "/login" as const;
  if (snapshot.status === "active") {
    return snapshot.session.nextAction === "ready"
      ? ("/account" as const)
      : ("/onboarding" as const);
  }
  return null;
}
