import {
  SessionFailure,
  type SessionCredential,
} from "@/features/session/domain/mobile-session";
import { validateProfileForm } from "../domain/profile-form";
import type { ProfileGateway } from "../services/profile-gateway";
import {
  createMockProfileSnapshot,
  mockProfileRevision,
  type MockProfileOwner,
} from "./mock-profile-snapshot";

export function createMockProfileGateway(
  resolveOwner: (credential: SessionCredential) => MockProfileOwner,
): ProfileGateway {
  function owner(credential: SessionCredential) {
    const account = resolveOwner(credential);
    if (account.session.nextAction !== "ready")
      throw new SessionFailure("unavailable");
    return account;
  }
  return {
    async load(credential) {
      return createMockProfileSnapshot(owner(credential));
    },
    async save(credential, input) {
      const account = owner(credential);
      if ("username" in input) return { status: "username-readonly" };
      if (input.expectedRevision !== mockProfileRevision(account)) {
        return { status: "conflict", updatedBy: null, updatedAt: null };
      }
      const validation = validateProfileForm({
        displayName: input.displayName,
      });
      if (!validation.isValid) throw new SessionFailure("unavailable");
      account.session = {
        ...account.session,
        displayName: validation.data.displayName,
      };
      account.profileRevision++;
      return { status: "saved", profile: createMockProfileSnapshot(account) };
    },
  };
}
