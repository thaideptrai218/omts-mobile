import { SessionFailure } from "@/features/session/domain/mobile-session";
import type {
  MobileSessionGateway,
  SessionCredential,
  SessionCredentialRepository,
  SessionSnapshot,
  AccountSessionScope,
} from "@/features/session/domain/mobile-session";
import type { VerificationChannel } from "@/features/verification/domain/verification-contract";
import { createSessionAccess } from "@/features/session/services/session-access";

export type { SessionSnapshot } from "@/features/session/domain/mobile-session";

type Options = {
  gateway: MobileSessionGateway;
  repository: SessionCredentialRepository;
  isOffline: () => boolean;
};

export function createMobileSessionStore({
  gateway,
  repository,
  isOffline,
}: Options) {
  const access = createSessionAccess(gateway, repository);
  const listeners = new Set<() => void>();
  let snapshot: SessionSnapshot = { status: "loading" };
  let credential: SessionCredential | null = null;
  let generation = 0;
  let busy = false;

  function publish(next: SessionSnapshot) {
    snapshot = next;
    listeners.forEach((listener) => listener());
  }
  function assertOnline() {
    if (isOffline()) throw new SessionFailure("offline");
  }
  async function hideAndClear(startedAt: number, reason?: "sessionExpired") {
    credential = null;
    publish({ status: "loading" });
    try {
      await access.clear();
      if (startedAt === generation) {
        publish(
          reason ? { status: "signedOut", reason } : { status: "signedOut" },
        );
      }
      return true;
    } catch {
      if (startedAt === generation) {
        publish({
          status: "error",
          reason: "unavailable",
          operation: "logout",
          ...(reason ? { signOutReason: reason } : {}),
        });
      }
      return false;
    }
  }
  async function expireCurrentSession(startedAt: number) {
    if (startedAt !== generation) return;
    const endedAt = ++generation;
    busy = true;
    try {
      await hideAndClear(endedAt, "sessionExpired");
    } finally {
      if (endedAt === generation) busy = false;
    }
  }
  async function authenticated<T>(
    action: (current: SessionCredential) => Promise<T>,
  ) {
    assertOnline();
    if (!credential) throw new SessionFailure("expired");
    const startedAt = generation;
    const current = await access.ensure(credential);
    if (startedAt !== generation) throw new SessionFailure("expired");
    credential = current;
    const result = await action(current);
    if (startedAt !== generation) throw new SessionFailure("expired");
    return result;
  }
  async function mutate<T>(action: (isCurrent: () => boolean) => Promise<T>) {
    if (busy) throw new SessionFailure("unavailable");
    busy = true;
    const startedAt = generation;
    try {
      return await action(() => startedAt === generation);
    } catch (error) {
      if (
        startedAt === generation &&
        error instanceof SessionFailure &&
        error.code === "expired"
      ) {
        await expireCurrentSession(startedAt);
      }
      throw error;
    } finally {
      if (startedAt === generation) busy = false;
    }
  }

  const store = {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    acknowledgeSignOutReason() {
      if (snapshot.status === "signedOut" && snapshot.reason) {
        publish({ status: "signedOut" });
      }
    },
    createAccountScope(accountId: string): AccountSessionScope {
      const ownerGeneration = generation;
      const isCurrent = () =>
        ownerGeneration === generation &&
        snapshot.status === "active" &&
        snapshot.session.accountId === accountId &&
        snapshot.session.nextAction === "ready";
      return {
        async run<T>(request: (current: SessionCredential) => Promise<T>) {
          // A service from an old login must not execute with a new account's credential.
          if (!isCurrent()) throw new SessionFailure("expired");
          return mutate(() => authenticated(request));
        },
        acceptDisplayName(displayName) {
          if (isCurrent() && snapshot.status === "active") {
            publish({
              status: "active",
              session: { ...snapshot.session, displayName },
            });
          }
        },
        acceptContacts(contacts) {
          if (isCurrent() && snapshot.status === "active") {
            publish({
              status: "active",
              session: {
                ...snapshot.session,
                contacts: contacts.map((contact) => ({ ...contact })),
              },
            });
          }
        },
        async expire() {
          if (!isCurrent()) return;
          await expireCurrentSession(ownerGeneration);
        },
      };
    },
    async bootstrap() {
      if (busy) return;
      if (snapshot.status === "error" && snapshot.operation === "logout") {
        if (snapshot.signOutReason === "sessionExpired")
          await expireCurrentSession(generation);
        else await store.logout();
        return;
      }
      busy = true;
      const startedAt = generation;
      publish({ status: "loading" });
      try {
        const restored = await access.read();
        if (startedAt !== generation) return;
        credential = restored;
        if (!credential) {
          publish({ status: "signedOut" });
          return;
        }
        const session = await authenticated((current) =>
          gateway.inspect(current),
        );
        if (startedAt !== generation) return;
        publish({ status: "active", session });
      } catch (error) {
        if (startedAt !== generation) return;
        if (error instanceof SessionFailure && error.code === "expired") {
          await expireCurrentSession(startedAt);
        } else {
          publish({
            status: "error",
            reason:
              error instanceof SessionFailure && error.code === "offline"
                ? "offline"
                : "unavailable",
            operation: "bootstrap",
          });
        }
      } finally {
        if (startedAt === generation) busy = false;
      }
    },
    login(identifier: string, password: string) {
      return mutate(async () => {
        store.acknowledgeSignOutReason();
        assertOnline();
        const startedAt = generation;
        const lease = await gateway.login(identifier, password);
        if (startedAt !== generation) return;
        await access.save(lease.credential);
        if (startedAt !== generation) return;
        credential = lease.credential;
        publish({ status: "active", session: lease.session });
      });
    },
    changePassword(current: string, next: string) {
      return mutate(async (isCurrent) => {
        const session = await authenticated((handle) =>
          gateway.changePassword(handle, current, next),
        );
        if (!session) return false;
        if (!isCurrent()) throw new SessionFailure("expired");
        publish({ status: "active", session });
        return true;
      });
    },
    async reloadSession() {
      return mutate(async (isCurrent) => {
        const session = await authenticated((current) =>
          gateway.inspect(current),
        );
        if (!isCurrent()) throw new SessionFailure("expired");
        publish({ status: "active", session });
      });
    },
    sendCode(channel: VerificationChannel) {
      return mutate(() =>
        authenticated((current) => gateway.sendCode(current, channel)),
      );
    },
    verifyCode(challengeId: string, code: string) {
      return mutate(async (isCurrent) => {
        const session = await authenticated((current) =>
          gateway.verifyCode(current, challengeId, code),
        );
        if (!isCurrent()) throw new SessionFailure("expired");
        publish({ status: "active", session });
      });
    },
    async logout() {
      const startedAt = ++generation;
      busy = true;
      const oldCredential = credential;
      try {
        const cleared = await hideAndClear(startedAt);
        // No offline queue. The mock server is discarded on process restart.
        if (cleared && oldCredential && !isOffline()) {
          void Promise.resolve()
            .then(() => gateway.revoke(oldCredential))
            .catch(() => undefined);
        }
      } finally {
        if (startedAt === generation) busy = false;
      }
    },
  };
  return store;
}

export type MobileSessionStore = ReturnType<typeof createMobileSessionStore>;
