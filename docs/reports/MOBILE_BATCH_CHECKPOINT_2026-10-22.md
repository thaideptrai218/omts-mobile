# Mobile batch checkpoint — 22/10/2026

## Implemented in this batch

- OMTS-151: purpose-bound verification contract, countdown facts/hook and shared SCR-02 presentation.
- OMTS-155: registration validation, Email/Phone selector and SCR-01 presentation.
- OMTS-160: login validation, login outcome messages and SCR-03 presentation.
- OMTS-164 M7.1: privacy-equivalent recovery request and MSG15.
- Foundation: additional message codes, regression tests and documented learning/error evidence.

All screens are controlled production feature components. None is exposed through a fake-data showcase route. Real route wrappers remain dependent on endpoint/session contracts.

## Full verification

Final source checkpoint:

```text
Test Suites: 18 passed, 18 total
Tests:       109 passed, 109 total
npm run typecheck: passed
npm run lint: passed
git diff --check: passed
```

Earlier in the same batch after dependency and foundation changes:

```text
Expo Doctor: 21/21 checks passed
Expo web export: completed successfully (3 static routes)
```

The web export emitted only the environment warning that `NO_COLOR` was ignored because `FORCE_COLOR` was set. The command exited 0 and the warning does not indicate a source or bundle failure.

## Self-review findings resolved

- Strict code validation now rejects seven digits before normalization/truncation.
- Countdown derives from absolute timestamps and catches up after backgrounding.
- RNTL 14 async hook-test APIs are awaited correctly.
- Readonly validation outputs use mutable local builders without weakening the public type.
- Radio controls expose focusable child semantics rather than an ineffective parent role.
- Newly supported MSG12 replaced an obsolete “unknown code” test fixture with MSG99.
- Recovery continuation no longer varies by account existence at the component contract boundary.
- API paths now reject encoded traversal, encoded separators and URL fragments before `fetch`.
- The implementation plan no longer incorrectly labels the repository as planning-only.

## Dependency audit note

`npm audit --omit=dev` currently reports 53 transitive advisories (45 high,
8 moderate) in the Expo Router/Metro/Jest/tooling graph. npm's automatic
remediation proposes breaking changes, including changing the Expo or Router
major version. No `npm audit fix --force` was applied: Expo Doctor confirms the
current SDK 57 package set is compatible, while forcing those changes would not
be a safe patch-level remediation. Recheck when Expo publishes a compatible
dependency update.

## Honest remaining blockers

- QA API URL/OpenAPI and Mobile enum serialization.
- SecureStore session/token/refresh and post-login gate response.
- Verification and registration/recovery endpoints, including opaque recovery attempts.
- Permission payload/navigation registry.
- Expo Go physical-device evidence for keyboard, autofill, screen reader, connectivity and QA accounts.

No commit or push was performed in this batch.
