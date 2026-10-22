import type {
  VerificationChannel,
  VerificationChallenge,
} from "@/features/verification/domain/verification-contract";

export type SessionStep = "changePassword" | "verifyContact" | "ready";

export type SessionContact = Readonly<{
  channel: VerificationChannel;
  maskedRecipient: string;
  verified: boolean;
}>;

export type MobileSession = Readonly<{
  accountId: string;
  displayName: string;
  username: string;
  grants: readonly Readonly<{ zoneName: string; roleName: string }>[];
  contacts: readonly SessionContact[];
  nextAction: SessionStep;
}>;

// This handle is an application contract, not the backend's access/refresh DTO.
export type SessionCredential = Readonly<{ handle: string }>;
export type AccountSessionScope = Readonly<{
  run: <T>(
    request: (credential: SessionCredential) => Promise<T>,
  ) => Promise<T>;
  acceptDisplayName: (displayName: string) => void;
  expire: () => Promise<void>;
}>;
export type SessionLease = Readonly<{
  credential: SessionCredential;
  session: MobileSession;
}>;

export type SessionSnapshot =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "signedOut"; reason?: "sessionExpired" }>
  | Readonly<{ status: "active"; session: MobileSession }>
  | Readonly<{
      status: "error";
      reason: "offline" | "unavailable";
      operation: "bootstrap" | "logout";
      signOutReason?: "sessionExpired";
    }>;

export type SessionFailureCode =
  | "credentials"
  | "expired"
  | "offline"
  | "verification"
  | "unavailable";

export class SessionFailure extends Error {
  constructor(
    readonly code: SessionFailureCode,
    readonly challenge?: VerificationChallenge,
  ) {
    super(code);
    this.name = "SessionFailure";
  }
}

export interface MobileSessionGateway {
  login(identifier: string, password: string): Promise<SessionLease>;
  inspect(credential: SessionCredential): Promise<MobileSession>;
  refresh(credential: SessionCredential): Promise<SessionLease>;
  changePassword(
    credential: SessionCredential,
    current: string,
    next: string,
  ): Promise<MobileSession | null>;
  sendCode(
    credential: SessionCredential,
    channel: VerificationChannel,
  ): Promise<VerificationChallenge>;
  verifyCode(
    credential: SessionCredential,
    challengeId: string,
    code: string,
  ): Promise<MobileSession>;
  revoke(credential: SessionCredential): Promise<void>;
}

export interface SessionCredentialRepository {
  read(): Promise<SessionCredential | null>;
  save(credential: SessionCredential): Promise<void>;
  clear(): Promise<void>;
}
