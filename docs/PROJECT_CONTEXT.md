# OMTS Mobile — current project context

> Update this summary when Jira, the current SRS, or an approved team decision changes. Planned work is not evidence that a feature has already been implemented.

## Product and actor boundary

OMTS supports Trung Nam Aquaculture Cooperative in managing farming zones, oyster cultivation, sales, traceability, employees, attendance, payroll, and related costs.

Current actors are System Administrator, Cooperative Owner, Staff, Zone Manager, Accountant, Trader, and QR Viewer. The current SRS does not define Household, Household Member, Farmer, or Worker as separate actors. Use the current SRS terminology in navigation, permissions, mock data, and UI copy.

Internal Staff accounts can receive multiple zone-role grants. An account can therefore have different permissions in different farming zones; Mobile navigation must eventually use effective permissions and scope rather than assume one global role.

## Canonical repository topology

OMTS uses three official repositories:

- `thaideptrai218/omts-web`: Next.js Web portal and public QR provenance.
- `thaideptrai218/omts-mobile`: this Expo/React Native field application.
- `thaideptrai218/omts-backend`: .NET backend API.

The repositories release independently. Shared contracts require an explicit team-approved synchronization mechanism; they cannot be imported from an assumed local monorepo.

## Source priority

1. Current Jira issue: sprint scope, owner, dependencies, and done criteria.
2. Current Report 3/SRS: actors, use cases, business rules, permissions, messages, and acceptance criteria.
3. Report 2: approved stack and project-management baseline.
4. OMTS Figma: visual structure and screen flow; it does not override business rules.
5. Historical reports/tracking: background only when they conflict with current sources.

## Confirmed Mobile foundation target

Jira `OMTS-133` requires:

- Expo Router auth and app route groups.
- Token storage using `expo-secure-store`.
- API client with refresh behavior.
- Navigation based on permissions.
- Shared message catalog behavior.
- Offline banner for `MSG07`.
- A build that runs in Expo Go against the QA API, with lint and typecheck passing.

## Current code status

### Latest approved integration slice — 22/10/2026

The user approved mock end-to-end assembly and the proposed session/offline handling. The app now has protected auth/onboarding/app route groups, process-memory mock sessions, controlled login, forced password change, verification of one declared email OR phone, a personal account summary and local-first logout. Refresh is single-flight and late responses cannot repopulate a logged-out session. Network errors retain credentials; no mutation queue is implemented.

Mock mode requires explicit `EXPO_PUBLIC_AUTH_MODE=mock`. It uses synthetic Staff fixtures only, does not contact the API or persist credentials/OTP/passwords, and resets on full app reload. The existing real SecureStore repository is unchanged and is not used to store fake tokens. Unconfigured real mode fails closed rather than falling back to mock. This does not authorize a new onboarding flow for Owner/Trader/Admin.

The routed account page is a session-summary entry, **not** a claim that profile editing, notification settings, recovery, QR or business screens have been wired. Application contracts are not confirmed backend DTOs. Review validation: 45 suites / 252 tests and Expo Doctor 21/21; see `docs/reports/MOBILE_SESSION_REVIEW_2026-10-22.md` for final quality gates. One P2 UX finding remains open: expired sessions return to login without carrying MSG19 across the route change (SESSION-UX-01). Earlier browser login/gates/logout/Back/direct-route checks passed; Expo Go/QA is still unverified.

### Component and API foundation details

