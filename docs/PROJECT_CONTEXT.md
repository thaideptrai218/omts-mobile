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

### Contact-change review and backend refresh — 23/10/2026

User requested review/report/commit/push current mobile branch only, no develop merge. **OPEN P2 CONTACT-REV-01** supersedes the assembly's no-P2 conclusion: mock replaces contact/deletes OTP attempt before awaiting profile load; a failing read leaves UI at OTP with MSG04 claiming unchanged data although the new contact already works and the old one does not. Source characterization and an explicit ignored failing acceptance probe reproduce it. No runtime fix applied by this review; report section R has proposal/acceptance. Delivery does not mean merge-ready or P2 closed.

Added five tests (four retry/scope regressions and one defect characterization). Latest **59 suites / 410 tests PASS**, lint/typecheck/export and Doctor **21/21** pass; explicit CONTACT-REV-01 probe **FAIL** outside normal discovery. Browser/device/API not rerun. Learning/probe stay local. Fresh OMTS-172 read 404, no Jira writes. See `docs/reports/MOBILE_CONTACT_CHANGE_ASSEMBLY_2026-10-23.md` R and local lesson 54.

Backend source refresh: develop remains c5360ca; ACS feature **27a8673** now has registration/OTP/recovery/password/profile/contact/preferences/devices endpoints and HTTP enum names. Notification Zalo is offered but ineligible; Sms is legacy. Format normalizers now exist as implementation candidates. These remove old missing-source-endpoint assumptions, not real integration/QA blockers. Open PR stack #5–#13, no QA deployment confirmed; ACS #7 rollup has GitGuardian failure with cause unverified and no build-test result observed at that head. Local .NET 8.0.418 is absent (only 10.0.103), no feature runtime tests run here. Gate remains phone-only; contact confirm lacks baseline revision/full profile, Trader calls Customer linker, recovery reset source lacks explicit current-contact binding recheck. Do not silently adapt those business mismatches. See `docs/reports/BACKEND_READINESS_RECHECK_2026-10-23.md` for SHAs, source links and specific BA/backend proposals.

### Approved profile contact-change mock assembly — 23/10/2026

User approved adding/replacing email/phone by mock, with no Customer/Order linkage. `/account` now opens a channel-specific contact form and purpose-bound OTP; correct verification saves the new contact immediately per UC05, without an extra account-creation step. Old contact remains active before success. Cancel/wrong/expired/offline and conflicts do not overwrite it. Duplicate and revision are rechecked before the mock write; canonical format rules remain unconfirmed.

The contact editor is a child screen inside the existing protected account route; the profile controller stays alive and retains an unsaved display-name draft. Canonical contact/revision update lets the draft save afterward; a concurrently changed server name keeps the draft but requires explicit MSG06 reload. AccountSessionScope accepts only canonical masked contacts for the current session/account generation. No permission, username, token policy or Customer/history change.

Verified Staff and Trader contact aliases use the same mock login/recovery map; replacement removes the old alias. Outstanding recovery code/proof rechecks its current verified binding before use, so an old contact no longer resets the account. No blanket session revocation is introduced by contact replacement. MSG62 now provides masked-email verification guidance; raw targets/OTPs remain process-memory mock only, not URL/storage/log data.

Assembly baseline was **59 suites / 405 tests PASS**, including 3 new suites/32 tests (13 gateway, 8 service, 11 component flow). Lint/typecheck/export and Doctor 21/21 passed; import/first warnings fixed. Its no-P2 conclusion is **superseded by CONTACT-REV-01 above**. Browser/device/API were not run; full format/audit/delivery/Customer/native postconditions remain open. OMTS-172/151/141 returned 404. Report `docs/reports/MOBILE_CONTACT_CHANGE_ASSEMBLY_2026-10-23.md`, local lesson 53; subsequent requested delivery/review is recorded above and in report R.

### Approved Trader registration mock assembly — 23/10/2026

User approved registration with **no Customer/profile/order linkage**. `/login` now opens `/register` → shared OTP → explicit account-creation confirmation → success/login. A shared process-memory auth source creates a Trader only after valid registration-purpose proof and confirmation; login accepts its verified identifier. No auto-login, internal grants, Customer or Order is created. Session subjectType distinguishes Staff/Trader internally (not an agreed wire enum); own profile labels correctly and uses entered identifier as initial display-name fallback rather than an invented personal name. Username `mock-trader-*` is mock technical data, not a product naming decision.

