import type { SessionCredential } from "@/features/session/domain/mobile-session";
import type {
  VerificationChannel,
  VerificationChallenge,
} from "@/features/verification/domain/verification-contract";
import type { ProfileSnapshot } from "./profile-service";

// Application-only boundary, not an HTTP DTO or a Customer-linking operation.
export type ContactChangeInput = Readonly<{
  channel: VerificationChannel;
  identifier: string;
  expectedRevision: string;
}>;
export type ContactChangeStartResult =
  | { status: "started"; challenge: VerificationChallenge }
  | { status: "contact-invalid" }
  | { status: "conflict" };
export type ContactChangeVerifyResult =
  | { status: "saved"; profile: ProfileSnapshot }
  | { status: "invalid"; challenge: VerificationChallenge | null }
  | { status: "contact-invalid" }
  | { status: "conflict" };
export interface ContactChangeGateway {
  start(
    credential: SessionCredential,
    input: ContactChangeInput,
  ): Promise<ContactChangeStartResult>;
  resend(
    credential: SessionCredential,
    id: string,
  ): Promise<VerificationChallenge>;
  verify(
    credential: SessionCredential,
    id: string,
    code: string,
  ): Promise<ContactChangeVerifyResult>;
  cancel(id: string): void;
}