- Expo 57.0.31, React Native 0.86, Expo Router 57.0.29, and strict TypeScript are configured. Expo packages pass the SDK compatibility checks from Expo Doctor.
- Typed routes and React Compiler are enabled.
- The root layout owns a connectivity provider and accessible global offline banner. The typed catalog now covers implemented profile, verification, login, recovery, password-change and notification-preference outcomes (MSG01/04/06/07/10/12/13/15/16/17/18/19/20/21/22/23/67/68/69) without displaying raw server prose; MSG07 deliberately does not promise an offline mutation queue. Connectivity transitions and banner visibility have automated tests; physical-device transitions remain unverified.
- Connectivity is isolated through domain, repository and service boundaries. The Expo Network adapter maps native `online/offline/unknown` state without letting UI components call the native module directly.
- `expo-secure-store` is installed and configured for SDK 57. A versioned token repository is implemented and tested. Real login persistence, authenticated API decoration and scoped feature navigation remain unintegrated; mock bootstrap/refresh and route gates are assembled separately as described above.
- Backend was re-fetched for the session review: develop `c5360ca` contains domain/schema but not auth controllers. Feature `7a41aa6` adds raft coordinates, repository/Unit of Work refactoring and audit service compared with the old `14d7839` auth baseline; HTTP auth DTOs still use the old booleans/phone-only gate, 24-hour temporary-password lifetime and inconsistent enum representation. The audit serializer's string-enum converter is not an HTTP serializer change. No real Mobile API integration is enabled. See `docs/reports/BACKEND_READINESS_RECHECK_2026-10-22.md`.
- A tested unauthenticated fetch transport and ProblemDetails parser now handle JSON/no-content responses, safe URL joining (including encoded traversal rejection), timeout/cancellation and privacy-safe failures. They deliberately do not attach tokens or refresh sessions while the auth contract remains unresolved.
- OMTS-151 has a tested SCR-02 presentation, six-digit field, purpose contract and foreground-aware countdown. It is now routed through the explicit mock Staff-onboarding wrapper with attempt/send/expiry limits; real endpoint adapters and the other calling flows remain pending. No real verification token is fabricated or persisted.
- OMTS-155 now has a tested controlled SCR-01 presentation, Email/Phone selector and pure form contract for confirmed password rules. No identifier regex, endpoint call, method-switch data deletion or fake route has been invented while the canonical backend registration contract is absent.
- OMTS-160 has a tested controlled SCR-03 login presentation and required-only credential validation. It is now routed with mock session creation and the approved Staff gate priority. Real SecureStore persistence, API message outcomes and feature-permission navigation remain pending backend contracts.
- OMTS-164 now has tested recovery-request and new-password presentations plus a recovery-completion controller that prevents duplicate submission and clears secrets on terminal results or back navigation. The shared password policy preserves exact password input and is reused by trader registration. The missing SCR-02 wrapper and real completion adapter still require an opaque recovery-attempt contract; Mobile does not fabricate or persist a local recovery token.
- OMTS-168 has a tested normal/forced password presentation and controller, now routed in the mock flow. Forced mode cannot bypass the app-stack gate; standard mode supports cancel. Verified-email alternative proof and the real mutation/session policy remain unimplemented.
- OMTS-172 now has tested profile presentation and load/save controller behavior, skeleton/retry, read-only username, MSG06/MSG20 and immediate form removal on session expiry. The application-only save contract carries displayName and an opaque revision. Conflict preserves the draft and blocks blind retries; only explicit successful reload replaces it. Contact-change actions remain delegated to separate verification flows. Real endpoint/concurrency mapping, contact wrappers, protected routing and QA evidence remain open.
- OMTS-176 M11.1/M11.2/M11.3 and the frontend part of M11.5 now have a tested server-driven notification matrix, narrow-screen SCR-06 cards, explicit OS permission request, mock persistence and a controller for load/draft/cancel/save/session-expiry transitions. `expo-notifications` is isolated behind a permission repository. Remote token registration is not complete: Expo Go on Android does not support remote push in SDK 57, the app has no EAS project ID, backend `OMTS-174` exposes no registration endpoint and BA catalog `OMTS-124` is still To Do.
- OMTS-180 now has a versioned Expo SecureStore token repository, local-first logout service, online `/api/auth/logout` adapter and a tested confirmation controller that prevents duplicate submissions. Every local cleanup is attempted even if an adapter throws synchronously. A 401 or unreadable token reports revoke failed, because neither proves that the backend refresh session ended. Route replacement/cache adapters/cleanup-failure recovery/QA evidence remain open; deferred offline revoke is blocked by the missing opaque idempotent revoke contract.
- M13 hardening has started: field errors expose semantic alerts, locked notification switches expose their reason, large-text card headers wrap and long button labels can avoid clipping. GitHub CI includes Jest after lint/typecheck; its triggers cover main/develop pushes and PRs targeting those branches, so a feature-only push does not provide runner evidence. Physical TalkBack/VoiceOver and maximum-font checks remain pending.
- Notification hardening now prevents duplicate save/permission requests, preserves concurrent progress flags, avoids callback-triggered draft loss and removes editable settings on explicit session expiry. Late permission completion cannot restore expired settings. App-wide session teardown is still an integration task.
- Full batch review added request lifetime protection, callback/service error separation, stale-source regressions, honest logout revoke results and permission copy that does not claim an unsaved preference was saved. `expo-notifications` is now ~57.0.24 as required by the SDK compatibility check.
- The latest session-assembly validation supersedes the earlier 40-suite/223-test scaffold baseline. It exercises the explicit mock end-to-end flow, not a real authenticated API app. The earlier baseline remains in `docs/reports/MOBILE_FULL_REVIEW_2026-10-22.md`; current evidence is in the session-assembly report.
- Latest Expo Doctor during session assembly: 21/21 checks pass; the earlier exp.host DNS failure did not recur. The previous npm audit findings (53 flagged packages including propagated tooling findings) have not been fixed or reclassified by this slice. Expo Go/device/QA API and physical accessibility remain unverified.

Do not report `OMTS-133` as complete based on the scaffold alone.

## Review follow-up order

1. Address SESSION-UX-01 (carry the expired reason to login/MSG19) as a small UI fix, with component regressions. It is recorded, not implemented by the review request.
2. Assemble the existing profile and preferences controllers through explicit mock adapters, one slice at a time; do not invent missing contact/recovery contracts.
3. Native/Expo Go QA; wire real auth only after a backend QA ref/URL/OpenAPI and reconciled gates are confirmed.

Current Jira check read OMTS-133 as Done and OMTS-121 as In Progress, but no QA completion is inferred. Direct reads of OMTS-151/160/168/180 returned 404 in this review; their old statuses are not treated as current evidence. No Jira writes were made.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Backend approval of the proposed string wire values for Mobile `clientType`, login `subjectType` and permission `dataScope`.
- QA evidence that a Mobile login creates the intended Mobile session and lifetime.
- The final post-login gate response (`nextAction + onboarding` versus the backend's current booleans).
- `/me/permissions` payload stability, especially zone scope and all-zone access.
- Canonical Vietnamese/English message catalog.
- Canonical UC06 notification catalog and channel wire values. SRS names in-app/push/email/Zalo OA, while the current backend enum contains InApp/Push/Email/Sms.
- Push-token registration endpoint/payload, EAS `projectId`, credentials and development-build QA path. Android remote push cannot be validated in Expo Go on SDK 57.
- Deferred offline logout revoke handle, expiry, retry and idempotency contract. Mobile must not preserve the live refresh token after local logout merely to retry later.
- Final Vietnamese wording for `MSG07`; the current banner copy is deliberately narrower than the SRS message because offline draft persistence/synchronization is not implemented by this foundation slice.
- Broader offline business behavior remains undecided. The user approved retaining credentials on network errors, retrying session checks and not creating a business mutation queue in this slice.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