Registration service keeps proof outside route/storage/UI props, cancels on restart/unmount and ignores stale responses; no offline queue/auto-create. Generic MSG14 routes to login/recovery; duplicate checked again at creation. Email/phone drafts remain separate; submitted password fields clear. Staff-only example notification catalog is not exposed to Trader; this does not decide the real Trader notification catalog. Existing Staff auth/profile/recovery regressions remain green. Canonical identifier format remains unconfirmed; current mock does not implement new format rules.

After explicit approval, **P3 REG-REV-01 is CLOSED in the client/mock scope**. Invalid/expired confirmation now returns the same empty registration form with contextual title “Cần đăng ký lại” and instructions to re-enter information and verify again. Shared MSG16 at the OTP screen, MSG14 for unavailable registration, offline behavior, proof TTL and guards are unchanged. Report section S supersedes the open-finding history in R.

Latest **56 suites / 373 tests PASS**, lint/typecheck/export and Doctor **21/21** pass. Two expiry acceptance cases first failed on old code, then passed; both require fresh verification/explicit create and prohibit automatic start/create. Added unavailable-completion mapping coverage. No new reproduced finding in the narrow fix. User requested commit/push current feature only, no develop merge. Jira OMTS-155/151 freshly returned 404; no Jira/SRS/backend writes.

Browser form navigation, empty validation, 360 CSS px and radio checked-state evidence belong to the prior assembly, not a rerun by the review/fix. Account creation/login is automated component evidence, not browser credential entry or Expo Go evidence. Report `docs/reports/MOBILE_TRADER_REGISTRATION_ASSEMBLY_2026-10-23.md`; local lessons 50/51/52. Real API/native acceptance, format rules and excluded Customer linkage remain open; do not claim full UC01 Done.

### Approved recovery P2 fixes — 23/10/2026

User authorized fixing REC-REV-01/02 and delivering on the current feature branch without merging develop. Both findings are now **closed within the mock/client scope**: each issued OTP expires five minutes after its own send timestamp, independently of the existing rate-limit window; gateway offline outcome retains the current proof for manual retry without extending expiry or reviving a disposed flow. Terminal outcomes still clean up; passwords still clear and are never queued/persisted. No auth policy, permissions, navigation or UI redesign was introduced.

Added 12 source regressions (6 gateway/4 service/2 form-flow); red-before/green-after evidence and the two former probes now pass. Latest gates **53 suites / 334 tests PASS**, lint/typecheck/web export, Doctor **21/21** pass. Self-review found no remaining reproduced P1/P2 in the two fixes, not a claim of production completeness. Browser/device were not rerun. Jira OMTS-164 still 404; no Jira/SRS/backend writes. See section S of `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md`; ignored local lesson 49. The earlier open-P2 review below is historical; real API/native acceptance remains pending.

### Recovery re-review — 23/10/2026, supersedes initial no-P2 conclusion

Current user requested review/report/commit/push on `feature/OMTS-133-mobile-foundation`, no develop merge. Review found two reproducible **open P2** issues: REC-REV-01 resend code expiry is anchored to the first rate-limit window rather than five minutes from its own send; REC-REV-02 gateway `offline` outcome resets proof and breaks manual retry (the existing pre-call offline branch still works; default mock does not itself emit that gateway outcome). No runtime fix was authorized/applied by this review. See section R of `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md` for reproduction, expected/actual, proposed fixes and acceptance.

Two explicit ignored local probes fail, while three added late verify/resend/infrastructure regressions pass. Latest normal suite **53 suites / 322 tests PASS**, lint/typecheck/export, Doctor **21/21** pass; these exclude the two probes and do **not** mean either defect is fixed. Browser/device were not rerun; earlier screenshot evidence remains assembly evidence only. Fresh OMTS-164 read returned 404, no Jira writes. Learning/probes remain local. M7 should not be called merge/acceptance-ready; branch delivery is not a production sign-off.

### Approved recovery mock assembly — 23/10/2026

User approved assembling forgot password with mock before real API work. `/login` now links to `/recovery`, reusing the request, verification and new-password screens. A route-scoped service holds the opaque recovery proof outside UI props/URLs/storage; leaving/changing contact cancels it and stale responses cannot restore it. Public MSG15 and challenge metadata do not distinguish eligible, unknown, unverified, throttled or simulated delivery-failed contacts. Only the verified, exactly entered synthetic contact can yield a proof. No real email/SMS or production account-status/audit model is claimed.

