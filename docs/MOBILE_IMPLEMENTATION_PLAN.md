# OMTS Mobile — detailed implementation plan

> Created: 22/10/2026
> Scope: assigned Sprint 6 Mobile foundation and auth/account screens
> Status: đang triển khai theo từng micro-task; execution log và báo cáo là bằng chứng thực hiện, còn mục chưa có bằng chứng vẫn chỉ là kế hoạch
> Primary repository: `thaideptrai218/omts-mobile`

## Execution log

### 23/10/2026 — approved REC-REV-01/02 fixes and regression delivery

- User explicitly requested both P2 fixes, regressions, self-review, report and commit/push current branch, no develop merge. Base `005d9e9`; fresh OMTS-164 read still 404, no Jira/SRS/backend writes. No UI redesign/native API or new session/offline-queue policy.
- REC-REV-01 **closed in mock**: separate code TTL and rate-window constants, calculate expiry from a single issuance timestamp. Existing send/cooldown/failure rules remain; crossing the first window does not refill the active code's attempts/sends. Old codes still cancel.
- REC-REV-02 **closed in client service**: do not reset proof for adapter offline outcome, but keep generation/dispose checks first and terminal cleanup intact. Password fields still clear and retry is manual; no TTL extension or queue.
- Added **12 source regressions**: 6 gateway, 4 service, 2 form-flow tests. Primary source tests first failed 3 cases on old code, then passed without weakening assertions. Both former local probes also pass; fixes no longer rely on untracked probes for regression coverage.
- Final gates: **53 suites / 334 tests PASS**, lint/typecheck/export, Doctor **21/21** pass. Self-review found no remaining reproduced P1/P2 in these two fixes. No browser/device rerun; actual form behavior is exercised in component tests. API/native acceptance remains open.
- Report section S: `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md`; ignored lesson 49. Commit/push current feature only; no merge/PR. Earlier open-finding review below is historical and superseded for REC-REV-01/02 only.

### 23/10/2026 — recovery re-review and requested branch delivery

- Reviewed the uncommitted recovery assembly against UC03/Table 3.4-3 and source; fresh OMTS-164 read still returned 404. No Jira/SRS/backend/UI/runtime edits in the review.
- **Open P2 REC-REV-01:** resend inherits first-window expiry, giving 240 seconds after a 60-second wait instead of five minutes from its own send. Separate code TTL from rate-limit window without refilling attempts.
- **Open P2 REC-REV-02 (adapter contract):** gateway offline outcome unconditionally resets proof, breaking explicit retry; pre-call connectivity offline still works. Retain valid proof for non-terminal offline, preserve dispose/expiry checks and password clearing. Default mock/browser occurrence is not claimed.
- Two explicit local probes fail and document expected/actual; three new late verify/resend/infrastructure regressions pass. Normal suite: **53 suites / 322 tests PASS**, lint/typecheck/export and Doctor **21/21** pass. Green regression does not close either finding. No browser/device rerun in this review.
- Report updated in `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md`, section R; ignored local lesson 48. M7 is **not merge/acceptance-ready** until fixes/regressions and remaining API/native acceptance. User authorized commit/push current feature branch only, no develop merge; delivery records are in the final handoff.

### 23/10/2026 — approved forgot-password mock assembly

- F1: re-read UC03/UC08/BR-31/NFR-01 and existing screens/controllers. Jira search returned 502; direct OMTS-164/139/151 reads returned 404. No ticket status inferred or edited; user explicitly approved this mock slice.
- F2: separate recovery gateway and route-scoped service. Generic MSG15/envelope, exact verified synthetic contact, purpose isolation, five-minute challenge window, five wrong entries, three sends, rotating resend codes; cooldown/proof TTL are mock configuration, not approved HTTP policy. Private proof is neither a login session nor a route/storage value.
- F3: `/login` → `/recovery` request → SCR-02 reuse → new password → success → explicit login. Shared mock auth password and account-specific lease revocation. Change-contact/unmount cancels; no fake actions or UI debug panels. Offline requires manual retry, never queued password mutation.
- F4: 12 gateway/integration + 5 service + 9 component/flow tests; one new default-clock regression in the existing verification suite. Fixed import-time Date reference, explicit foreground test boundary, separate discriminated state variants and neutral recovery recipient caption. Old store session clears with MSG19 after reset; other account remains valid.
- F5: **53 suites / 319 tests**, lint/typecheck/web export and Doctor **21/21** pass. Browser request/MSG15/OTP/new-password form/back/reopen and no overflow at 360 CSS px checked; reset submission is covered by automated tests, not browser credential entry. Report `docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md`; ignored local lesson 47.
- Complete only for mock M7 assembly. Real opaque HTTP attempt/proof, eligibility/status rules, delivery/audit, reset/revoke behavior, native Back and QA API/Expo Go remain pending. No SRS/Jira/backend writes, commit, push or develop merge this turn.

### 23/10/2026 — combined MSG19/profile/preferences review and feature delivery

- R1/R2: reviewed shared session lifetime, cleanup/MSG19 transport, profile revision/draft behavior, preferences canonical/draft and mandatory/eligibility locks; no new P1/P2 finding reproduced in the checked mock scope.
- R3: added seven cross-feature regressions in `account-services-integration-test.ts`; no runtime, business flow or new adapter changes in the review itself.
- R4: 50 suites / 292 tests, lint/typecheck/export and Doctor 21/21 pass. Browser/device checks were not rerun; earlier browser evidence is explicitly dated in the report.
- R5: report `docs/reports/MOBILE_ACCOUNT_ASSEMBLY_REVIEW_2026-10-23.md`, local-only learning note 46. Delivery requested on current feature branch, no merge/PR/Jira changes. Real API/native/catalog acceptance remains pending.

### 22/10/2026 — approved notification preferences mock assembly

- N1: re-read UC06/SCR-06 and current source; OMTS-124 remains To Do and now calls this ACS-07. OMTS-176/174 returned 404. Mock examples are not a canonical BA/API catalog.
- N2: account-scoped notification gateway plus session-generation-bound service; per-account process-memory repository, no storage/credential changes. Mandatory/email eligibility checked by mock repository; offline outcome does not queue or auto-save.
- N3: `/account` → `/notification-preferences` inside existing app guard. Real save/cancel/retry/back actions; loading/error have an exit. Push device state is unavailable with honest copy and no permission prompt; no fake push token/delivery or inbox.
- N4: self-review and two new suites (9 service + 8 component/flow tests): account isolation/relogin, mandatory/eligibility, offline, duplicate saves, expired load/save, stale service and late successful response.
- N5: 49 suites / 285 tests, lint/typecheck/web export, Expo Doctor 21/21 pass; browser save/cancel/direct protected URL and 360 CSS px checks. Report: `docs/reports/MOBILE_NOTIFICATION_ASSEMBLY_2026-10-22.md`; local lesson 45 stays ignored.
- No commit/push/merge or Jira/SRS/backend changes. Catalog, real preferences API, concurrency/eligibility refresh, native push registration and device QA remain pending; do not mark OMTS-176 complete from mock evidence.

### 22/10/2026 — approved MSG19 fix and profile mock assembly

User explicitly approved fixing MSG19 first, then assembling the personal profile with mock data. These micro-tasks are complete **within that mock scope**, not real API/Expo Go acceptance:

1. P1: preserve expired reason across teardown/login, distinguish explicit logout, dismiss on new login input/attempt; retain the reason through cleanup retry. Session store/flow regressions pass.
2. P2: share mock auth/profile account data; bind ProfileService to accountId + login generation; save displayName with opaque revision and accept only canonical returned names. Test offline, real mock revision conflict, stale services and late successful responses.
3. P3: replace `/account` summary with ProfileController, without adding a duplicate route. Keep skeleton/retry/pending/draft/conflict; wire password navigation and logout, including a logout escape on loading/error. Contacts/username/grants remain read-only; unassembled actions are absent rather than no-op.
4. P4: self-review automatic expiry generation and cleanup retry; add regression coverage. No business-flow/validation/permission/offline-queue changes.
5. P5: 47 suites / 268 tests, lint/typecheck, web export and Expo Doctor 21/21 pass. Browser save/password-cancel/logout/relogin and no horizontal overflow at 360 CSS px checked. Full evidence: `docs/reports/MOBILE_MSG19_PROFILE_ASSEMBLY_2026-10-22.md`.

