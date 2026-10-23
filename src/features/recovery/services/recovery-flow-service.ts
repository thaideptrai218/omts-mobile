import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { RecoveryCompletionService } from "./recovery-completion-service";
import type { RecoveryGateway, RecoveryProof } from "./recovery-gateway";

export function createRecoveryFlowService(
  gateway: RecoveryGateway,
  isOffline: () => boolean,
) {
  let challengeId: string | null = null;
  let proof: RecoveryProof | null = null;
  let generation = 0;
  let active = true;
  function assertOnline() {
    if (!active) throw new SessionFailure("unavailable");
    if (isOffline()) throw new SessionFailure("offline");
  }
  function reset() {
    generation++;
    if (challengeId) gateway.cancel(challengeId);
    challengeId = null;
    proof = null;
  }
  function accept(startedAt: number, id: string) {
    if (!active || generation !== startedAt) {
      gateway.cancel(id);
      throw new SessionFailure("unavailable");
    }
  }
  const completion: RecoveryCompletionService = {
    async complete({ newPassword }) {
      if (!active || !proof) return { status: "attempt-invalid" };
      if (isOffline()) return { status: "offline" };
      const startedAt = generation;
      const result = await gateway.complete(proof, newPassword);
      if (!active || generation !== startedAt)
        return { status: "attempt-invalid" };
      if (result.status !== "offline") reset();
      return result;
    },
  };
  return {
    // React development lifecycle may run setup/cleanup/setup with this instance.
    // dispose increments generation, so reopening cannot revive an old request.
    activate() {
      active = true;
    },
    completion,
    async start(identifier: string) {
      assertOnline();
      reset();
      const startedAt = generation;
      const challenge = await gateway.start(identifier);
      accept(startedAt, challenge.id);
      challengeId = challenge.id;
      return challenge;
    },
    async resend() {
      assertOnline();
      if (!challengeId) throw new SessionFailure("verification");
      const startedAt = generation;
      const challenge = await gateway.resend(challengeId);
      accept(startedAt, challenge.id);
      challengeId = challenge.id;
      proof = null;
      return challenge;
    },
    async verify(code: string) {
      assertOnline();
      if (!challengeId) throw new SessionFailure("verification");
      const startedAt = generation;
      const id = challengeId;
      const result = await gateway.verify(id, code);
      accept(startedAt, id);
      if (result.status === "verified") {
        proof = result.proof;
        return { status: "verified" as const };
      }
      return result;
    },
    reset,
    dispose() {
      active = false;
      reset();
    },
  };
}
export type RecoveryFlowService = ReturnType<typeof createRecoveryFlowService>;
