# OMTS-133 — M3.10c login outcome messages

## Outcome

The typed Vietnamese message catalog now includes MSG12, MSG13, MSG67, MSG68 and MSG69 from UC02/SCR-03. MSG67 is a warning; refusal, expired temporary password and temporary login lock outcomes are danger messages.

## Regression-test finding

The first catalog run failed one API-problem test because its “unsupported message code” fixture used MSG12. Once MSG12 became supported, expecting a null display code was obsolete. The fixture was changed to MSG99, preserving the original security assertion: a syntactically valid but unapproved code remains diagnostic-only and never exposes raw backend detail.

This was a test-data maintenance issue caused by expanding the whitelist, not a parser defect.

## Verification evidence

The catalog and API-problem suites passed all 16 tests after the fixture correction. Strict TypeScript, Expo lint and whitespace checks passed.

## Wording status

Vietnamese text follows the current SRS semantics. As with the existing catalog, final localization ownership remains open and these frontend strings are not presented as a frozen backend response contract.