SESSION-UX-01 is now closed in the mock flow; the earlier log below describes the pre-fix review. Local lesson 44 explains session generation versus profile revision and the real TypeScript test failure. Learning/screenshots stay ignored. No commit/push, merge, backend/SRS/Jira writes in this slice. Next candidate is a separate preferences mock wrapper; real adapters still require confirmed backend contracts and device QA.

### 22/10/2026 — session assembly review and backend recheck

- Reviewed the assembled mock flow and added seven service regressions: late bootstrap/password success, duplicate login, cleanup retry, transient refresh, standard password preservation and save-before-clear ordering.
- Full suite: 45 suites / 252 tests pass. Expo Doctor 21/21. Final lint/typecheck/export evidence is in `docs/reports/MOBILE_SESSION_REVIEW_2026-10-22.md`.
- Open P2 SESSION-UX-01: expired reason/MSG19 is lost across the return to login. Logged with a narrow proposed fix; not silently counted as complete or fixed in this review-only request.
- Fresh backend fetch distinguishes develop `c5360ca` from feature audit/refactor `7a41aa6`. New internal services/models do not provide the missing password/OTP/profile/recovery endpoints. See `docs/reports/BACKEND_READINESS_RECHECK_2026-10-22.md`.
- Recommended next slices: SESSION-UX-01 → profile mock wrapper → preferences mock wrapper/native QA. Real API end-to-end remains blocked by the documented backend/deployment contract requirements, not by the user's already-approved frontend decisions.
- Delivery remains current feature branch only, no merge to develop.

### 22/10/2026 — approved mock end-to-end assembly

User approved assembling routes/session mock before the real API adapter and the proposed session/offline handling. This approval unblocks the **mock** slice, not the pending backend wire contracts.

- S1: domain session/gateway/storage contract and synthetic Staff fixtures.
- S2: process-memory mock adapter, bootstrap, password/contact gates, single-flight refresh and local-first logout.
- S3: protected `(auth)` / `(onboarding)` / `(app)` groups; controlled login; forced password; email-or-phone verification; personal identity and security/logout entries.
- S4: integration tests across real controlled forms, service race/error tests, browser route checks and review report.
- Verification after review: 45 suites / 245 tests pass; lint/typecheck/web export pass; Expo Doctor 21/21; browser login/forced gate/account/security-cancel/logout/Back/direct protected URL checked, plus account width 360 CSS px. No real API/device acceptance is claimed.
- See `docs/reports/MOBILE_SESSION_ASSEMBLY_2026-10-22.md` for evidence and limitations. These are not QA API / Expo Go completion claims, and do not mark the whole M3/M6/M8/M12 or OMTS-133 Done.
- Next separate slices: real auth/session API adapter after contract confirmation; recovery/profile/preferences wrappers; permission-driven field-feature navigation; device/QA acceptance. No offline business mutation queue or deferred revoke contract has been invented.

### 22/10/2026 — first coding slice

- `M0.1`: reviewed and preserved the existing connectivity foundation; no unrelated working-tree change was discarded.
- `M3.1`: added a typed, lazy runtime-config boundary for `EXPO_PUBLIC_API_BASE_URL`.
- Verification passed: lint, strict TypeScript, Expo Doctor 21/21, web export smoke test and `git diff --check`.
- The API client, SecureStore token repository and session bootstrap remain unimplemented pending the contract decisions listed in M1.

### 22/10/2026 — M1.1 contract inventory

- `M1.1`: completed the current backend endpoint and wire-contract matrix in `docs/contracts/AUTH_API_CONTRACT_MATRIX.md`.
- Source and integration-test definitions were inspected at backend commit `14d7839`.
- Backend tests could not run locally because the repository requires .NET SDK `8.0.418`, which is not installed; no backend configuration was changed to bypass that requirement.
- `M1.2` has a concrete proposal but remains blocked at runtime by Backend confirmation of Mobile enum serialization; `M1.3` remains blocked by the post-login gate contract.
- Automated tests were not introduced in this slice because the repository has no test runner yet; parser tests belong to M13.1 or an explicitly approved earlier test-foundation slice.

### 22/10/2026 — M1.2 client identity proposal

- Prepared `docs/contracts/AUTH_ENUM_CONTRACT_PROPOSAL.md` for BA/Backend review.
- Proposed stable string enum values such as `clientType: "Mobile"`; no numeric enum was hard-coded into Mobile source.
- Defined a privacy-safe display label (`OMTS Mobile - Android/iOS`) that is not used as a security identifier.
- M1.2 is not Done yet: Backend confirmation, QA URL and a real Mobile-session login remain required by its acceptance criteria.
- Auth runtime implementation remains blocked, while contract-independent M2 UI foundation can proceed safely.

### 22/10/2026 — M2.1 visual tokens

- Added semantic light/dark themes, spacing, radius, typography, size and elevation tokens under `src/shared/theme/`.
- Added `useAppTheme()` backed by the system color scheme; the existing `automatic` app configuration and `expo-system-ui` support this behavior.
- Refactored the root layout, current root screen and offline banner to use semantic tokens instead of scattered color constants.
- M2.1 verification passed; form and feedback primitives remain separate M2.2/M2.3 micro-tasks.

### 22/10/2026 — M2.2a screen and keyboard-safe form layout

- Added `ScreenContainer` for safe-area-aware, themed, width-constrained screen content.
- Added `KeyboardSafeForm` with explicit iOS/Android keyboard behavior and a bounded `ScrollView`.
- Refactored the current root screen to use the production screen container; no development showcase was added.
- M2.2 remains open until text/password fields, buttons, message banner and loading control are implemented and exercised.

### 22/10/2026 — M2.2b1 text field

- Added a controlled, ref-forwarding `TextField` with visible label, helper/error copy and focused/invalid/disabled states.
- Preserved native TextInput capabilities such as autofill and keyboard selection while keeping validation in feature code.
- Added accessibility labels, disabled state and polite error announcement behavior.
- M2.2 remains open: PasswordField, Button, message banner and loading control are still pending, and device interaction testing must exercise all field states.

### 22/10/2026 — M2.2b2 password field

- Added `PasswordField` by composing `TextField`, without duplicating label, focus or error behavior.
- Added an accessible Vietnamese Show/Hide action with a 48-point touch target and pressed/disabled feedback.
- Extended `TextField` with an in-flow trailing-content slot instead of absolute overlay positioning.
- M2.2 remains open: Button, message banner and loading control are pending; password autofill/cursor behavior still needs device testing.

### 22/10/2026 — M2.2b3 app button and pending state

- Added `AppButton` variants for primary, secondary, danger and ghost actions.
- Added feature-controlled pending feedback with spinner, busy accessibility state and press lock.
- Kept loading visually distinct from disabled; skeleton remains reserved for initial content loading.
- M2.2 remains open until the shared message banner is implemented and primitives are exercised in a real auth screen/device flow.

### 22/10/2026 — M2.2b4 shared message banner

- Added one theme-aware `MessageBanner` for info, success, warning and danger feedback.
- Added visible status labels so meaning never depends on color alone, plus polite/assertive screen-reader announcements according to severity.
- Kept message-code rendering and retry decisions outside the primitive; those belong to message-catalog and feature layers.
- M2.2 component implementation is complete, but device accessibility checks and real auth-screen exercise remain acceptance evidence.

### 22/10/2026 — M2.3a inline status

- Added a compact status primitive with neutral, info, success, warning and danger variants.
- Kept domain-enum mapping in feature code and made live announcements opt-in to avoid noisy list rendering.
- M2.3 remains open for empty/error state, confirmation dialog and skeleton primitives.

### 22/10/2026 — M2.3b empty/error/permission content state

