# OMTS-133 — M3.10b verification messages

## Outcome

The typed client message catalog now supports the three codes used by SCR-02: MSG01, MSG04 and MSG16, while preserving MSG07 and the privacy-safe unknown-code fallback.

## Design

- MSG01 and MSG04 have an overloaded resolver that requires trusted frontend context (`fieldName` or `serviceName`).
- MSG07 and MSG16 require no parameters.
- The generic API-problem resolver can still display a safe parameter-free version when only a server code is available.
- Raw backend title/detail text is never interpolated into these messages.

The Vietnamese copy is a faithful UI translation of the current SRS message table. The SRS itself marks final wording as pending UI confirmation, so this report does not claim that the copy is a frozen backend contract.

## Verification evidence

Message-catalog and API-problem suites passed 11 tests. Strict TypeScript, Expo lint and whitespace checks also passed.

## Remaining work

Additional auth/account message codes should be added only with the feature that uses them. Canonical localization ownership and backend code/payload stability remain open.
