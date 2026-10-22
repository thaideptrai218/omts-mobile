import { SessionFailure } from "@/features/session/domain/mobile-session";
import type {
  MobileSessionGateway,
  SessionCredential,
  SessionCredentialRepository,
} from "@/features/session/domain/mobile-session";

/** Owns refresh single-flight and ordering of credential writes vs logout. */
export function createSessionAccess(
  gateway: MobileSessionGateway,
  repository: SessionCredentialRepository,
) {
  let refreshTask: Promise<SessionCredential> | null = null;
  let writes = Promise.resolve();
  let epoch = 0;
  let rotation: { from: string; to: SessionCredential } | null = null;

  function write(action: () => Promise<void>) {
    const task = writes.then(action);
    writes = task.catch(() => undefined);
    return task;
  }

  const access = {
    read: () => repository.read(),
    save: (credential: SessionCredential) =>
      write(() => repository.save(credential)),
    async clear() {
      epoch++;
      refreshTask = null;
      rotation = null;
      await write(() => repository.clear());
    },
    async ensure(credential: SessionCredential): Promise<SessionCredential> {
      const requestEpoch = epoch;
      try {
        await gateway.inspect(credential);
        if (requestEpoch !== epoch) throw new SessionFailure("expired");
        return credential;
      } catch (error) {
        if (!(error instanceof SessionFailure) || error.code !== "expired")
          throw error;
      }
      if (requestEpoch !== epoch) throw new SessionFailure("expired");
      if (rotation?.from === credential.handle)
        return access.ensure(rotation.to);
      if (!refreshTask) {
        const startedAt = requestEpoch;
        const task = gateway.refresh(credential).then(async (lease) => {
          if (startedAt !== epoch) throw new SessionFailure("expired");
          await write(() => repository.save(lease.credential));
          if (startedAt !== epoch) throw new SessionFailure("expired");
          rotation = { from: credential.handle, to: lease.credential };
          return lease.credential;
        });
        refreshTask = task;
        // Compare ownership so an old completion cannot clear a new refresh.
        void task
          .finally(() => {
            if (refreshTask === task) refreshTask = null;
          })
          .catch(() => undefined);
      }
      return refreshTask;
    },
  };
  return access;
}