- Added `ContentState` with explicit empty, error and permission-denied presentations.
- Made action presence type-safe and optional, so retry is shown only when a feature deliberately supplies a safe handler.
- Reused `AppButton` pending behavior instead of duplicating mutation feedback.
- M2.3 remains open for confirmation dialog and skeleton primitives.

### 22/10/2026 — M2.3c skeleton loading

- Added animated skeleton blocks and an accessible group-level loading announcement.
- Added a reusable Reduce Motion hook and disabled pulse animation when the operating-system preference is enabled.
- Kept skeleton usage limited to predictable initial-content loading; mutations continue to use local pending feedback.
- M2.3 remains open for the confirmation dialog primitive.

### 22/10/2026 — M2.3d confirmation dialog

- Added a native Modal-based confirmation dialog with Back, backdrop and accessibility-escape handling.
- Locked every dismiss path while confirmation is pending and reused `AppButton` feedback.
- Disabled modal fade when Reduce Motion is enabled.
- M2.3 component implementation is complete; isolated component tests and physical-device accessibility checks remain acceptance evidence.

### 22/10/2026 — early M13.1 test foundation for M2

- Added the Expo SDK 57 Jest preset, React Native Testing Library 14 and a React-19.2-compatible test renderer.
- Added two accessibility-first component suites; all 10 tests pass.
- M2.2/M2.3 now have isolated interaction evidence. Physical-device, large-font and screen-reader checks remain open.
- M13.1 is only partially complete: domain/service/session/route tests will be added with those layers.

### 22/10/2026 — M3.10a typed message resolution

- Replaced the string-only MSG07 lookup with a typed display-message resolver and privacy-safe unknown-code fallback.
- Refactored the global offline feature to render catalog content through the shared MessageBanner.
- Added resolver tests that prove unknown server values are not echoed into user-visible copy.
- M3.10 remains open for approved auth/account codes, typed parameters and locale wording.

### 22/10/2026 — M3.4a API problem parser

- Added runtime-safe parsing for ASP.NET ProblemDetails-shaped payloads without trusting JSON casts.
- Preserved only public-shaped `MSGxx/MSGxxx` diagnostic codes and routed display content through the safe message resolver.
- Added malformed, nested, unknown-code and raw-detail protection tests.
- M3.4 remains open for fetch transport, no-content/malformed-success parsing, cancellation and timeout behavior.

### 22/10/2026 — M3.4b unauthenticated fetch transport

- Added an injectable fetch boundary with safe URL joining, JSON/no-content handling, timeout and external cancellation.
- Normalized HTTP, network, timeout, cancellation and malformed-success outcomes without logging or displaying raw exceptions.
- Kept successful JSON as `unknown` for endpoint adapters to validate and deliberately excluded tokens/refresh/session behavior.
- M3.4 base transport is implemented and tested; auth decoration/retry remains part of the blocked session design.

### 22/10/2026 — M3.11a connectivity behavior tests

- Added domain/provider/banner tests for online, offline and unknown states.
- Proved that a newer live network event is not overwritten by an older async initial lookup and that subscriptions are cleaned up.
- Kept MSG07 behavior limited to visibility and accessibility; no offline mutation queue was introduced.
- M3.11 remains open for per-mutation offline explanations and physical-device connectivity evidence.

### 22/10/2026 — M4.2a six-digit verification code field

- Re-read Jira OMTS-151 and the current UC08/SCR-02 before implementation.
- Added one canonical numeric TextInput with six visual cells, paste support and platform OTP autofill hints.
- Added accessibility/error behavior and seven focused tests; no auto-submit or API behavior was invented.
- M4.2 component code is implemented; Android/iOS autofill and keyboard evidence remain open.

### 22/10/2026 — M4.1a verification domain contract

- Added purpose-bound challenge, submission and transient-result types for the shared UC08 feature.
- Kept the submission independent of recipient text and validated the complete six-digit value before creating it.
- Added five contract tests, including rejection of a seven-digit value that a truncate-before-validate implementation could accept incorrectly.
- M4.1 remains open for validated endpoint adapters because the create/resend/verify backend routes are not available yet.

### 22/10/2026 — M4.3a verification timing facts

- Added a pure timestamp-based countdown calculation with exact-boundary and exhausted-send tests.
- Kept expiry, cooldown and sends-remaining as separate facts rather than inventing an unconfirmed resend-after-expiry rule.
- M4.3 remains open for foreground-aware ticking, formatted UI and a confirmed resend mutation policy.

### 22/10/2026 — M4.3b foreground-aware countdown hook

- Added an AppState-aware countdown hook that pauses its interval outside the foreground and recalculates from absolute time immediately on return.
- Added injected clock/activity boundaries and ten deterministic tests, including React Native's unknown/null startup state.
- Corrected the initial test implementation to await RNTL 14's asynchronous renderHook, act and unmount APIs.
- M4.3 remains open for formatted controls and the confirmed resend mutation policy.

### 22/10/2026 — M3.10b verification message codes

- Added typed Vietnamese MSG01, MSG04 and MSG16 catalog entries required by SCR-02.
- Added feature-controlled parameters for field/service names without trusting raw server prose.
- Confirmed that API ProblemDetails parsing still uses the privacy-safe unknown-code fallback.
- M3.10 remains open for the remaining auth/account codes and canonical localization ownership.

### 22/10/2026 — M4.4a shared SCR-02 presentation

- Composed the masked recipient, code field, limit/countdown notices, typed feedback and three actions into a production feature screen.
- Kept API, token persistence and navigation outside the presentation; no mock route or development showcase was introduced.
- Added five focused tests for masking, validity, expiry, resend gating and formatting.
- M4.4/M4.5 remain blocked on validated verification endpoints and calling-flow wrappers.

### 22/10/2026 — M6.1a trader-registration form domain

- Re-read Jira OMTS-155 and SRS UC01/SCR-01 before implementation.
- Added channel-specific registration values and pure required/password/confirmation validation with six tests.
- Deliberately deferred email/phone format validation because the canonical backend format is not documented.
- Corrected a readonly accumulator type caught by strict TypeScript after behavior tests had passed.

### 22/10/2026 — M6.1b registration method selector

- Added a controlled Email/Phone segmented selector with native radio semantics and 48-point targets.
- Removed an ineffective non-accessible radiogroup role rather than flattening its independently focusable children.
- Added three interaction/accessibility tests; device screen-reader evidence remains open.

### 22/10/2026 — M6.2a SCR-01 registration presentation

- Composed a controlled, keyboard-safe Trader registration screen with channel-specific native input hints and password guidance.
- Kept endpoint calls, challenge creation and route navigation outside the presentation; no fake route was introduced.
- Deferred method-switch data preservation/reset until canonical identifier format rules are known.
- Added four focused tests; M6.3 onward remains blocked on the backend registration contract.

### 22/10/2026 — M5.1a/M5.1b login form and SCR-03 presentation

- Re-read Jira OMTS-160 and SRS UC02/SCR-03 before implementation.
- Added required-only login validation that preserves passwords exactly and does not reject legacy/temporary credentials using new-password policy.
- Added a controlled login screen with recovery, Trader registration and public QR actions; no session or fake navigation was introduced.
- Added seven domain/component tests; M5.2 onward remains blocked on the Mobile client/session/gate contracts.

### 22/10/2026 — M3.10c login outcome messages

- Added typed Vietnamese MSG12, MSG13, MSG67, MSG68 and MSG69 entries.
- Updated an obsolete unsupported-code test fixture from newly supported MSG12 to MSG99 while preserving raw-detail protection.
- M3.10 remains open for recovery/profile/logout messages and canonical localization ownership.

### 22/10/2026 — M7.1 privacy-safe recovery request

- Re-read Jira OMTS-164 and SRS UC03/SCR-04 before implementation.
- Added required-only recovery identifier validation, MSG15 and a controlled request screen with the fixed support note.
- Corrected an optional post-response callback that could have leaked account existence through button presence.
- M7.2 onward is blocked on a privacy-preserving opaque recovery-attempt contract and verification endpoints.

### 22/10/2026 — full batch checkpoint