Completion changes the shared mock auth password, revokes all old leases for that account, preserves profile/grants/preferences and requires explicit login. Other accounts retain their sessions. An old app session tears down with MSG19 on its next protected request, not via server push. Offline does not queue/retry automatically; password fields clear after an offline completion attempt while an unexpired proof permits manual retry. Codes rotate on resend; cooldown and proof TTL are mock-only configuration. Full app reload resets fixtures, budgets and credentials.

Review fixed a captured-clock reference and explicitly configured foreground AppState in the integration-test boundary; recovery recipient copy no longer claims actual delivery. Latest gates: **53 suites / 319 tests**, lint/typecheck/web export and Doctor **21/21** pass. Browser request→OTP→empty new-password form, return/reopen and 360 CSS px overflow checked. Browser password submission, real API, physical devices and native Back remain unverified. Jira OMTS-164/139/151 direct reads returned 404 and search returned 502; no Jira status was inferred or changed. See `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md`; local-only lesson 47. No commit/push/merge requested or performed in this slice.

### Combined account-flow review — 23/10/2026

Reviewed MSG19, personal profile and notification preferences together. Added seven cross-feature store/service regressions for independent persistence, credential rotation, shared expiry, late successful/expired responses and cleanup retry preserving MSG19. No new P1/P2 finding was reproduced in the checked mock cases; no runtime/business changes were made by this review. Latest local gates: **50 suites / 292 tests**, lint/typecheck/web export and Expo Doctor **21/21** pass. Prior browser/360 CSS px evidence remains dated 22/10; browser/device/QA API were not rerun by the source/test review. See `docs/reports/MOBILE_ACCOUNT_ASSEMBLY_REVIEW_2026-10-23.md`. User requested commit/push on the current feature branch only, no develop merge. API/native/catalog limitations below remain open.

### Latest approved integration slice — 22/10/2026

The user approved mock end-to-end assembly and the proposed session/offline handling, then explicitly requested MSG19 and personal-profile assembly. The app now has protected auth/onboarding/app route groups, process-memory mock sessions, controlled login, forced password change, verification of one declared email OR phone, editable personal displayName and local-first logout. Refresh is single-flight and late responses cannot repopulate a logged-out session. Network errors retain credentials; no mutation queue is implemented.

Mock mode requires explicit `EXPO_PUBLIC_AUTH_MODE=mock`. It uses synthetic Staff fixtures only, does not contact the API or persist credentials/OTP/passwords, and resets on full app reload. The existing real SecureStore repository is unchanged and is not used to store fake tokens. Unconfigured real mode fails closed rather than falling back to mock. This does not authorize a new onboarding flow for Owner/Trader/Admin.

The `/account` route now uses the existing profile controller with a shared mock-auth/profile account source. Only displayName is editable; username, account type, grants and masked contacts are read-only. Password navigation, notification preferences and logout work; contact replacement is not wired and has no placeholder actions. Service capabilities are bound to both accountId and session generation, including automatic expiry. Revision conflicts retain the draft; offline shows MSG07 without auto-save/queue. Application contracts are not confirmed backend DTOs.

SESSION-UX-01 is now fixed: expired teardown carries an in-memory reason to login/MSG19; explicit logout does not. Cleanup retry preserves the reason, which is dismissed on a new login attempt/input. Latest validation: **47 suites / 268 tests**, lint/typecheck/web export and Expo Doctor **21/21** pass. Browser profile save, password cancel, logout/relogin and 360 CSS px layout passed. See `docs/reports/MOBILE_MSG19_PROFILE_ASSEMBLY_2026-10-22.md`. Expo Go/QA API and device accessibility remain unverified.

Subsequent approved slice: `/notification-preferences` is wired from the account page with a session-scoped mock gateway and per-account process-memory persistence. It reuses the existing controller/repository, supports save/cancel/retry, MSG07 without auto-save and expired teardown/MSG19. Only synthetic field-use in-app/email examples are included, with mandatory and verified-contact locks. Device permission is explicitly unavailable: no OS prompt, fabricated grant/denial, push registration or delivery. Latest validation supersedes the profile baseline: **49 suites / 285 tests**, lint/typecheck/export and Doctor **21/21** pass; browser save/cancel/direct protected URL and 360 CSS px checked. See `docs/reports/MOBILE_NOTIFICATION_ASSEMBLY_2026-10-22.md`.

### Component and API foundation details

