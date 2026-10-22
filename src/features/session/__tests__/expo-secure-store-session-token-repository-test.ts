import * as SecureStore from "expo-secure-store";

import {
  createExpoSecureStoreSessionTokenRepository,
  InvalidStoredSessionError,
} from "@/features/session/repositories/expo-secure-store-session-token-repository";

const tokens = {
  accessToken: "access-token-for-test",
  accessTokenExpiresAt: "2026-10-22T12:15:00.000Z",
  refreshToken: "refresh-token-for-test",
  refreshTokenExpiresAt: "2026-11-21T12:00:00.000Z",
};

describe("Expo SecureStore session token repository", () => {
  test("stores a versioned token envelope and reads it back", async () => {
    let storedValue: string | null = null;
    const gateway = {
      deleteItemAsync: jest.fn(async () => {
        storedValue = null;
      }),
      getItemAsync: jest.fn(async () => storedValue),
      setItemAsync: jest.fn(async (_key: string, value: string) => {
        storedValue = value;
      }),
    };
    const repository = createExpoSecureStoreSessionTokenRepository(gateway);

    await repository.save(tokens);
    await expect(repository.read()).resolves.toEqual(tokens);
    expect(gateway.setItemAsync).toHaveBeenCalledWith(
      "omts.auth.tokens.v1",
      expect.stringContaining('"schemaVersion":1'),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
  });

  test("clears the whole token bundle with one key deletion", async () => {
    const gateway = {
      deleteItemAsync: jest.fn().mockResolvedValue(undefined),
      getItemAsync: jest.fn(),
      setItemAsync: jest.fn(),
    };
    const repository = createExpoSecureStoreSessionTokenRepository(gateway);

    await repository.clear();

    expect(gateway.deleteItemAsync).toHaveBeenCalledWith("omts.auth.tokens.v1");
  });

  test.each(["not-json", '{"schemaVersion":1,"tokens":{}}']) (
    "rejects invalid stored payload %s",
    async (storedValue) => {
      const repository = createExpoSecureStoreSessionTokenRepository({
        deleteItemAsync: jest.fn(),
        getItemAsync: jest.fn().mockResolvedValue(storedValue),
        setItemAsync: jest.fn(),
      });

      await expect(repository.read()).rejects.toBeInstanceOf(
        InvalidStoredSessionError,
      );
    },
  );
});