- All 18 suites / 109 tests pass with strict TypeScript, Expo lint and whitespace checks.
- Expo Doctor passes 21/21 checks and the Expo web static export completes successfully.
- Self-review found no production credential fixture, debug log, fake challenge route or raw server error rendering.
- See `docs/reports/MOBILE_BATCH_CHECKPOINT_2026-10-22.md` for resolved findings and remaining blockers.

### 22/10/2026 — M7.3 recovery new-password presentation

- Re-read Jira OMTS-164 and SRS UC03/SCR-04 before implementation.
- Extracted one shared new-password policy and refactored trader registration to use it without changing behavior.
- Added a controlled recovery new-password screen with field errors, pending lock, safe feedback and the confirmed old-session revocation notice.
- Kept the verification/recovery token out of UI props and storage; M7.2 and the reset controller remain blocked on the opaque recovery-attempt and endpoint contracts.
- Full verification now passes 20 suites / 119 tests, strict TypeScript, Expo lint and whitespace checks.

### 22/10/2026 — M8.1/M8.2 password-change form and current-password proof

- Re-read Jira OMTS-168 and SRS UC04/SCR-05 before implementation.
- Added one shared password-change domain form for normal and forced modes, reusing the common new-password policy.
- Added typed MSG17/MSG18 outcomes and a controlled screen whose forced-mode props cannot expose a Cancel action.
- Corrected a test-helper union-narrowing error by extracting the forced discriminated-union member before applying partial overrides.
- M8.3/M8.4 remain open for verified-email proof, the mutation service, session policy and the route-level app-stack block.
- Full verification now passes 22 suites / 127 tests, strict TypeScript, Expo lint and whitespace checks.

### 22/10/2026 — M10.1/M10.2 account hub and profile presentation

- Re-read Jira OMTS-172 and SRS UC05/SCR-05 before implementation.
- Added a required display-name form contract and a controlled account/profile screen without any hard-coded user or cooperative identity.
- Kept username/account identity read-only, rendered multiple access-summary lines without collapsing zone–role grants into one global role, and separated contact-change actions from direct profile save.
- Added typed MSG10 rendering and tests for identity, display-name save, independent contact-verification entry points and pending locks.
- M10.3/M10.4 remain open for contact-change SCR-02 wrappers, API contracts, optimistic concurrency and QA/device evidence.
- Full verification now passes 24 suites / 133 tests, strict TypeScript, Expo lint and whitespace checks.

### 22/10/2026 — M10 profile controller and notification regression fixes

- `M10.2/M10.4`: implemented frontend load/save controller, application-only revision contract, conflict draft retention and explicit successful reload before replacing the draft. Added skeleton/error/session-expired rendering and MSG06/MSG20. Real API/version mapping and contact verification remain open.
- `M11/M13`: fixed notification duplicate submission, concurrent progress-state overwrite and callback-triggered draft loss. Session expiry now removes editable settings immediately and cannot be undone by a late OS permission result.
- Verification: 40 suites / 212 tests passed, lint and typecheck passed, Expo Doctor 21/21, Expo web export succeeded. Only three scaffold routes are exported; no claim of routed auth/device QA is made.
- Reports: `docs/reports/OMTS-172_M10_PROFILE_CONTROLLER_2026-10-22.md` and `docs/reports/OMTS_M13_PROFILE_NOTIFICATION_BATCH_2026-10-22.md`. Learning notes 39–40 stay local/ignored. No commit/push or Jira mutation in this slice.

## 1. What this plan covers

> Latest review: `docs/reports/MOBILE_FULL_REVIEW_2026-10-22.md`. Full batch now has 40 suites / 223 tests, lint/typecheck and web export passing. Doctor is 20/21 because schema lookup fails with exp.host DNS EAI_AGAIN; SDK compatibility checks pass after updating expo-notifications to ~57.0.24. Dependency audit remains open (53 production-graph packages flagged). These results supersede older verification totals below without changing historical execution entries.

This plan covers the Mobile work currently assigned to D DT:

- `OMTS-133` — Expo foundation;
- `OMTS-151` — shared verification screen, SCR-02;
- `OMTS-155` — trader registration, SCR-01;
- `OMTS-160` — login and post-login gates, SCR-03;
- `OMTS-164` — account recovery, SCR-04;
- `OMTS-168` — security and forced password change, SCR-05;
- `OMTS-172` — personal profile, SCR-05;
- `OMTS-176` — notification preferences and push permission, SCR-06;
- `OMTS-180` — online/offline logout.

It intentionally does not copy Web administration screens such as employee, account, role or cooperative management into Mobile. Operational modules such as cultivation, water measurements, harvest and attendance require their own Jira-backed expansion plan after the current assigned scope is stable.

## 2. Confirmed behavior, proposals and open decisions

### Confirmed requirements

- Mobile uses Expo, Expo Router and TypeScript.
- Real tokens are stored in `expo-secure-store`.
- Signed-out and application navigation are separated.
- A valid Staff account may have several zone–role grants; navigation is based on effective permissions, not a single role label.
- Login accepts username, verified phone or verified email.
- First-login Staff use username plus temporary password.
- The mandatory order is change temporary password, then verify at least one declared contact, then enter the application.
- Verified email or verified phone is enough for the approved onboarding contact requirement.
- Staff do not silently edit Owner-declared contact data during onboarding; correction returns to the Owner/account-management flow.
- Offline state displays MSG07.
- Logout removes the device session and protected cached data immediately.

### Frontend implementation proposals

- Introduce a third top-level route group `(gate)` between `(auth)` and `(app)` for authenticated-but-restricted onboarding states.
- Model session state as a discriminated union so impossible combinations cannot render.
- Use a single-flight refresh coordinator so several simultaneous 401 responses cause only one refresh request.
- Keep verification UI reusable as a component/controller; route wrappers provide the purpose and completion behavior.
- Keep public API DTOs in adapters and map them to frontend domain types before UI uses them.
- Build a small native design system before building forms so labels, errors, touch sizes and loading behavior remain consistent.

These proposals do not change business flow. They may be adjusted during implementation if Expo SDK 57 constraints require it.

### Open decisions that block specific steps

- QA API URL and test-account matrix.
- Mobile `clientType` JSON representation.
- Final 24-hour versus 72-hour temporary-password policy.
- Stable contracts for verification, registration, recovery, password change, profile and notifications.
- Exact offline logout-revoke queue contract.
- Whether push-token registration can satisfy Jira in Expo Go or requires an Expo development build.
- Final Vietnamese message wording; SRS English wording is still marked proposed.

No micro-task may silently decide one of these business/backend questions.

## 3. Planned route and screen map

The route names below are implementation targets, not evidence that the files exist.

```text
src/app/
  _layout.tsx                         root providers + session router
  index.tsx                           bootstrap redirect only

  (auth)/
    _layout.tsx                       signed-out stack
    login.tsx                         SCR-03
    register/
      index.tsx                       SCR-01 form
      verify.tsx                      SCR-02 wrapper for registration
      success.tsx                     account-created result
    recovery/
      index.tsx                       SCR-04 identifier step
      verify.tsx                      SCR-02 wrapper for recovery
      new-password.tsx                SCR-04 password step
      success.tsx                     reset-complete result

  (gate)/
    _layout.tsx                       restricted authenticated stack
    change-password.tsx               forced SCR-05 security mode
    verify-contact.tsx                mandatory contact verification

  (app)/
    _layout.tsx                       application shell + permission gate
    index.tsx                         permitted-feature home
    account/
      index.tsx                       account hub
      profile.tsx                     SCR-05 personal profile
      security.tsx                    normal SCR-05 password change
      notifications.tsx               SCR-06
```

The shared verification implementation belongs outside `src/app`, for example under `src/features/verification/`. Route files should adapt navigation only; they should not contain HTTP, SecureStore or OTP business logic.

## 4. Screen-state standard

Every data-backed screen must deliberately handle:

