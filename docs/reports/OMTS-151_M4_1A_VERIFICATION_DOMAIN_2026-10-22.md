# OMTS-151 — M4.1a verification domain contract

## Outcome

The shared verification feature now has a screen-safe domain contract for challenge display, code submission and successful verification. It does not define API paths, choose email instead of SMS, or persist the verification result token.

## What was implemented

- `VerificationPurpose` keeps account onboarding, account recovery, profile-contact change and trader registration distinct.
- `VerificationChallenge` contains only data needed by SCR-02: challenge ID, masked recipient, channel, purpose, expiry/resend timestamps and remaining attempt/send counters.
- `VerificationSubmission` contains only `challengeId`, `purpose` and the six-digit code. It cannot accidentally send the masked or full recipient as verification authority.
- `VerificationResult` models a purpose-bound transient token for the calling flow.
- Verification-code normalization is shared with the visual code field, while completion validation checks the complete raw value strictly.

## Why the boundary matters

UC08 is reused by registration, recovery and contact changes, but a successful code must not become a general-purpose authorization. Binding both the challenge and result to a purpose makes this separation visible in TypeScript and gives future endpoint adapters a contract to validate.

The recipient is display information, not proof. The server-created challenge ID identifies the verification attempt; the backend remains responsible for expiry, attempt limits, recipient ownership and one-time use.

Epoch-millisecond timestamps are used instead of preformatted text so the UI can calculate countdowns consistently without embedding locale or timezone assumptions in the transport model.

## Self-review finding

An initial completeness check normalized the input before validation. Because normalization truncates visual input to six digits, a seven-digit string could have become six digits and passed incorrectly. The implementation was corrected to validate the entire submitted string with `^\d{6}$`. Tests explicitly reject empty, short, long and alphanumeric values.

## Verification evidence

Commands executed:

```text
npm test -- --runTestsByPath src/features/verification/__tests__/verification-contract-test.ts src/features/verification/__tests__/verification-code-field-test.tsx
npm run typecheck
npm run lint
git diff --check
```

Result: 2 suites and 12 tests passed; TypeScript, Expo lint and whitespace checks passed.

## Still open

- Backend endpoint paths and response schemas for create, resend and verify challenge.
- Server message-code mapping for MSG01, MSG04 and MSG16.
- The route-specific action after verification succeeds.
- Device evidence for SMS/email autofill and keyboard behavior.
