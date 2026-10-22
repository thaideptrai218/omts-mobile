import type { SessionTokenBundle } from "@/features/session/domain/session-token-bundle";

export type SessionTokenRepository = Readonly<{
  clear(): Promise<void>;
  read(): Promise<SessionTokenBundle | null>;
  save(tokens: SessionTokenBundle): Promise<void>;
}>;