- initial loading: skeleton or dedicated bootstrap screen;
- empty/not-applicable: plain-language explanation, not a blank panel;
- validation error: near the field plus an accessible summary when useful;
- API/business error: message catalog code with safe fallback;
- offline: global MSG07 plus local disabled explanation for network-only actions;
- mutation pending: disable only conflicting controls and show local progress;
- success: visible confirmation and deterministic next route;
- permission denied: explain the unavailable action and offer a safe route back;
- expired session: clear protected state and return to login with MSG19;
- reduced motion and screen-reader labels where animation or icons are used.

Minimum touch target target: approximately 44–48 logical pixels. Forms must remain usable with the keyboard open and at large font scaling.

## 5. Execution phases and micro-tasks

## Phase M0 — Preserve and baseline the existing slice

### M0.1 Review the uncommitted foundation slice

**What:** Review every current diff and separate generated dependency changes from authored source.

**Why:** The working tree already contains valuable connectivity work. Starting new auth work without a checkpoint would make later review and rollback difficult.

**How:** Compare the branch with `origin/develop`, run existing checks, inspect deleted learning files and confirm that only local learning notes are ignored.

**Done when:** the current diff is understood, no unrelated user change is overwritten, and a review report states exactly what belongs to the foundation slice.

### M0.2 Establish the verification command set

**What:** Define the commands each later slice must run.

**Why:** “The screen opens” does not prove types, SDK compatibility or route exports are sound.

**How:** Keep lint, strict typecheck and Expo Doctor; add unit/component test and export/device checks when their tooling is introduced.

**Done when:** the README and plan use one canonical command list.

## Phase M1 — Contract freeze before auth code

### M1.1 Record backend endpoint inventory

**What:** Create a frontend contract matrix for existing and missing endpoints.

**Why:** Components must not guess request fields or branch on raw backend JSON throughout the UI.

**How:** Record method, path, request DTO, success DTO, problem codes, authorization state and whether the endpoint exists in QA.

**Done when:** login, refresh, logout and `/me/permissions` match backend source/OpenAPI, while absent endpoints are clearly labeled mock-only or blocked.

### M1.2 Resolve mobile client identity

**What:** Confirm how Mobile sends `ClientType.Mobile` and a safe device label.

**Why:** Omitting the field currently defaults backend sessions to Web lifetimes; sending an undocumented enum representation may cause HTTP 400.

**How:** Backend publishes a string enum or exact schema; the adapter owns that representation.

**Done when:** a real QA login is recorded as a Mobile session and receives the intended lifetime.

### M1.3 Freeze the post-login gate contract

**What:** Confirm the stable response fields for password-change and contact-verification gates.

**Why:** Route decisions are security behavior, not visual decoration.

**How:** Prefer a stable `nextAction`; if booleans remain, document priority `mustChangePassword` -> `phoneVerificationRequired` -> app.

**Done when:** login and refresh produce the same deterministic destination from the same account state.

### M1.4 Resolve policy conflicts

**What:** Send BA/backend the 24-hour/72-hour conflict and onboarding-contact conflict.

**Why:** Mobile must not display instructions that contradict server enforcement.

**How:** Record the final authority and date; update project context without editing SRS or Jira history silently.

**Done when:** UI copy can be written without a hard-coded contradictory promise.

## Phase M2 — Mobile UI foundation

### M2.1 Define visual tokens

**What:** Add semantic colors, spacing, radii, typography and elevation tokens.

**Why:** Auth/account screens should feel like one application, remain readable outdoors and support dark/system appearance deliberately.

**How:** Use semantic names such as `surface`, `textPrimary`, `danger`, `success` and `focus`, not color names scattered across components.

**Done when:** a sample screen renders without hard-coded repeated visual constants.

### M2.2 Build form primitives

**What:** Create text field, password field, button, message banner, screen container, keyboard-safe form and loading control.

**Why:** Labels, error association, password visibility, disabled states and keyboard avoidance are cross-screen concerns.

**How:** Keep primitives presentation-focused; feature schemas and submit logic stay in their features.

**Done when:** primitives demonstrate normal, focused, invalid, disabled and pending states with accessibility labels.

### M2.3 Build feedback primitives

**What:** Add empty/error state, inline status, confirmation sheet/dialog and skeleton primitives.

**Why:** Network and permission failures are normal in field use and must not become blank screens.

**How:** Render catalog messages through a shared message component and expose retry only when an action is actually retryable.

**Done when:** each primitive has a small isolated usage example or component test.

## Phase M3 — Complete `OMTS-133` foundation

### M3.1 Create environment configuration boundary

**What:** Parse and validate `EXPO_PUBLIC_API_BASE_URL` once.

**Why:** Letting every service read environment variables spreads configuration errors and makes malformed URLs fail late.

**How:** Export a typed runtime config; development errors explain how to set the variable without printing secrets.

**Done when:** missing/invalid URL fails clearly and a valid QA URL is used by one transport factory.

### M3.2 Implement SecureStore token repository

**What:** Add read/write/clear operations for the current token bundle.

**Why:** UI and auth services should not depend directly on Expo native storage.

**How:** Version the serialized bundle, validate decoded shape, and treat corrupted or partial storage as signed out after cleanup.

**Done when:** repository tests cover empty, valid, corrupted and clear cases; no token appears in logs or AsyncStorage.

### M3.3 Define session state machine

**What:** Model `bootstrapping`, `signedOut`, `refreshing`, `passwordChangeRequired`, `contactVerificationRequired` and `authenticated` states.

**Why:** Independent booleans permit impossible UI such as showing the app while password change is required.

**How:** One reducer/service accepts login, restore, refresh, permission and logout events and returns a single state.

**Done when:** transition tests cover cold start, successful restore, expired refresh, each gate and logout.

### M3.4 Implement API transport and problem parser

**What:** Add a typed fetch boundary with JSON handling, timeout/cancellation and normalized API errors.

**Why:** Screens should receive domain outcomes, not repeat status-code and JSON parsing.

**How:** Map RFC-style problem responses and message codes to a typed `ApiProblem`; preserve an unknown-code fallback.

**Done when:** tests cover success, no-content, malformed JSON, network failure, timeout and coded backend error.

### M3.5 Implement single-flight refresh

**What:** Coordinate 401 recovery so only one refresh call is in flight.

**Why:** Several requests can fail together after access-token expiry; parallel refresh-token rotation would make valid requests revoke each other.

**How:** Other requests await the same refresh promise, retry once with the new access token, and all sign out if refresh fails.

**Done when:** a concurrency test proves N simultaneous 401s create one refresh request and no infinite retry loop.

### M3.6 Implement protected-cache registry

**What:** Give each feature cache a registered clear function.

**Why:** Secure logout includes derived/cached protected data, not just token deletion.

**How:** Auth owns orchestration; features register their cleanup without auth importing every feature implementation.

**Done when:** logout and terminal refresh failure remove all registered protected data.

### M3.7 Implement session bootstrap

**What:** Restore or reject the saved session before rendering auth/app routes.

**Why:** Rendering protected routes first can briefly expose stale private content.

**How:** Keep a neutral splash/bootstrap screen, read SecureStore, refresh if needed, resolve gates, then replace the route.

**Done when:** cold-start tests never show an app screen before authentication state is known.

### M3.8 Create route groups and guards

**What:** Add `(auth)`, `(gate)` and `(app)` layouts.

**Why:** Navigation structure should represent trust level and prevent manual deep links from bypassing gates.

**How:** Root session state selects the allowed group; each group validates its precondition and replaces invalid routes.

**Done when:** manual links and Android back cannot reach protected content from signed-out or gated states.

### M3.9 Implement permission adapter and feature registry

**What:** Convert `/me/permissions` into visible feature entries and allowed zone scopes.

**Why:** A Staff account may be Manager in one zone and Accountant in another; one role label is insufficient.

**How:** Features declare required function/action; the adapter determines visibility and passes permitted zones to feature services.

**Done when:** fixture tests cover Owner, all-zones grant, multiple zone–role grants, no grant and revoked/absent access.

### M3.10 Expand the message catalog

**What:** Add typed auth/account codes, parameters and safe fallback behavior.

**Why:** Backend codes should produce consistent Vietnamese UI without components duplicating wording.

**How:** Separate code definition, locale text and parameter renderer; never expose raw backend detail as the only user message.

