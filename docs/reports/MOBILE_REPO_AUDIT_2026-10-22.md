# OMTS Mobile — repository audit before implementation

> Audit date: 22/10/2026
> Repository: `thaideptrai218/omts-mobile`
> Local checkout: `D:\Đồ_án\omts-mobile`
> Branch inspected: `feature/OMTS-133-mobile-foundation`
> This document records evidence found in source and requirements. It does not mark planned work as implemented.

## 1. Audit scope and sources

The audit covers:

- the current Mobile source tree, package configuration, Git state and CI workflows;
- Jira `OMTS-133`, `OMTS-151`, `OMTS-155`, `OMTS-160`, `OMTS-164`, `OMTS-168`, `OMTS-172`, `OMTS-176` and `OMTS-180`;
- Report 3/SRS sections UC01–UC08 and SCR-01–SCR-06;
- the approved authentication/onboarding decisions stored under `D:\Đồ_án\nghiệp_vụ`;
- the current backend implementation at commits `4e0b385` and `14d7839` for auth and zone authorization.

The copy `D:\Đồ_án\omts-mobile-develop` was also compared. It has no `.git` metadata and is an older scaffold. The canonical working copy is `D:\Đồ_án\omts-mobile` because it points to the official GitHub remote and contains the newer foundation work.

## 2. Executive conclusion

The repository is a healthy Expo scaffold with one implemented vertical slice: connectivity detection and the global `MSG07` banner. Its dependency set is compatible with Expo SDK 57, lint and strict TypeScript pass, and Expo Doctor reports no configuration problems.

However, it is not yet a complete Mobile foundation despite Jira `OMTS-133` being in `Done`. The code does not yet contain secure session persistence, session bootstrap, API transport, refresh coordination, auth/app route separation, post-login gates, permission-aware navigation or QA API integration. The root page is still a placeholder.

The safest next move is not to begin isolated screens immediately. First complete the missing foundation contracts, then build the shared verification screen, then implement each auth/account flow on top of those shared boundaries.

## 3. Git and working-tree evidence

Current branch:

```text
feature/OMTS-133-mobile-foundation
```

Current branch base:

```text
093b623 chore(docs): add mobile foundation guidance OMTS-133
9fb0743 origin/develop
```

The working tree already contains uncommitted work from the first foundation slice:

- modified config and documentation files;
- added `expo-network` and `expo-secure-store` dependencies;
- added connectivity domain/repository/service/provider/component files;
- removed tracked learning notes because `docs/learning/` is now local-only;
- added the first foundation report.

These changes must be preserved. A future implementation step should review and commit this slice before mixing it with session/auth changes, unless the team explicitly wants one combined foundation commit.

## 4. What is implemented now

### 4.1 Expo application baseline

- Expo SDK `57.0.30`;
- React Native `0.86.3`;
- Expo Router `57.0.28`;
- strict TypeScript;
- typed routes and React Compiler enabled;
- no generated `ios/` or `android/` folders, so the project still follows Expo Continuous Native Generation;
- environment example includes `EXPO_PUBLIC_API_BASE_URL` and local env files are ignored.

### 4.2 Connectivity slice

The current data flow is:

```text
expo-network
  -> ExpoNetworkRepository
  -> toConnectivityStatus()
  -> ConnectivityService
  -> ConnectivityProvider
  -> OfflineBanner
  -> MSG07
```

Positive findings:

- UI does not import the native network module directly;
- `online`, `offline` and `unknown` are separate states;
- the initial network snapshot cannot overwrite a newer live event;
- the banner uses safe-area padding and an accessibility alert role;
- the current message does not falsely promise a general offline mutation queue.

Limitations:

- there are no automated tests for the mapper, provider race or banner visibility;
- no retry policy or offline queue exists;
- `OMTS-180` specifically requires a deferred server-session revoke after offline logout, which is narrower than a general mutation queue and still needs an explicit implementation design.

### 4.3 SecureStore package installation

`expo-secure-store` is installed and registered as an Expo config plugin. No token repository or session cleanup logic uses it yet. Package installation is not evidence that secure session storage is complete.

### 4.4 Message catalog

The catalog currently contains only `MSG07`. Jira and SRS require at least the auth/account message set used by SCR-01–SCR-06, including `MSG01`, `MSG04`, `MSG06`, `MSG10`, `MSG12`–`MSG23`, `MSG57`, `MSG62` and `MSG67`–`MSG69` where applicable.

### 4.5 Navigation

The root layout renders one unrestricted `Stack`; only `/` exists and shows placeholder text. There are no `(auth)`, `(gate)` or `(app)` route groups and no bootstrap screen. Protected UI could not yet be prevented from flashing because there is no session bootstrap state.

## 5. Verification baseline

Commands run on 22/10/2026:

```text
npm run lint       -> pass
npm run typecheck  -> pass
npx expo-doctor    -> 21/21 checks passed
```

What these results prove:

- source currently satisfies configured lint rules;
- TypeScript resolves all existing code under strict mode;
- installed Expo packages and app configuration are compatible with SDK 57.

What they do not prove:

- the app runs on a physical device in Expo Go;
- the app reaches the QA API over LAN/HTTPS;
- auth refresh works under concurrent 401 responses;
- Android and iOS keyboard, autofill, permission and lifecycle behavior are correct;
- the assigned Jira screens are implemented.

## 6. `OMTS-133` gap analysis

### Expo Router auth stack versus app stack

Status: **not implemented**.

Required work includes session bootstrap, route groups and deterministic redirects for signed-out, gated and fully authenticated states.

### Tokens in SecureStore

Status: **dependency installed; behavior not implemented**.

