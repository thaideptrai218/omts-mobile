import type { ProfileAccountSummary } from "@/features/profile/domain/profile-form";

// Application contract only. The API adapter must supply the concurrency stamp;
// the UI must never generate one or assume it is an HTTP ETag.
export type ProfileSnapshot = Readonly<{
  account: ProfileAccountSummary;
  displayName: string;
  revision: string;
}>;

export type ProfileLoadResult =
  | Readonly<{ profile: ProfileSnapshot; status: "loaded" }>
  | Readonly<{ status: "offline" }>
  | Readonly<{ status: "session-expired" }>;

export type ProfileSaveResult =
  | Readonly<{ profile: ProfileSnapshot; status: "saved" }>
  | Readonly<{
      status: "conflict";
      updatedBy: string | null;
      updatedAt: string | null;
    }>
  | Readonly<{ status: "username-readonly" | "session-expired" | "offline" }>;

export type ProfileService = Readonly<{
  load: () => Promise<ProfileLoadResult>;
  save: (
    input: Readonly<{
      displayName: string;
      expectedRevision: string;
    }>,
  ) => Promise<ProfileSaveResult>;
}>;
