import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { useConnectivity } from "@/features/connectivity/state/connectivity-provider";
import { createMemorySessionCredentials } from "../adapters/memory-session-credentials";
import { createMockSessionGateway } from "../adapters/mock-session-gateway";
import {
  createRegistrationFlowService,
  type RegistrationFlowService,
} from "@/features/registration/services/registration-flow-service";
import type { ProfileGateway } from "@/features/profile/services/profile-gateway";
import type { ContactChangeGateway } from "@/features/profile/services/contact-change-gateway";
import type { NotificationPreferencesGateway } from "@/features/notifications/services/notification-preferences-gateway";
import {
  createRecoveryFlowService,
  type RecoveryFlowService,
} from "@/features/recovery/services/recovery-flow-service";
import {
  createMobileSessionStore,
  type MobileSessionStore,
  type SessionSnapshot,
} from "./mobile-session-store";

const unavailable: SessionSnapshot = {
  status: "error",
  reason: "unavailable",
  operation: "bootstrap",
};
const noopSubscribe = () => () => undefined;
const unavailableSnapshot = () => unavailable;
const SessionContext = createContext<{
  store: MobileSessionStore | null;
  snapshot: SessionSnapshot;
  profileGateway: ProfileGateway | null;
  contactChangeGateway: ContactChangeGateway | null;
  notificationGateway: NotificationPreferencesGateway | null;
  createRecoveryFlow: (() => RecoveryFlowService) | null;
  createRegistrationFlow: (() => RegistrationFlowService) | null;
} | null>(null);

export type SessionRuntime = {
  store: MobileSessionStore;
  setOffline: (value: boolean) => void;
  profileGateway?: ProfileGateway;
  contactChangeGateway?: ContactChangeGateway;
  notificationGateway?: NotificationPreferencesGateway;
  createRecoveryFlow?: () => RecoveryFlowService;
  createRegistrationFlow?: () => RegistrationFlowService;
};

function createRuntime(): SessionRuntime | null {
  // Explicit opt-in only. Never silently use a mock when API mode fails.
  if (process.env.EXPO_PUBLIC_AUTH_MODE !== "mock") return null;
  const {
    gateway,
    profileGateway,
    contactChangeGateway,
    notificationGateway,
    recoveryGateway,
    registrationGateway,
  } = createMockSessionGateway();
  let offline = false;
  const store = createMobileSessionStore({
    gateway,
    repository: createMemorySessionCredentials(),
    isOffline: () => offline,
  });
  return {
    store,
    profileGateway,
    contactChangeGateway,
    notificationGateway,
    createRegistrationFlow: () =>
      createRegistrationFlowService(registrationGateway, () => offline),
    createRecoveryFlow: () =>
      createRecoveryFlowService(recoveryGateway, () => offline),
    setOffline: (value: boolean) => {
      offline = value;
    },
  };
}

export function MobileSessionProvider({
  children,
  runtimeFactory = createRuntime,
}: PropsWithChildren<{
  runtimeFactory?: () => SessionRuntime | null;
}>) {
  const { status } = useConnectivity();
  const [runtime] = useState(runtimeFactory);
  const store = runtime?.store ?? null;
  const snapshot = useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getSnapshot ?? unavailableSnapshot,
    store?.getSnapshot ?? unavailableSnapshot,
  );

  useEffect(() => {
    runtime?.setOffline(status === "offline");
  }, [runtime, status]);
  useEffect(() => {
    void store?.bootstrap();
  }, [store]);
  useEffect(() => {
    if (status === "online" && store?.getSnapshot().status === "error") {
      const current = store.getSnapshot();
      if (current.status === "error" && current.operation === "bootstrap")
        void store.bootstrap();
    }
  }, [status, store]);

  return (
    <SessionContext.Provider
      value={{
        store,
        snapshot,
        profileGateway: runtime?.profileGateway ?? null,
        contactChangeGateway: runtime?.contactChangeGateway ?? null,
        notificationGateway: runtime?.notificationGateway ?? null,
        createRecoveryFlow: runtime?.createRecoveryFlow ?? null,
        createRegistrationFlow: runtime?.createRegistrationFlow ?? null,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useMobileSession() {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useMobileSession requires MobileSessionProvider");
  return context;
}
