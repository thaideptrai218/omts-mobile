import {
  SessionFailure,
  type AccountSessionScope,
  type SessionContact,
} from "@/features/session/domain/mobile-session";
import type { ProfileGateway } from "./profile-gateway";
import type {
  ContactChangeGateway,
  ContactChangeInput,
} from "./contact-change-gateway";

export function createContactChangeService(
  scope: AccountSessionScope,
  gateway: ContactChangeGateway,
  profileGateway: ProfileGateway,
) {
  let active = true;
  let generation = 0;
  let challengeId: string | null = null;
  function reset() {
    generation++;
    if (challengeId) gateway.cancel(challengeId);
    challengeId = null;
  }
  function accept(startedAt: number, id?: string) {
    if (!active || startedAt !== generation) {
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
    async load() {
      if (!active) throw new SessionFailure("unavailable");
      const startedAt = generation;
      const profile = await scope.run((credential) =>
        profileGateway.load(credential),
      );
      accept(startedAt);
      return profile;
    },
    async start(input: ContactChangeInput) {
      if (!active) throw new SessionFailure("unavailable");
      reset();
      const startedAt = generation;
      let returnedId: string | undefined;
      let result;
      try {
        result = await scope.run(async (credential) => {
          const response = await gateway.start(credential, input);
          if (response.status === "started") returnedId = response.challenge.id;
          return response;
        });
      } catch (error) {
        if (returnedId) gateway.cancel(returnedId);
        throw error;
      }
      accept(
        startedAt,
        result.status === "started" ? result.challenge.id : undefined,
      );
      if (result.status === "started") challengeId = result.challenge.id;
      return result;
    },
    async resend() {
      if (!active || !challengeId) throw new SessionFailure("verification");
      const startedAt = generation;
      const id = challengeId;
      let returnedId: string | undefined;
      try {
        const challenge = await scope.run(async (credential) => {
          const response = await gateway.resend(credential, id);
          returnedId = response.id;
          return response;
        });
        accept(startedAt, challenge.id);
        challengeId = challenge.id;
        return challenge;
      } catch (error) {
        if (returnedId) gateway.cancel(returnedId);
        throw error;
      }
    },
    async verify(code: string) {
      if (!active || !challengeId) throw new SessionFailure("verification");
      const startedAt = generation;
      const id = challengeId;
      const result = await scope.run((credential) =>
        gateway.verify(credential, id, code),
      );
      accept(startedAt, id);
      if (result.status === "saved") {
        const contacts: SessionContact[] = [];
        for (const [channel, contact] of [
          ["email", result.profile.account.email],
          ["sms", result.profile.account.phone],
        ] as const) {
          if (contact.value)
            contacts.push({
              channel,
              maskedRecipient: contact.value,
              verified: contact.verified,
            });
        }
        scope.acceptContacts(contacts);
        reset();
      } else if (result.status !== "invalid") reset();
      return result;
    },
  };
}
export type ContactChangeService = ReturnType<
  typeof createContactChangeService
>;
