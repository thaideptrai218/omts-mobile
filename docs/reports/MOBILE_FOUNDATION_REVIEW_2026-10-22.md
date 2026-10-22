# OMTS Mobile — full foundation review

> Review date: 22/10/2026
> Branch: `feature/OMTS-133-mobile-foundation`
> Scope: all uncommitted foundation, shared UI, connectivity, verification,
> login, trader-registration and recovery-request changes

## 1. Review result

The reviewed slice is suitable to commit to the feature branch. No open
critical or high-severity application-code defect was found after the fixes in
section 2. This does not mean `OMTS-133` or the authentication flows are
complete: session persistence, refresh, route guards, permission navigation,
real endpoint adapters and QA-device evidence remain intentionally blocked by
the documented backend contracts.

The production route tree still exposes only the neutral root screen. The auth
screens are controlled feature components and are not mounted through fake
routes or demo accounts.

## 2. Findings fixed during review

### R1 — encoded traversal was not rejected by API path validation

**Risk:** the transport rejected literal `..` and cross-origin URLs but could
allow an encoded segment such as `%2e%2e` to be normalized later. Paths are
currently developer-owned rather than user input, so this was defense in depth,
not evidence of an exploited vulnerability.

**Fix:** decode each path segment with a bounded pass and reject dot segments,
encoded separators, malformed encoding and fragments before URL construction.
The existing same-origin check remains in place.

**Regression evidence:** the API transport suite now covers literal traversal,
single/double-encoded traversal, encoded slash, fragment and external-origin
cases.

### R2 — implementation-plan status was stale

**Risk:** the plan header still said “planning only” even though its execution
log and source already contained implemented micro-tasks. This could make a
reviewer misclassify completed code as a proposal.

**Fix:** the header now states that the plan is being executed incrementally;
only execution logs and reports count as implementation evidence.

### R3 — local learning notes must not be pushed

The tracked learning README and lesson 01 are removed from Git while every
learning file remains present under the local `docs/learning/` directory. The
directory is ignored as requested, so the commit does not delete the learner's
local copies.

## 3. Automated verification

```text
npm test                         18 suites / 109 tests passed
npm run typecheck                passed
npm run lint                     passed
npx expo-doctor                  21/21 checks passed
npx expo export --platform web   passed; 3 static routes exported
git diff --check                 passed before final staging
```

The export emitted the environment-only warning that `NO_COLOR` is ignored
while `FORCE_COLOR` is set. It did not indicate a source or bundle failure.

## 4. Security and privacy review

- No committed access token, refresh token, OTP secret, private key or API key
  was found. OTP values and sample passwords are confined to tests.
- Raw backend error prose is not rendered; known message codes resolve through
  the typed catalog and unknown codes use a safe fallback.
- Recovery-request feedback is privacy-equivalent and does not disclose whether
  an account exists.
- The unauthenticated transport does not attach credentials and session/refresh
  behavior has not been fabricated before contract approval.

`npm audit --omit=dev` reports 53 transitive advisories (45 high, 8 moderate)
inside the current Expo Router/Metro/Jest/tooling dependency graph. npm proposes
breaking automatic remediations such as changing Expo or Router major versions.
No force fix was applied because it would invalidate the SDK-compatible set
that passes Expo Doctor. This dependency debt must be reviewed again with a
compatible Expo release.

## 5. Known limits that remain open

- No QA API URL, OpenAPI snapshot or test-account matrix is available.
- SecureStore token repository, bootstrap, refresh coordinator and protected
  cache cleanup are not implemented.
- Auth/app/gate route groups and effective-permission navigation are not
  implemented.
- Verification, registration and recovery endpoint contracts are incomplete;
  recovery still needs an opaque server attempt.
- Physical-device checks for Expo Go, keyboard, autofill, screen reader,
  connectivity transitions and large text are still required.

These are tracked limits rather than review failures in the current
contract-independent slice.

## 6. Review decision

Commit and push are approved for this feature branch. Do not merge the branch
into `develop` or mark the Mobile foundation complete solely from this review.