**Done when:** parameter and unknown-code tests pass and all implemented screens use the catalog.

### M3.11 Finish connectivity behavior

**What:** Add tests and define how network-only actions behave while offline.

**Why:** A global banner alone does not explain why a submit button is unavailable.

**How:** Keep global MSG07 and let each mutation expose a local offline reason; do not invent a general write queue.

**Done when:** online/offline/unknown transitions and banner accessibility are tested on device.

## Phase M4 — `OMTS-151` shared verification screen, SCR-02

### M4.1 Define verification domain contract

**What:** Model purpose, channel, masked recipient, challenge ID, expiry, resend availability, attempts/sends remaining and verification result token.

**Why:** OTPs for registration, recovery, onboarding and contact changes must not be interchangeable.

**How:** Purpose and challenge identity travel through the service, while the screen sees only display-safe recipient data.

**Done when:** types prevent verifying without a challenge and do not expose a full recipient unnecessarily.

### M4.2 Build the six-digit code input

**What:** Add numeric entry with paste and one-time-code autofill support.

**Why:** Field users should not have to tap six separate boxes precisely or retype an SMS manually.

**How:** Maintain one canonical string, render visual cells if desired, support backspace/paste, and announce errors accessibly.

**Done when:** typing, full-code paste, replacement and autofill paths work on Android and iOS.

### M4.3 Implement resend countdown

**What:** Show the 60-second countdown and sends remaining.

**Why:** Jira explicitly requires rate-limit feedback and users need to know when resend becomes available.

**How:** Derive countdown from a server timestamp where available; do not trust a decrement-only timer after app backgrounding.

**Done when:** background/resume does not reset or extend the server-controlled wait.

### M4.4 Implement verify/resend outcomes

**What:** Map `MSG01`, `MSG04`, `MSG15` where recovery privacy applies, and `MSG16`.

**Why:** Recovery must not reveal account existence while registration/profile may show a delivery failure.

**How:** Calling flow selects the privacy policy; verification service returns typed outcomes.

**Done when:** wrong, expired, exhausted, resend failure and success paths are testable without changing the component.

### M4.5 Create route wrappers

**What:** Reuse the component from registration, recovery, onboarding and profile-contact change.

**Why:** Jira requires one shared screen, while each flow has a different success destination.

**How:** Thin route wrappers supply purpose and completion navigation; they do not duplicate OTP UI or API logic.

**Done when:** the same verified component is visibly reused by at least two flows before marking `OMTS-151` complete.

## Phase M5 — `OMTS-160` login and post-login gates, SCR-03

### M5.1 Build login form UI

**What:** Identifier, password, visibility control, login action, recovery link and registration link for Traders.

**Why:** The screen serves several actors but must explain that phone/email login requires verification.

**How:** Keyboard-safe form, correct autocomplete/text-content types, submit from keyboard and local validation only for required fields.

**Done when:** empty fields show MSG01 locally and credentials are never logged.

### M5.2 Connect login service

**What:** Submit the Mobile client identity and map auth results.

**Why:** `MSG12`, `MSG13`, `MSG68` and `MSG69` represent different user recovery paths.

**How:** Service maps response DTO to session domain and the message catalog renders the result.

**Done when:** QA fixtures/test accounts reach every documented response without UI code inspecting raw HTTP.

### M5.3 Route by gate priority

**What:** Send users to forced password change, contact verification or app home.

**Why:** Credentials being correct does not always mean business functions may open.

**How:** Use the shared session-destination resolver for login, bootstrap and refresh.

**Done when:** the same account always reaches the same gate after login and app restart.

### M5.4 Build permitted-feature home

**What:** Show only features allowed by effective permissions.

**Why:** Mobile should not present unusable menu items, but hidden UI is not the final security boundary.

**How:** Render from a feature registry and permission model; keep account/profile/logout available according to session rules.

**Done when:** multi-grant fixtures produce the correct feature list and zone scope.

## Phase M6 — `OMTS-155` trader registration, SCR-01

### M6.1 Build registration-method selector

**What:** Choose email or phone before entering the registration identifier.

**Why:** Keyboard, validation and verification channel differ, and the UI must not infer channel ambiguously.

**How:** Preserve entered data when switching only when format remains valid; otherwise explain the reset.

**Done when:** email and phone paths have distinct labels, keyboards and validation.

### M6.2 Build password creation form

**What:** Password, confirmation, rules and visibility controls.

**Why:** Users need actionable guidance before submit, not only a generic failure afterward.

**How:** Validate at least eight characters with letters and digits plus exact confirmation, matching current SRS unless backend policy becomes stricter.

**Done when:** policy, mismatch and pending states are tested.

### M6.3 Connect availability/start-registration service

**What:** Start registration without revealing unnecessary account information.

**Why:** `MSG14` must direct existing users to login/recovery without exposing more data.

**How:** Service returns a challenge or a typed existing-account outcome.

**Done when:** duplicate, delivery failure and validation paths retain safe form state.

### M6.4 Reuse SCR-02 and confirm creation

**What:** Verify the chosen contact, then create/activate the Trader account and show success.

**Why:** UC01 requires verification before account activation.

**How:** Registration state holds the verification result token transiently; password/OTP are never persisted locally.

**Done when:** successful flow ends at login and Back cannot reopen a completed credential form with secrets.

## Phase M7 — `OMTS-164` recovery, SCR-04

### M7.1 Build identifier step with privacy-safe response

**What:** Accept a verified email or phone and always display MSG15 after submit.

**Why:** Different responses would allow account enumeration.

**How:** Treat “not found/not verified/not eligible” as the same visible result while preserving server monitoring internally.

**Done when:** visible behavior is identical for existing and non-existing identifiers.

### M7.2 Reuse SCR-02 for recovery

**What:** Verify the exact identifier entered in the prior step.

**Why:** A code for one contact/purpose must not reset another account.

**How:** Bind recovery challenge ID, purpose and destination; changing delivery method cancels the current challenge.

**Done when:** old challenge cannot complete after delivery method changes.

### M7.3 Build new-password step

**What:** Enter and confirm the new password after valid verification.

**Why:** The verification result should authorize only this recovery completion, not a general session.

**How:** Send the short-lived recovery token once; clear all recovery state on success or terminal expiry.

**Done when:** success returns to login, old sessions are rejected by backend and Back does not reveal the password.

**Hardening update (22/10/2026):** The frontend now has a recovery-completion service contract plus a controller that validates locally, prevents duplicate completion requests and clears both password fields after success, invalid/expired attempt, infrastructure failure and explicit back-to-login. The recovery proof remains bound outside screen props and is not stored locally. Endpoint integration, old-session rejection and route replacement still require the backend recovery-attempt contract and QA evidence.

**Mock assembly update (23/10/2026):** M7.1–M7.3 now run together through `/recovery` with the shared mock auth account, private one-use proof, resend/cancel/expiry and old-lease rejection. Tests prove explicit re-login and old-session MSG19 cleanup. This supersedes earlier missing-wrapper notes for **mock only**; real endpoint, delivery/audit and device acceptance remain open. See the execution log/report above, not the historical blocked notes, for current evidence.

## Phase M8 — `OMTS-168` forced and normal password change, SCR-05

### M8.1 Define one password-change form with two modes

**What:** Reuse fields and validation for normal security mode and forced onboarding mode.

**Why:** Business rules are shared, but forced mode must not show Cancel or app navigation.

**How:** Mode controls available proof methods and navigation, not password policy duplication.

**Done when:** forced and normal snapshots/tests show the expected controls.

### M8.2 Implement current-password proof

**What:** Change password using the current password, including the temporary password in forced mode.

**Why:** This is the primary UC04 path and prevents an active unlocked session alone from silently changing credentials.

**How:** Map MSG17, MSG18 and MSG19; clear secret fields after every terminal result.

**Done when:** wrong proof preserves no password in logs/storage and success updates session destination.

**Hardening update (22/10/2026):** A typed current-password service contract and controller now map changed/current-password-invalid/session-expired outcomes to MSG18/17/19, prevent duplicate submissions and clear current/new/confirmation secrets after every terminal result. Standard-mode cancel also clears secrets before delegating navigation. The same controller drives forced and standard presentations, but route-level gate enforcement and the real mutation adapter remain open.

