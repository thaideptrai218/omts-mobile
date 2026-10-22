# OMTS-151 — M4.3a verification timing

## Outcome

The verification domain can now derive stable countdown facts from server-provided timestamps without timers, React state or API assumptions.

## Design

`getVerificationTiming(challenge, nowEpochMs)` returns:

- whole seconds until expiration and resend availability;
- whether the challenge is expired;
- whether the resend cooldown is complete;
- whether any sends remain.

The function deliberately does not return a combined `canResend`. The backend contract has not confirmed whether an expired challenge is resent, replaced or restarted, so combining expiry, cooldown and send count here would silently create a business rule.

Remaining milliseconds are rounded upward. This prevents a control from appearing ready during the final fraction of a second. Elapsed values are clamped to zero so the UI never displays negative time.

## Verification evidence

Five tests cover fractional-second rounding, exact cooldown/expiry boundaries, exhausted sends and elapsed timestamps. Targeted Jest, strict TypeScript, Expo lint and `git diff --check` passed.

## Remaining work

- A UI hook must provide the changing current time and handle app foreground/background transitions.
- The backend team must confirm resend behavior after expiry and endpoint responses before the screen enables real mutations.
