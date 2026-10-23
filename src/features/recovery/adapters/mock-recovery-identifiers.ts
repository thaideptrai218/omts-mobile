// Synthetic identifiers only. Separate from the masked session presentation.
export const mockRecoveryIdentifiers = [
  {
    accountId: "mock-staff-ready",
    channel: "email",
    identifier: "ha@example.invalid",
  },
  {
    accountId: "mock-staff-first",
    channel: "email",
    identifier: "an@example.invalid",
  },
  { accountId: "mock-staff-first", channel: "sms", identifier: "0000000123" },
] as const;