Required work includes a token repository, atomic write/read/delete behavior, corrupted-value handling and protected-cache cleanup.

### API client and refresh

Status: **not implemented**.

Required work includes base URL validation, bearer injection, problem-response parsing, a single-flight refresh coordinator and one controlled retry of the failed request.

### Permission-aware navigation

Status: **not implemented**.

Required work includes mapping `/api/me/permissions` to visible features and zone scope while keeping backend authorization as the final boundary.

### Message catalog

Status: **only MSG07 exists**.

Required work includes typed codes, parameter rendering and a safe fallback for unknown backend codes.

### Offline banner MSG07

Status: **implemented as the first slice, device behavior not yet verified**.

### Expo Go against QA API

Status: **not verified**.

The QA base URL and test-account matrix are not stored in the repo. Secrets must not be committed; the team still needs a documented non-secret QA endpoint and account-handling process.

## 7. Jira status versus implementation evidence

Jira currently marks `OMTS-133` as `Done`. The repository evidence shows only the connectivity slice and SecureStore installation. Therefore:

- `Done` is the Jira workflow state;
- the code-level acceptance criteria are not fully met;
- the plan must finish the missing acceptance criteria without silently rewriting Jira history;
- any Jira correction should be discussed with the team rather than changed automatically.

`OMTS-151` is `In Progress`, but no SCR-02 implementation exists in the repository. All other assigned Mobile auth/account tickets are `To Do`.

## 8. Current backend integration readiness

### 8.1 Endpoints that exist

The current backend exposes:

- `POST /api/auth/login`;
- `POST /api/auth/refresh`;
- `POST /api/auth/logout`;
- `GET /api/me`;
- `GET /api/me/permissions`.

The login/refresh response already contains:

- access token and expiry;
- refresh token and expiry;
- account ID and display name;
- subject type;
- `mustChangePassword`;
- `phoneVerificationRequired`.

The permission payload already represents functions, actions, all-zone access, explicit zone IDs and the underlying zone–role grants. This is sufficient to design a permission adapter without inventing a single global role.

### 8.2 Endpoints that do not exist yet

No current controller implements:

- trader registration;
- creating/resending/verifying a verification challenge;
- account recovery;
- changing a password;
- onboarding completion/status;
- personal profile load/update;
- notification preference load/update;
- push-token registration.

Those screens can be designed and implemented against frontend contracts/mocks, but cannot satisfy “works against QA API” until backend contracts exist.

### 8.3 Contract risks to resolve before real integration

1. **Mobile client type encoding.** Backend defines `ClientType.Web` and `ClientType.Mobile`, but no JSON string-enum converter is configured. The team must publish whether the request sends `1` or the string `"Mobile"`. The recommended external contract is the explicit string `"Mobile"`; Mobile must not hard-code an undocumented numeric enum.

2. **Temporary-password lifetime conflict.** Current SRS/backend code use 24 hours. The later decision accepted by Duy Thái says 72 hours. Frontend should display no hard-coded number until BA/backend reconcile the source and response contract.

3. **First-login contact correction conflict.** Older UC02 text lets Staff enter another number during first login. The later approved decision says Staff cannot edit contact during onboarding; the Owner corrects it and the old challenge is cancelled. Mobile should follow the approved decision, but backend endpoints must support it.

4. **Post-login discriminator.** Backend currently returns two booleans rather than a `nextAction` enum. The approved order is password change first, then contact verification, then app access. Frontend can encapsulate this order in one resolver, but the backend team should confirm the response is stable.

5. **Offline logout revoke.** Jira requires the local session to disappear immediately and server revoke to be queued. The queue storage, idempotency key, retry lifetime and behavior after app reinstall are not specified.

6. **QA API reachability.** The repository contains an empty base URL and the backend checkout uses HTTPS redirection. Physical Expo Go testing needs a reachable QA HTTPS URL or an agreed LAN development configuration.

7. **Push notifications and Expo Go.** `expo-notifications` is not installed. Before implementation, SDK 57 documentation and current Expo Go limitations must be checked; a development build may be required for token registration even if permission-state UI can be exercised in Expo Go.

## 9. Architecture and quality risks

### High priority

- Jira foundation status does not match code evidence.
- No session state machine exists, so route guards and post-login gates have no single source of truth.
- No refresh coordinator exists; naïve per-request refresh would create token races.
- Most required backend endpoints are absent.
- No automated test runner is configured.

### Medium priority

- The message catalog has no parameter renderer or unknown-code fallback.
- Environment configuration is not validated at startup.
- CI checks only lint and typecheck; it does not run Expo Doctor, tests or an export smoke check.
- No design tokens or reusable form primitives exist, increasing the chance that each screen develops inconsistent spacing, errors and loading states.

### Low priority

- The starter image assets remain even though most are unused.
- The root header title is hard-coded to `OMTS` and will need screen-specific configuration.
- `@expo/ui`, glass and symbol packages are installed but have no established role in the current design system; they should not drive the design merely because they are present.

## 10. Recommended next action

Use `docs/MOBILE_IMPLEMENTATION_PLAN.md` as the execution order. Start with the contract/foundation phase, not with visual screen generation. Each micro-task should remain small enough to review, explain and verify independently.

No application code was changed during this audit.

## 11. Post-audit implementation note

The first approved coding slice subsequently added `src/shared/config/runtime-config.ts`, which validates and normalizes `EXPO_PUBLIC_API_BASE_URL` lazily. It does not yet create an HTTP client or call the backend. During verification, Expo Doctor requested newer SDK 57 patch releases, so the package set was aligned with `npx expo install --fix`. See `docs/MOBILE_IMPLEMENTATION_PLAN.md` for the current execution log.