### M8.3 Implement verified-email proof when backend supports it

**What:** Allow a code sent to verified email instead of current password.

**Why:** It is a documented UC04 alternative, but it requires a dedicated verification purpose and backend contract.

**How:** Reuse verification feature with password-change purpose; do not reuse a recovery token.

**Done when:** the backend contract exists and wrong/expired codes cannot change the password.

### M8.4 Enforce forced-mode navigation

**What:** Keep the user outside `(app)` until password change succeeds.

**Why:** Disabling menu buttons is insufficient; deep links and Back must also be blocked.

**How:** Session state remains `passwordChangeRequired`; only allowed endpoints/routes are reachable.

**Done when:** forced-mode device tests cannot open any app feature and next destination is contact verification or app according to server state.

## Phase M9 — mandatory onboarding contact verification

### M9.1 Build contact confirmation screen

**What:** Show Owner-declared contacts in masked form and let the user choose one available contact.

**Why:** The approved flow requires verifying one declared email or phone after password change.

**How:** Do not provide an edit field; provide a clear “Thông tin không đúng” path instructing the user to contact the Owner.

**Done when:** users can identify the channel without seeing the full sensitive value and cannot silently replace it.

### M9.2 Reuse SCR-02 and upgrade session

**What:** Verify the chosen contact and obtain application-session eligibility.

**Why:** OTP success alone should not grant permissions; backend must also confirm account state and AccessGrant.

**How:** After verification, refresh/reload the server session and permissions before entering `(app)`.

**Done when:** loss of all AccessGrants or another unmet gate still prevents application access.

## Phase M10 — `OMTS-172` personal profile, SCR-05

### M10.1 Build account hub

**What:** Show display name, username, subject/role summary and entries for profile, security, notifications and logout.

**Why:** Mobile needs a compact navigation point rather than placing every account control in one long form.

**How:** Role summary is derived from grants for display only; it never replaces permissions.

**Done when:** multi-role users see an understandable summary and no cooperative name is mistaken for a personal name.

### M10.2 Build profile read/edit screen

**What:** Display username read-only; edit display name, email and phone subject to contract.

**Why:** Identity fields have different mutability and verification rules.

**How:** Separate ordinary profile save from pending contact replacement; current contact remains active until verification succeeds.

**Done when:** username cannot enter the update payload and MSG20 is available for server rejection.

**Implementation result (22/10/2026):** Complete at presentation/controller level: profile loading/retry, required-name validation, canonical save response, duplicate-submit protection, MSG10/MSG20 and a session-expired state that removes editable data. The application save contract contains only displayName and an opaque expectedRevision. Endpoint adapter, contact verification and real QA remain pending.

**Subsequent approved assembly (22/10/2026):** `/account` now uses this controller with a session-scoped shared mock gateway. Save updates the correct mock account and session identity; offline retains draft without auto-save. Password navigation and confirmed logout work; contact/preferences wrappers remain separate. This does not complete the endpoint/device acceptance criteria.

### M10.3 Reuse SCR-02 for changed contacts

**What:** Verify new email or phone before replacement.

**Why:** Saving an unverified login identifier would weaken account ownership guarantees.

**How:** Start a contact-change challenge, verify it, then reload the profile from server.

**Done when:** cancelling or failing verification leaves the old contact visibly active.

### M10.4 Handle concurrent profile updates

**What:** Show MSG06 and reload option when the profile version changed elsewhere.

**Why:** Owner account management and another device may update the same account.

**How:** Use server version/ETag contract when available; never overwrite silently.

**Done when:** conflict test preserves the user's unsaved values long enough to review while offering a safe reload.

**Implementation result (22/10/2026):** Frontend controller tests pass. A conflict preserves the draft and blocks blind retries using the stale revision. An explicit “Tải lại và bỏ thay đổi” action replaces it only after a successful reload; a failed reload keeps both the draft and conflict lock. Late responses and parent callback identity changes have regression tests. The backend concurrency stamp/HTTP mapping is still unconfirmed, so M10.4 is not integrated end to end.

**Subsequent mock evidence (22/10/2026):** A second session using the same synthetic account can change its revision. The routed controller detects that conflict, retains the draft on failed reload and replaces it only after successful explicit retry. No backend version representation has been chosen by this mock implementation.

## Phase M11 — `OMTS-176` notification preferences, SCR-06

### M11.1 Define notification matrix domain model

**What:** Model applicable types, eligible channels, mandatory cells and disabled reasons.

**Why:** A raw boolean matrix cannot explain why a control is locked or unavailable.

**How:** Each cell carries selected, mandatory, eligible and reason-code state.

**Done when:** UI can render mandatory, disabled and editable cells without hard-coded type names.

**Implementation result (22/10/2026):** Complete in the frontend. The typed model is server-driven and represents editable cells plus locked MSG21/MSG22/MSG23 reasons. Unknown and duplicate selections are treated as contract errors instead of silently creating new preferences.

### M11.2 Build mobile-friendly preference UI

**What:** Render grouped notification types with channel controls suitable for a narrow screen.

**Why:** Copying a desktop table to a phone causes horizontal scrolling and poor touch accuracy.

**How:** Use stacked cards/sections, keep labels visible and announce locked reasons.

**Done when:** no horizontal scroll is required and large-font mode remains understandable.

**Implementation result (22/10/2026):** Complete as a controlled presentation. SCR-06 uses stacked cards, visible mandatory/ineligible explanations, accessible switches and deliberate loading/error/empty/saving states. Route/controller integration remains part of the API slice.

### M11.3 Read OS push permission

**What:** Distinguish undetermined, granted and denied states.

**Why:** App preference and OS permission are separate; turning on a switch cannot override the operating system.

**How:** Follow Expo SDK 57 documentation, request permission only from an explicit user action and show MSG22 when denied.

**Done when:** denied permission leaves other channels savable and push visibly inactive.

**Implementation result (22/10/2026):** Complete for permission status. `expo-notifications` 57.0.23 is isolated behind a repository; reading has no prompt and requesting happens only from an explicit button. Android creates its notification channel before requesting permission. Unit tests cover undetermined, granted, denied and iOS provisional states.

### M11.4 Register and maintain push token

**What:** Send the device push token to backend and update it when it changes.

**Why:** OS permission alone does not give the server a delivery destination.

**How:** Associate token with the authenticated account/session/device; never log it as ordinary analytics data.

**Done when:** the team confirms Expo Go versus development-build support and QA receives a current token.

**Blocked (22/10/2026):** Expo SDK 57 documentation states that Android remote push is unavailable in Expo Go and requires a development build. The app also has no EAS `projectId`, and backend `OMTS-174` is still To Do with no device-token endpoint in source. Do not claim token registration is complete or invent an endpoint. BA/backend must also reconcile backend `Sms` with SRS `Zalo OA` before the wire contract is frozen.

### M11.5 Save the matrix

**What:** Persist valid preferences while preserving mandatory and ineligible rules.

**Why:** Optimistic switches must not claim a preference was saved when backend rejected it.

**How:** Save a versioned payload, map MSG21/MSG23, and reload canonical server state after success.

**Done when:** denied push, unverified email, mandatory item and normal save paths are verified.

**Implementation result (22/10/2026):** Frontend contract and mock adapter are complete. Tests cover editable save, MSG21, MSG22 partial save, MSG23, session expiry and isolated data copies. QA API persistence and canonical reload remain blocked by `OMTS-124`/`OMTS-174` and the missing API contract.

**Hardening update (22/10/2026):** A controller now owns initial load, draft/canonical separation, cancel, save, OS permission request, typed feedback and session-expiry delegation. Tests verify that cancelling restores the last canonical settings and that an OS permission response cannot overwrite preference edits made while its promise was pending. This controller is framework-independent and ready for a route wrapper, but it is not evidence of QA API persistence.

