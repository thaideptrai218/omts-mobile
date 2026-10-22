import type { SessionCredential } from "@/features/session/domain/mobile-session";
import type {
  ProfileSaveResult,
  ProfileService,
  ProfileSnapshot,
} from "./profile-service";

/** Adapter boundary, not a declaration of a backend endpoint or DTO. */
export type ProfileGateway = Readonly<{
  load: (credential: SessionCredential) => Promise<ProfileSnapshot>;
  save: (
    credential: SessionCredential,
    input: Parameters<ProfileService["save"]>[0],
  ) => Promise<ProfileSaveResult>;
}>;
