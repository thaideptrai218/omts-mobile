# OMTS-133 — M1.1 authentication contract inventory

> Date: 22/10/2026
> Result: documentation and contract analysis only; no application source changed

## Completed work

- Inspected backend auth, identity, permission and account-state-gate source at commit `14d7839`.
- Inspected integration-test source for login privacy, lockout, refresh rotation/replay, logout revocation and zone permission behavior.
- Recorded the exact current wire contract in `docs/contracts/AUTH_API_CONTRACT_MATRIX.md`.
- Separated implemented endpoints from missing endpoints and unconfirmed proposals.

## Main findings

1. Login, refresh, logout, `/api/me` and `/api/me/permissions` exist.
2. Mobile client type is currently a numeric enum. Omitting it silently creates a Web session.
3. Login returns numeric `subjectType`, `/api/me` and permissions return it as a string, and grant `dataScope` remains numeric.
4. Refresh token rotation makes parallel refresh calls unsafe; Mobile needs one shared refresh operation.
5. Backend currently enforces phone verification, not the approved email-or-phone proposal.
6. Backend currently enforces a 24-hour temporary password, not the proposed 72-hour rule.
7. The current API returns booleans rather than the approved `nextAction + onboarding` model.
8. Most SCR-01/02/04/05/06 production endpoints do not yet exist.

## Verification limitation

Attempted command:

```text
dotnet test OMTS.sln --filter "FullyQualifiedName~AuthEndpointsTests|FullyQualifiedName~AuthorizationTests" --no-restore
```

The command failed before compiling because backend `global.json` pins SDK `8.0.418`, but the machine only has SDK `10.0.103`. No backend file was changed to bypass the pin. Findings are therefore supported by source and test definitions, not a fresh local test execution.

## Completion assessment

M1.1 is complete as an inventory. It does not unblock token/session coding by itself. M1.2 and M1.3 still require Backend to confirm Mobile client identity and the post-login gate contract.

## Defense Q&A

**Why does Mobile need its own domain model instead of using backend DTOs directly?**

The current wire format already contains inconsistent enum serialization. An adapter isolates that instability so routes/components operate on named states rather than enum numbers and HTTP details.

**Why can parallel refresh requests terminate a valid session?**

Backend rotates refresh tokens. After the first refresh succeeds, the old token becomes the previous token. A second request reusing it is treated as replay and revokes the entire session.

**Why is source inspection not the same as passing tests?**

Source shows intended logic and test coverage, but only execution proves the code builds and behaves in the current environment. The required .NET 8 SDK is absent, so the limitation is stated rather than hidden.
