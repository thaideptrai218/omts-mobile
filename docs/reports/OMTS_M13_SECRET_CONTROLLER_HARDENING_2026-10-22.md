# OMTS Mobile — M13 secret-controller hardening

> Date: 22/10/2026
> Branch: `feature/OMTS-133-mobile-foundation`
> Related tickets: `OMTS-164`, `OMTS-168`
> This slice does not change Jira status and does not claim QA API completion.

## 1. Outcome

Two password-bearing presentations now have application controllers instead of relying on an unspecified parent to manage secret state:

- Password change supports standard and forced mode through the same controller.
- Recovery completion keeps its proof outside screen props and sends only the validated new password through an injected service boundary.

Both controllers prevent duplicate requests and clear secrets after every terminal result. Standard cancel and recovery back-to-login also clear secrets before handing control to navigation.

The local baseline is now **37 suites / 188 tests passing**, with green lint, strict TypeScript and `git diff --check`.

## 2. Password-change controller

`PasswordChangeService` exposes domain outcomes instead of backend strings:

- `changed` → MSG18 and `onChanged`;
- `current-password-invalid` → MSG17;
- `session-expired` → MSG19 and `onSessionExpired`.

Unexpected adapter failures map to MSG04. Validation errors do not call the service and keep the current values so the user can correct them. Once a real service request completes, all three secret fields are cleared regardless of the outcome.

The controller updates its own state before invoking `onChanged` or `onSessionExpired`. A callback may replace the current route immediately, so no state update is deliberately scheduled after that navigation boundary.

## 3. Recovery-completion controller

The completion service is intentionally narrow: it accepts only `newPassword`. A future route/flow adapter must bind the opaque recovery proof outside the presentation layer. No token, challenge ID or fake local recovery authority was added to component props or storage.

The controller handles `completed` and `attempt-invalid`; the latter maps to MSG16. It clears both password fields after either result and after infrastructure failure. Back-to-login resets the fields before invoking the outer navigation callback.

## 4. Verification evidence

New tests cover:

- local validation without an unnecessary request;
- exact, untrimmed password submission;
- terminal rejection cleanup;
- session-expiry delegation;
- duplicate-submit prevention while a promise is unresolved;
- screen-to-controller callback wiring;
- secret cleanup on Cancel and Back even when the test deliberately keeps the component mounted.

Full local commands:

- `npm test` — 37 suites / 188 tests passed;
- `npm run lint` — passed;
- `npm run typecheck` — passed;
- `git diff --check` — passed.

## 5. Error encountered

The first TypeScript run reported:

`Property 'result' does not exist on type 'Promise<RenderHookResult<...>>'.`

RNTL v14 makes `renderHook` asynchronous. The test helper tried to derive `.result` directly from `ReturnType<typeof renderController>`, which is a Promise. The focused Jest test happened to run because Babel does not enforce that TypeScript type, but the strict typecheck correctly rejected it. The helper was corrected to accept `{ current: ReturnType<typeof usePasswordChangeController> }`; no `any` or type assertion was introduced.

## 6. Self-review and limits

Strengths:

- Secret lifecycle is explicit and regression-tested.
- UI does not consume raw server messages.
- Controllers depend on small service contracts and do not import Expo Router or HTTP.
- Recovery proof remains outside presentation state.

Remaining limits:

- Neither service has a production API adapter because the canonical endpoints and response contracts are missing.
- Forced mode is not yet protected from Back/deep-link access at the router/session level.
- Recovery still needs its SCR-02 wrapper and an opaque attempt contract.
- Backend old-session revocation and QA device behavior are not verified.

## 7. Defense Q&A

**Why retain values after local validation but clear them after a server result?**

Local validation means no secret left the form and the user needs to correct a specific field. A terminal service result ends that submission attempt; clearing secrets limits their lifetime in memory and forces an explicit retry.

**Why does recovery completion not receive a token prop?**

A recovery token is temporary authority, not display data. Binding it in the service/flow boundary prevents accidental logging, rendering or persistence by reusable UI components.

**Why use an in-flight ref in addition to the pending state?**

React state updates are scheduled. Two taps in the same event window can both observe the old `pending=false`; a synchronously updated ref closes that gap while pending drives the visible UI.
