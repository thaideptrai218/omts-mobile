# OMTS-164 M7.3 — Recovery new-password presentation

## Requirement evidence

Jira OMTS-164 defines the Mobile flow as identifier → MSG15 → SCR-02 → new
password → login. SRS UC03 requires two matching password entries, at least
eight characters with letters and digits, revocation of old sessions after a
successful reset, and another login through UC02.

## Implemented

- Added a feature-neutral new-password policy with typed field errors.
- Refactored trader registration to use the same policy without changing its
  public form contract.
- Added the controlled `RecoveryNewPasswordScreen` with two masked fields,
  requirement guidance, field feedback, mutation pending state and return to
  login action.
- Kept the recovery verification token outside screen props. The future
  controller owns that transient proof and sends it only to the reset endpoint.
- Added regression tests for Unicode letters, exact confirmation, no password
  trimming, callback flow, validation display, safe feedback and pending lock.

## Data and control flow

```text
controller-owned form values
  -> validateNewPassword()
  -> field errors OR exact password
  -> future reset service with transient recovery proof
  -> backend replaces password + revokes old sessions
  -> controller navigates to login
```

The current slice stops before the reset service. It does not simulate a
successful backend mutation.

## Verification

```text
npm test          20 suites / 119 tests passed
npm run typecheck passed
npm run lint      passed
git diff --check  passed
```

## Remaining blockers

- Opaque recovery-attempt/verification-result response contract.
- Recovery verification route wrapper and delivery-method cancellation.
- Reset-password endpoint, error codes and success response.
- QA API and Expo Go end-to-end evidence.

OMTS-164 must remain incomplete until those items work against QA.
