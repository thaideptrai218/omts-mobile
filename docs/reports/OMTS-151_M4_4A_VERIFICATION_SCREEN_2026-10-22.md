# OMTS-151 — M4.4a shared SCR-02 presentation

## Outcome

A production-oriented shared `VerificationScreen` now composes the masked recipient, six-digit field, validity/limit notices, typed feedback and Verify/Resend/Back actions. It is a feature component, not a development showcase or a route backed by fake data.

## Separation of responsibilities

The screen receives a challenge, derived timing, controlled code, pending action and callbacks. It does not call HTTP, create a challenge, persist a token or select the next route. Registration, recovery, onboarding and profile wrappers can therefore reuse the same presentation while their controllers retain flow-specific behavior.

Verification is enabled only for exactly six digits, a non-expired challenge and no pending operation. Resend additionally requires cooldown completion, remaining sends and an explicit `resendAllowed` decision from the controller. Expiry is intentionally not folded into that decision because resend-after-expiry behavior still requires backend confirmation.

## UX/accessibility

- The destination remains partially masked.
- The title is exposed as a heading.
- Recipient information is grouped into one accessible label.
- Countdown updates use a polite live region.
- Pending actions lock conflicting controls and show local progress.
- The screen remains scrollable and keyboard-safe for small screens and large text.

## Verification evidence

Five tests cover masked data, limits/countdowns, incomplete and expired code blocking, controller-approved resend and duration formatting. Targeted Jest, strict TypeScript, Expo lint and whitespace checks passed.

## Still open

- A route/controller connected to validated create/resend/verify endpoint adapters.
- Exact resend behavior after expiry.
- Device testing for keyboard, autofill, screen reader and large text.
- At least two real calling flows before OMTS-151 can satisfy its reuse acceptance criterion.