**Subsequent approved mock assembly (22/10/2026):** The controller is routed at `/notification-preferences` from `/account`. A shared mock-auth credential resolver selects a separate repository per account; AccountSessionScope prevents old-login services/responses from affecting the next session. Offline load/save explicitly use MSG07 without queue/auto-save. The mock route reports device permission unavailable and never calls the native permission adapter. Full evidence is in `MOBILE_NOTIFICATION_ASSEMBLY_2026-10-22.md`; real catalog, endpoint, push and QA acceptance remain open.

## Phase M12 — `OMTS-180` online and offline logout

### M12.1 Implement local-first logout transaction

**What:** Remove token bundle, session state and protected caches, then replace navigation with login.

**Why:** Another person using the device must not see protected data even if the network call fails.

**How:** Local cleanup is unconditional; server revoke is attempted separately.

**Done when:** Android Back and deep links cannot reveal the prior user's data.

**Implementation result (22/10/2026):** The local-first service boundary and versioned SecureStore token bundle are implemented and tested. Token, protected-cache and in-memory session cleanup finish before server revoke. Actual route replacement, protected-cache adapter and Back/deep-link device evidence remain pending because the authenticated app stack is not implemented yet.

**Hardening update (22/10/2026):** A tested logout controller now owns confirmation visibility, pending state and duplicate-submit prevention. It delegates the final navigation result instead of importing Expo Router, so route replacement remains an explicit M12.1 integration task rather than hidden inside reusable session logic.

### M12.2 Implement online revoke

**What:** Call `/api/auth/logout` with the current access token before/alongside final local cleanup without making local privacy depend on the response.

**Why:** Server-side refresh tokens should stop working after logout.

**How:** Treat already-expired session as a successful local logout and show MSG19 only when useful.

**Done when:** old access and refresh tokens are rejected in QA after online logout.

**Implementation result (22/10/2026, corrected during full review):** The API repository calls `POST api/auth/logout` with the captured bearer token. Success confirms revoke; 401 and other failures report revoke failed because an expired bearer token can be rejected before the revoke action runs. Token-read failure also does not claim revoke is unnecessary. Local cleanup continues independently. QA rejection evidence remains pending.

### M12.3 Design the deferred offline revoke queue

**What:** Persist the minimum opaque revoke intent required by Jira.

**Why:** Offline logout cannot reach the server, but retaining the live refresh token unprotected for later retry is also risky.

**How:** Agree with backend on a revocation handle/idempotency contract before coding; do not reuse a generic business mutation queue.

**Done when:** threat model, storage, expiry, retry and app-reinstall behavior are approved.

**Blocked (22/10/2026):** The backend accepts only the current bearer session and exposes no opaque revocation handle or idempotent deferred-revoke endpoint. Mobile clears secrets locally and returns `deferred-contract-required`; it does not retain a refresh token after logout or invent a generic mutation queue.

### M12.4 Retry revoke after connectivity returns

**What:** Process pending revoke intents without restoring the logged-out user session.

**Why:** Retry belongs to device security housekeeping, not user re-authentication.

**How:** Background/foreground retry must be idempotent, bounded and silent unless intervention is needed.

**Done when:** device test logs out offline, returns online, clears the pending intent and backend rejects the old session.

**Blocked (22/10/2026):** Depends on the approved M12.3 contract plus authenticated app bootstrap and a physical-device connectivity test.

## Phase M13 — QA hardening and completion evidence

### M13.1 Add automated test layers

**What:** Add domain/service unit tests, component interaction tests and a small route/session integration suite.

**Why:** Auth defects usually appear at transitions and retries, not in static screen rendering.

**How:** Prioritize session reducer, refresh concurrency, message rendering, permission mapping and each multi-step flow.

**Done when:** CI runs the test suite and critical transitions have explicit tests.

**Implementation result (22/10/2026):** Partially complete. The repository now has 40 passing suites / 223 tests. Transition tests cover profile load/save/conflict/reload and source replacement; notification concurrent operations and stale responses; logout cleanup and honest revoke mapping; password/recovery secret cleanup and late-result suppression. Component integration tests exercise real screen/controller wiring. CI includes `npm test` after lint/typecheck but does not trigger on a feature-only push. Route/session bootstrap and refresh-concurrency integration tests remain blocked by the unconfirmed auth contracts.

### M13.2 Physical-device matrix

**What:** Test at least one Android and one iOS path where available.

**Why:** keyboard, autofill, SecureStore, push permission and app lifecycle differ from web export.

**How:** Use QA accounts for ordinary login, forced password, contact verification, locked account and multi-grant Staff.

**Done when:** evidence records device/OS, build type, API environment and result for each case.

### M13.3 Accessibility and field-use review

**What:** Review screen reader labels, focus order, font scaling, contrast, one-handed reach and sunlight readability.

**Why:** OMTS users may be working outdoors and may not be highly technical.

**How:** Test large text, reduced motion, keyboard-only where applicable and visible error recovery.

**Done when:** no critical action depends only on color, tiny icons or hidden gestures.

**Implementation result (22/10/2026):** Partially complete at code/test level. Dynamic field errors now expose an alert role in addition to red styling and text; disabled notification switches expose their locked reason as an accessibility hint; card headers wrap under large text; button labels can shrink/wrap instead of clipping. Automated semantic tests pass, but TalkBack/VoiceOver, maximum font size, sunlight and one-handed physical-device evidence are still required.

### M13.4 Final verification

**What:** Run the full project checks and produce a Jira-by-Jira evidence report.

**Why:** A ticket should be marked complete only from acceptance evidence.

**How:** Run lint, typecheck, Expo Doctor, tests, export/build smoke checks and QA device scenarios.

**Done when:** every ticket lists implemented routes, tests, QA evidence, remaining backend dependency and honest completion status.

## 6. Recommended implementation order

1. M0 — preserve the existing connectivity slice.
2. M1 — freeze auth/backend contracts.
3. M2 — small UI foundation.
4. M3 — finish `OMTS-133` in code despite its current Jira status.
5. M4 — shared SCR-02 (`OMTS-151`).
6. M5 — login and gates (`OMTS-160`).
7. M8 + M9 — forced password and contact onboarding (`OMTS-168`).
8. M6 — registration (`OMTS-155`).
9. M7 — recovery (`OMTS-164`).
10. M10 — profile (`OMTS-172`).
11. M11 — notifications (`OMTS-176`).
12. M12 — logout (`OMTS-180`).
13. M13 — complete QA and evidence.

The order deliberately implements login/onboarding before registration and recovery because the backend already exposes login/refresh/logout/permissions, while registration, verification, recovery, profile and notification endpoints are still missing.

## 7. First coding slice after approval

The first coding slice should be **M0.1 + M3.1 only**:

- preserve/review the current connectivity changes;
- add the typed runtime configuration boundary for the API base URL;
- add focused tests if the test runner is introduced in the same reviewed slice;
- run lint, typecheck and Expo Doctor;
- write the learning note and review result.

Do not start SecureStore/session code until the Mobile client-type representation and login contract are confirmed, because those decisions determine the token DTO and bootstrap behavior.

## 8. Defense questions for the overall plan

**Why is Mobile not a copy of the Web application?**

Because channel scope follows Jira and field-use needs. Web contains administration-heavy screens; Mobile currently targets authentication/account flows and later field operations. Sharing business contracts does not require sharing every screen.

**Why use a separate `(gate)` group?**

The user is authenticated but not authorized to enter normal business features yet. Modeling that state separately prevents forced password/contact verification from becoming a collection of disabled buttons inside the app.

**Why not refresh separately in every failed request?**

The backend rotates refresh tokens. Parallel refresh calls with the same old token can be interpreted as replay and terminate the session. Single-flight refresh serializes that security-sensitive operation.

**Why can permission-aware navigation not replace backend authorization?**

Navigation only controls what the client offers. Requests can be forged and permissions can change while the app is open, so backend endpoints must re-check account, action and zone scope.

**Why is the OTP screen shared but the flows still have separate routes?**

Input behavior, countdown and error handling are shared; purpose, privacy policy and destination differ. Reusing a component/service avoids duplication while route wrappers keep each use case explicit and recoverable.
