# OMTS-133 — M0.1 review and M3.1 runtime configuration

> Date: 22/10/2026
> Repository: `thaideptrai218/omts-mobile`
> Branch: `feature/OMTS-133-mobile-foundation`

## Outcome

The existing connectivity foundation was reviewed and preserved. A typed runtime-configuration boundary was added for the backend base URL without creating an API client, calling the backend, or deciding an unresolved authentication contract.

## What changed

- Added `src/shared/config/runtime-config.ts`.
- Added validation for missing, malformed and unsafe API base URLs.
- Normalized the trailing slash so a future HTTP adapter can join paths consistently.
- Documented physical-device and `EXPO_PUBLIC_` security behavior in the README.
- Kept runtime validation lazy so the current connectivity-only app can still start before the QA URL is supplied.
- Added the execution checkpoint to `docs/MOBILE_IMPLEMENTATION_PLAN.md`.

## Why this boundary exists

Expo exposes public environment values to the application bundle. Components should not read those values independently because every call site would need to repeat missing-value handling and URL normalization. The runtime-config module converts one untrusted string into a validated frontend value before the future API adapter consumes it.

This module deliberately does not contain a default production URL. A silent fallback could send QA credentials to the wrong environment. It also does not contain tokens or credentials because `EXPO_PUBLIC_` values are readable from the compiled app.

## Data flow

```text
.env.local
  -> Expo CLI static environment replacement
  -> parseApiBaseUrl()
  -> getRuntimeConfig()
  -> future HTTP adapter
```

## Error encountered and resolved

`npx expo-doctor` initially reported 20/21 checks because the current SDK 57 metadata expected newer patch versions of Expo, Expo Router, Expo Network and `@expo/ui`. Lint and TypeScript had already passed, so the failure was dependency compatibility drift rather than an error in runtime-config code.

The project was repaired with `npx expo install --fix`, the repository-approved Expo command. It aligned the packages without changing SDK major:

- Expo `57.0.31`;
- Expo Router `57.0.29`;
- Expo Network `57.0.3`;
- `@expo/ui` `57.0.26`.

The npm audit output still reports transitive advisories. No forced audit fix was applied because it can move packages outside Expo's compatible set.

## Verification evidence

```text
npm run lint                    pass
npm run typecheck               pass
npx expo-doctor                 21/21 pass
npx expo export --platform web  pass
git diff --check                pass
```

The export generated `/`, `/_sitemap` and `/+not-found`. This demonstrates that missing QA configuration does not crash the current app at import time. It does not prove QA API connectivity or physical-device behavior.

## Remaining boundaries

- The QA API URL is still unknown and must not be invented.
- No HTTP client or auth/session code exists yet.
- The Mobile `ClientType` JSON representation and post-login contract remain M1 decisions.
- No automated test runner exists; parser unit tests are deferred to the approved test-foundation slice.

## Defense Q&A

**Why validate the URL if Expo already loaded the environment variable?**

Expo loads text; it does not guarantee that the text is present, is an absolute HTTP URL or is free of accidental credentials. Validation changes configuration failure from a confusing network error into a precise developer error.

**Why is validation lazy instead of running in the root layout?**

The QA URL has not been supplied and the current connectivity slice does not use the backend. Lazy validation keeps unrelated UI runnable while guaranteeing that the future API adapter cannot obtain an unchecked URL.

**Why was `npm audit fix --force` not used?**

Expo native packages must remain aligned with the installed SDK. A forced npm resolution can satisfy an advisory by introducing incompatible major versions, so SDK compatibility is repaired through Expo CLI and advisories are reviewed separately.
