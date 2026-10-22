# OMTS-155 — M6.1a registration form domain

## Sources reviewed

- Jira OMTS-155: email/phone choice, password and confirmation, SCR-02, success to login, MSG14 navigation choices.
- SRS UC01/SCR-01: Trader only, required identifier, password of at least eight characters containing letters and digits, exact confirmation and no internal permission granted by registration.

## Outcome

The registration feature now has channel-specific form types and a pure validator for confirmed local rules. It trims the identifier, preserves the password exactly, validates required fields/password policy/confirmation, and returns a discriminated success-or-errors result.

The validator deliberately does not invent an email or phone regex because neither Jira nor the current SRS defines the canonical format. Format and uniqueness remain endpoint concerns until the backend contract is available.

## Real typecheck failure and fix

The first Jest run passed all behavior tests, but `tsc --noEmit` reported `TS2540: Cannot assign to ... because it is a read-only property` for the error accumulator.

Root cause: `RegistrationFormErrors` correctly exposes a readonly result to callers, but the same readonly type was used while incrementally constructing the object inside the validator. The local accumulator now uses a mutable `Partial<Record<...>>`; the exported return type remains readonly. This demonstrates why passing tests alone are not sufficient evidence in TypeScript projects.

## Verification evidence

Six tests cover normalized identifiers, exact password preservation, short/letterless/numberless passwords, required/mismatch errors and the deliberate absence of an invented identifier regex. Targeted Jest, strict TypeScript, Expo lint and whitespace checks passed.

## Still open

- Canonical email and phone formats from the backend/OpenAPI contract.
- Registration availability/start endpoints and DTOs.
- MSG14 response mapping and flow navigation.
