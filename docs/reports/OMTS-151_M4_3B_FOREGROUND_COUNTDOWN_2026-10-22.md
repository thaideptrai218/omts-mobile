# OMTS-151 — M4.3b foreground-aware countdown

## Outcome

`useVerificationCountdown` now updates the pure timing model once per second while the application is visible, pauses its interval outside the foreground and immediately recalculates from absolute time when the app becomes active again.

## Architecture

The hook depends on small clock and app-activity interfaces. Production adapters use `Date.now`, React Native `AppState.addEventListener` and removable subscriptions. Tests inject deterministic versions, so they do not wait for real seconds or mutate the global native module.

Unknown/null startup state is allowed to tick defensively because React Native documents that legacy `currentState` can be temporarily unavailable at launch. Background, inactive and extension states pause updates.

The timer is not the source of truth: it only triggers a new read of the clock. This avoids countdown drift after the operating system pauses JavaScript in the background.

## Real test failure and fix

The first run produced `Cannot read properties of undefined (reading 'current')`, `unmount is not a function`, TypeScript errors showing `Promise<RenderHookResult<...>>`, and overlapping `act()` warnings.

Root cause: React Native Testing Library 14 changed `renderHook`, `act` and `unmount` to asynchronous APIs. The test used the old synchronous syntax. Every render/action/unmount was changed to `await`; no production code or type cast was used to hide the failure.

## Verification evidence

Ten tests cover normal ticking, background pause, foreground catch-up, initially inactive behavior, cleanup and native app-state classification. Targeted Jest, strict TypeScript, Expo lint and whitespace checks passed.

Reference: React Native 0.86 AppState documentation and the installed RNTL 14 migration/API guides.
