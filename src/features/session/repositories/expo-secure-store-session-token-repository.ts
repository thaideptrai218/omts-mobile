import * as SecureStore from "expo-secure-store";

import {
  parseSessionTokenBundle,
  type SessionTokenBundle,
} from "@/features/session/domain/session-token-bundle";
import type { SessionTokenRepository } from "@/features/session/repositories/session-token-repository";

const sessionTokenStorageKey = "omts.auth.tokens.v1";

type SecureStoreGateway = Pick<
  typeof SecureStore,
  "deleteItemAsync" | "getItemAsync" | "setItemAsync"
>;

type StoredSessionTokenEnvelope = Readonly<{
  schemaVersion: 1;
  tokens: SessionTokenBundle;
}>;

export class InvalidStoredSessionError extends Error {
  constructor() {
    super("Stored session token payload is invalid.");
    this.name = "InvalidStoredSessionError";
  }
}

export function createExpoSecureStoreSessionTokenRepository(
  secureStore: SecureStoreGateway = SecureStore,
): SessionTokenRepository {
  return {
    clear: () => secureStore.deleteItemAsync(sessionTokenStorageKey),

    async read() {
      const serialized = await secureStore.getItemAsync(sessionTokenStorageKey);
      if (serialized === null) return null;

      let parsed: unknown;
      try {
        parsed = JSON.parse(serialized) as unknown;
      } catch {
        throw new InvalidStoredSessionError();
      }

      const envelope =
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null;
      const tokens =
        envelope?.schemaVersion === 1
          ? parseSessionTokenBundle(envelope.tokens)
          : null;

      if (!tokens) throw new InvalidStoredSessionError();
      return tokens;
    },

    save(tokens) {
      const envelope: StoredSessionTokenEnvelope = {
        schemaVersion: 1,
        tokens,
      };

      return secureStore.setItemAsync(
        sessionTokenStorageKey,
        JSON.stringify(envelope),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
      );
    },
  };
}
