import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { RegistrationFormData } from "../domain/registration-form";
import type {
  RegistrationGateway,
  RegistrationProof,
} from "./registration-gateway";

export function createRegistrationFlowService(
  gateway: RegistrationGateway,
  isOffline: () => boolean,
) {
  let active = true;
  let generation = 0;
  let challengeId: string | null = null;
  let proof: RegistrationProof | null = null;
  function reset() {
    generation++;
    if (challengeId) gateway.cancel(challengeId);
    challengeId = null;
    proof = null;
  }
  function online() {
    if (!active) throw new SessionFailure("unavailable");
    if (isOffline()) throw new SessionFailure("offline");
  }
  function accept(startedAt: number, id?: string) {
    if (!active || generation !== startedAt) {
      if (id) gateway.cancel(id);
      throw new SessionFailure("unavailable");
    }
  }
  return {
    activate() {
      active = true;
    },
    reset,
    dispose() {
      active = false;
      reset();
    },
    async start(input: RegistrationFormData) {
      online();
      reset();
      const startedAt = generation;
      const result = await gateway.start(input);
      accept(
        startedAt,
        result.status === "started" ? result.challenge.id : undefined,
      );
      if (result.status === "started") challengeId = result.challenge.id;
      return result;
    },
    async resend() {
      online();
      if (!challengeId || proof) throw new SessionFailure("verification");
      const startedAt = generation;
      const challenge = await gateway.resend(challengeId);
      accept(startedAt, challenge.id);
      challengeId = challenge.id;
      return challenge;
    },
    async verify(code: string) {
      online();
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
    async complete() {
      if (!active || !proof) return { status: "attempt-invalid" as const };
      if (isOffline()) return { status: "offline" as const };
      const startedAt = generation;
      const result = await gateway.complete(proof);
      if (!active || generation !== startedAt)
        return { status: "attempt-invalid" as const };
      if (result.status !== "offline") reset();
      return result;
    },
  };
}
export type RegistrationFlowService = ReturnType<
  typeof createRegistrationFlowService
>;
