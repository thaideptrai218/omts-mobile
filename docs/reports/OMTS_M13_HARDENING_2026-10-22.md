# OMTS Mobile — M13 hardening report

> Date: 22/10/2026
> Branch: `feature/OMTS-133-mobile-foundation`
> Scope: controller transitions and code-level accessibility; no Jira transition, commit or push in this slice

## 1. Outcome

This slice did not invent the missing authentication, route or backend contracts. It hardened two already-approved frontend flows:

- SCR-06 notification preferences now has a reusable controller for loading, draft edits, cancellation, save, push permission and session expiry.
- UC07 logout now has a reusable confirmation controller that locks repeated submissions and hands the final result to the future route layer.
- Shared UI semantics were improved for dynamic validation errors, locked notification controls, large text and long button labels.

The full local baseline is **33 test suites / 176 tests passing**, plus green lint, strict TypeScript and `git diff --check`. The GitHub CI workflow now includes `npm test`; it has not run for this unpushed change yet.

## 2. Architecture and data flow

### Notification preferences

The screen remains a presentation component. `useNotificationPreferencesController` calls the existing service and OS-permission repository, keeps two distinct states and converts typed outcomes into the message catalog:

1. `canonicalSettings` is the latest server/repository-confirmed state.
2. `state.settings` is the editable draft shown by the screen.
3. Cancel restores the canonical reference.
4. Save serializes an explicit selection list and promotes only the returned settings to canonical state.
5. Session expiry calls `onSessionExpired`; the controller does not choose a route.

The permission request uses functional state updates after the asynchronous native result. This matters because a user can edit another switch while the system permission prompt is open. A stale state closure would otherwise restore the older draft and silently lose that edit.

### Logout

`useLogoutController` owns only interaction state: dialog visibility, confirming state and an in-flight guard. `LogoutService` still owns the security transaction. The controller passes connectivity into the service and emits the typed result through `onLoggedOut`, allowing the future Expo Router adapter to use `replace` without coupling domain/session code to navigation.

## 3. Accessibility changes

- Validation messages now expose `accessibilityRole="alert"` as well as a visible message and polite live-region behavior.
- A locked notification switch exposes the same MSG21/22/23 explanation through `accessibilityHint`; a screen-reader user does not have to infer the reason from disabled state alone.
- Notification, push-permission and contact-card headers can wrap when system font size is increased.
- Button labels use `flexShrink` so long Vietnamese labels are less likely to clip next to a loading spinner.

These are code-level improvements only. They do not replace TalkBack/VoiceOver tests on physical devices.

## 4. Errors found and repaired

### React hook lint error during initial load

- Command: `npm run lint`
- Important message: `Calling setState synchronously within an effect can trigger cascading renders` at the call to `performLoad()`.
- Root cause: although `performLoad` awaited I/O before most state updates, it was a callback capable of setting state and was invoked directly inside the effect. The React hooks rule could not guarantee that the call was asynchronous and correctly rejected the ambiguous structure.
- Repair: initial loading now starts `Promise.all` inside the effect and updates state only from promise settlement callbacks. Retry increments a load-attempt state from the user event and re-runs the same effect.
- Evidence: lint and controller tests pass after the rewrite.

### Overlapping `act()` scopes in asynchronous hook tests

- Command: focused Jest runs for notification and logout controllers.
- Important messages: `You called act(async () => ...) without await`, followed by stale assertions and `result.current` becoming `null` in later tests.
- Root cause: tests intentionally started unresolved promises to inspect pending UI state, but the enclosing RNTL `act` call was not awaited. The unfinished scope leaked into the next interaction/test; the later null errors were cascading symptoms, not separate production defects.
- Repair: await the state-flushing `act`, resolve the controlled promise in another awaited `act`, then use `waitFor` for the final observable state.
- Evidence: both controller suites pass without console errors.

## 5. Self-review

Strengths:

- Components still do not call HTTP, SecureStore or native permission APIs directly.
- No route, endpoint, push token or offline revoke behavior was fabricated.
- Async state races and duplicate submit behavior have focused regression tests.
- Pull-request CI is configured to execute the full Jest suite in addition to lint and typecheck.
- Accessibility improvements preserve visible text and do not depend only on color.

Remaining limits:

- The notification controller is not mounted by a production route because authenticated route groups and session bootstrap are unresolved.
- Logout does not yet prove Expo Router replacement, Android Back protection or cache adapter cleanup.
- No physical-device accessibility, autofill, push or QA API evidence exists.
- `OMTS-133` appears Done in Jira, but the repo still lacks its QA API acceptance evidence; Jira status was not modified in this slice.

## 6. Defense Q&A

**Why keep both canonical settings and a draft?**

Because Cancel must restore the last confirmed state, not reconstruct defaults or reload blindly. The server response after save becomes the next canonical state.

**Why inject navigation callbacks instead of importing Expo Router into controllers?**

Navigation is an outer application concern. Injection keeps the controller testable and allows the still-unconfirmed session/gate policy to be implemented later without rewriting domain behavior.

**Why is a disabled switch not enough for accessibility?**

Disabled communicates that an action is unavailable, but not why. The MSG21/22/23 hint gives the same business explanation available visually.