- Expo 57.0.31, React Native 0.86, Expo Router 57.0.29, and strict TypeScript are configured. Expo packages pass the SDK compatibility checks from Expo Doctor.
- Typed routes and React Compiler are enabled.
- The root layout owns a connectivity provider and accessible global offline banner. The typed catalog now covers implemented profile, verification, login, registration, recovery, password-change and notification-preference outcomes (MSG01/04/06/07/10/12/13/14/15/16/17/18/19/20/21/22/23/62/67/68/69) without displaying raw server prose; MSG07 deliberately does not promise an offline mutation queue. Connectivity transitions and banner visibility have automated tests; physical-device transitions remain unverified.
- Connectivity is isolated through domain, repository and service boundaries. The Expo Network adapter maps native `online/offline/unknown` state without letting UI components call the native module directly.
- `expo-secure-store` is installed and configured for SDK 57. A versioned token repository is implemented and tested. Real login persistence, authenticated API decoration and scoped feature navigation remain unintegrated; mock bootstrap/refresh and route gates are assembled separately as described above.
- Backend recheck 23/10 supersedes the old 7a41aa6 inventory: develop c5360ca still lacks the auth stack, but ACS@27a8673 includes account self-service APIs and HTTP JsonStringEnumConverter. Booleans/phone-only gate and 24-hour temporary password remain; no real Mobile adapter enabled. Read `docs/reports/BACKEND_READINESS_RECHECK_2026-10-23.md`, not the historical missing-endpoint conclusions in the 22/10 report, for current readiness.
- A tested unauthenticated fetch transport and ProblemDetails parser now handle JSON/no-content responses, safe URL joining (including encoded traversal rejection), timeout/cancellation and privacy-safe failures. They deliberately do not attach tokens or refresh sessions while the auth contract remains unresolved.
- OMTS-151 has a tested SCR-02 presentation, six-digit field, purpose contract and foreground-aware countdown. It is now routed through the explicit mock Staff-onboarding wrapper with attempt/send/expiry limits; real endpoint adapters and the other calling flows remain pending. No real verification token is fabricated or persisted.
- OMTS-155 now has a tested controlled SCR-01 presentation, Email/Phone selector and pure form contract for confirmed password rules. No identifier regex, endpoint call, method-switch data deletion or fake route has been invented while the canonical backend registration contract is absent.
- OMTS-160 has a tested controlled SCR-03 login presentation and required-only credential validation. It is now routed with mock session creation and the approved Staff gate priority. Real SecureStore persistence, API message outcomes and feature-permission navigation remain pending backend contracts.
- OMTS-164 now has tested request/OTP/new-password mock assembly at `/recovery`, with separate recovery-purpose challenges, private one-use proof, resend/cancel/expiry guards, shared password policy, old-lease revocation and explicit login. No proof/token is persisted. The application-only contract and process-memory mock are not a real recovery endpoint contract; delivery, production audit/status eligibility and QA acceptance remain open.
- OMTS-168 has a tested normal/forced password presentation and controller, now routed in the mock flow. Forced mode cannot bypass the app-stack gate; standard mode supports cancel. Verified-email alternative proof and the real mutation/session policy remain unimplemented.
- OMTS-172 now has tested profile presentation and load/save controller behavior, skeleton/retry, read-only username, MSG06/MSG20 and immediate form removal on session expiry. It is routed at `/account` through a session-bound mock service with shared-fixture revision conflicts. The ordinary save contract carries displayName and an opaque revision; contact mutation uses its own verified flow, now assembled by explicit mock approval. Conflict preserves drafts and blocks blind retries. Real endpoint/concurrency mapping, canonical format and native/API QA remain open.
- OMTS-176 M11.1/M11.2/M11.3 and frontend M11.5 have a tested notification matrix and session-isolated mock route, deliberately using unavailable device permission instead of making OS calls. Remote token registration is incomplete: ACS@27a8673 now supplies /api/me/devices, but QA/canonical catalog/EAS/native integration are still pending. Older Jira reads are historical, not verified current status.
- OMTS-180 now has a versioned Expo SecureStore token repository, local-first logout service, online `/api/auth/logout` adapter and a tested confirmation controller that prevents duplicate submissions. Every local cleanup is attempted even if an adapter throws synchronously. A 401 or unreadable token reports revoke failed, because neither proves that the backend refresh session ended. Route replacement/cache adapters/cleanup-failure recovery/QA evidence remain open; deferred offline revoke is blocked by the missing opaque idempotent revoke contract.
- M13 hardening has started: field errors expose semantic alerts, locked notification switches expose their reason, large-text card headers wrap and long button labels can avoid clipping. GitHub CI includes Jest after lint/typecheck; its triggers cover main/develop pushes and PRs targeting those branches, so a feature-only push does not provide runner evidence. Physical TalkBack/VoiceOver and maximum-font checks remain pending.
- Notification hardening prevents duplicate save/permission requests, preserves concurrent progress flags, avoids callback-triggered draft loss and removes editable settings on explicit session expiry. Late permission completion cannot restore expired settings. App-wide session teardown is now wired and tested for the mock preferences route; native permission and real API acceptance remain separate.
- Full batch review added request lifetime protection, callback/service error separation, stale-source regressions, honest logout revoke results and permission copy that does not claim an unsaved preference was saved. `expo-notifications` is now ~57.0.24 as required by the SDK compatibility check.
- The latest session-assembly validation supersedes the earlier 40-suite/223-test scaffold baseline. It exercises the explicit mock end-to-end flow, not a real authenticated API app. The earlier baseline remains in `docs/reports/MOBILE_FULL_REVIEW_2026-10-22.md`; current evidence is in the session-assembly report.
- Latest Expo Doctor during session assembly: 21/21 checks pass; the earlier exp.host DNS failure did not recur. The previous npm audit findings (53 flagged packages including propagated tooling findings) have not been fixed or reclassified by this slice. Expo Go/device/QA API and physical accessibility remain unverified.

