import type {
  SessionCredential,
  SessionCredentialRepository,
} from "@/features/session/domain/mobile-session";

/** Mock-only, process-lifetime storage. No real token or password is persisted. */
export function createMemorySessionCredentials(): SessionCredentialRepository {
  let credential: SessionCredential | null = null;
  return {
    read: async () => credential,
    save: async (next) => {
      credential = next;
    },
    clear: async () => {
      credential = null;
    },
  };
}
