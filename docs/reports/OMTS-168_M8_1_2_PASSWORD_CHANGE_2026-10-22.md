# OMTS-168 M8.1–M8.2 — Password-change form and current-password proof

## Requirement evidence

Jira OMTS-168 requires a Mobile security screen and a forced-change mode that
blocks the app stack. SRS UC04 requires current-password proof, two matching new
password entries, MSG17 for wrong proof, MSG18 for success and MSG19 when the
session expires. A verified-email code is an alternative proof branch.

## Implemented

- Added a typed password-change form domain that reuses the shared new-password
  policy and preserves current/new passwords exactly as entered.
- Added MSG17 and MSG18 to the safe message catalog.
- Added one controlled screen with `standard` and `forced` discriminated modes.
- Forced mode labels the current proof as the temporary password, explains the
  security gate and has no Cancel prop or button.
- Standard mode accepts a required Cancel callback to return to the account
  area.
- Added domain and component tests for validation, callbacks, typed feedback,
  pending lock and forced-mode cancellation absence.

## Architecture boundary

```text
route/controller mode
  -> PasswordChangeScreen
  -> validatePasswordChange()
  -> future password-change service
  -> backend verifies proof and changes password
  -> session gate resolves next destination
```

Hiding Cancel is not the security boundary. The future gate layout must prevent
all app-stack routes while `mustChangePassword` is true, and the backend remains
responsible for rejecting protected operations.

## Error found and fixed

`npm run typecheck` initially rejected the forced-screen test helper because
`Partial<PasswordChangeScreenProps>` widened the discriminated union back to
both modes. Jest passed because its transform did not perform the same complete
type analysis. The helper now uses `Extract<..., { mode: "forced" }>` and omits
the `mode` override, so tests cannot accidentally construct a standard screen
through the forced helper.

## Verification

```text
npm test          22 suites / 127 tests passed
npm run typecheck passed
npm run lint      passed
git diff --check  passed
```

## Remaining blockers

- Verified-email proof start/verify endpoints and UI branch.
- Password-change mutation and stable response/session policy.
- Session bootstrap and forced gate route that blocks the app stack.
- Expo Go/QA API evidence.

OMTS-168 remains incomplete and its Jira status was not changed.