Do not report `OMTS-133` as complete based on the scaffold alone.

## Review follow-up order

1. Completed after explicit approval: SESSION-UX-01 and existing profile controller assembly through a shared, session-scoped mock adapter. Keep the new regressions when changing auth or profile.
2. Completed after subsequent approval: preferences mock wrapper with session-bound service, honest unavailable push state and documented example catalog. Do not call the mock catalog a confirmed backend catalog.
3. Recovery wrapper assembled and REC-REV-01/02 fixed; registration assembled and REG-REV-01 closed. Contact-change mock now approved/assembled separately; keep its identity/recovery/draft/lifetime regressions. These client slices do not complete real API/native acceptance.
4. Native/Expo Go QA; wire real auth only after a backend QA ref/URL/OpenAPI and reconciled gates are confirmed.

Current Jira check read OMTS-133 as Done and OMTS-121 as In Progress, but no QA completion is inferred. Direct reads of OMTS-151/160/168/180 returned 404 in this review; their old statuses are not treated as current evidence. No Jira writes were made.

For the subsequent profile slice, Jira search returned 502 and direct OMTS-172/141 reads returned 404 `Issue not found`; their current scope/status could not be verified. OMTS-133 remained readable as Done. The slice follows the user's explicit mock approval and UC05/current controller, not an inferred ticket update. No Jira writes were made.

For notification assembly, direct OMTS-176/174 reads returned 404. OMTS-124 was readable as To Do, updated 22/10/2026: it renames legacy UC06 to **ACS-07 Set notification preferences** and distinguishes ACS-08 viewing notifications; parent epic OMTS-118 is In Progress. The local Report3Finnal.md still uses UC06/SCR-06. Record this identifier difference for reconciliation, not as approval of a new catalog or scope. No Jira/SRS writes were made.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Confirm QA deploys the observed HTTP enum-name contract (including clientType Mobile) and reconcile permission scopes; source now supplies the names, so this is no longer a claim that HTTP string enums are absent.
- QA evidence that a Mobile login creates the intended Mobile session and lifetime.
- The final post-login gate response (`nextAction + onboarding` versus the backend's current booleans).
- `/me/permissions` payload stability, especially zone scope and all-zone access.
- Canonical Vietnamese/English message catalog.
- Canonical preferences category mapping: ACS offers InApp/Push/Email/Zalo, with Zalo unconfigured and Sms legacy. Reconcile real subject-specific categories with the mock catalog; do not hide real Trader preferences because the old mock is Staff-only.
- QA approval of /api/me/devices payload and EAS projectId/credentials/development-build QA path. Endpoint now exists in source; Android remote-push acceptance remains separate from Expo Go foundation smoke tests.
- Deferred offline logout revoke handle, expiry, retry and idempotency contract. Mobile must not preserve the live refresh token after local logout merely to retry later.
- Final Vietnamese wording for `MSG07`; the current banner copy is deliberately narrower than the SRS message because offline draft persistence/synchronization is not implemented by this foundation slice.
- Broader offline business behavior remains undecided. The user approved retaining credentials on network errors, retrying session checks and not creating a business mutation queue in this slice.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
