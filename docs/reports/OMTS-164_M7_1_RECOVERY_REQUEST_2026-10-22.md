# OMTS-164 — M7.1 privacy-safe recovery request

## Sources reviewed

- Jira OMTS-164: identifier → MSG15 → SCR-02 → new password → login, plus change delivery method.
- SRS UC03/SCR-04: always return MSG15 for missing, unverified, locked or send-failure cases; do not reveal account existence.

## Outcome

The recovery feature now has required-only identifier validation and a controlled first-step screen. The screen collects one verified email/phone identifier, displays MSG15 after submission, offers the same Continue to Verification action and provides the fixed support note required by SCR-04.

No client-side lookup, account-type selector, existence message or delivery-success claim was added.

## Security self-review finding

The initial component contract made `onContinueToVerification` optional. If a controller supplied it only when a real account/challenge existed, the presence of the button would become an account-enumeration signal even though MSG15 text stayed generic.

The callback is now required and the post-MSG15 layout is uniform. Backend still needs to confirm an opaque recovery-attempt contract that allows the next screen to behave consistently without exposing whether a code was actually sent. Mobile does not fabricate such a challenge.

## Verification evidence

Three domain tests and four screen tests cover trimming, required-only validation, no existence inference, generic MSG15 content, uniform verification action and pending lock. Together with catalog/parser regression coverage, 24 targeted tests passed; strict TypeScript, Expo lint and whitespace checks passed.

## Still open

- Opaque privacy-preserving recovery-attempt response from Backend.
- Shared SCR-02 recovery wrapper and change-delivery-method cancellation semantics.
- New-password step, recovery token scope and old-session revocation response.
- QA and Expo Go evidence.
