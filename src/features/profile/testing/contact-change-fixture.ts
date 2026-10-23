import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createContactChangeService } from "../services/contact-change-service";

export async function contactChangeFixture() {
  let time = 0;
  let offline = false;
  const server = createMockSessionGateway(() => time);
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository,
    isOffline: () => offline,
  });
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const scope = store.createAccountScope("mock-staff-ready");
  const service = createContactChangeService(
    scope,
    server.contactChangeGateway,
    server.profileGateway,
  );
  const profile = await service.load();
  const credential = await repository.read();
  if (!credential) throw new Error("Expected fixture credential");
  return {
    server,
    store,
    scope,
    service,
    profile,
    credential,
    input: {
      channel: "email" as const,
      identifier: "new.ha@example.invalid",
      expectedRevision: profile.revision,
    },
    advance: (ms: number) => {
      time += ms;
    },
    offline: (value: boolean) => {
      offline = value;
    },
  };
}
