# OMTS Mobile — current authentication API contract matrix

> Captured: 22/10/2026
> Backend source: `thaideptrai218/omts-backend` at `14d7839`
> Purpose: record the current wire contract before Mobile implements its HTTP/session layer
> Authority: evidence from backend source and integration-test source; this file does not change SRS, Jira or backend behavior

> Recheck 22/10/2026: this matrix is the historical `14d7839` feature-branch snapshot, not proof the endpoints exist on backend develop. Fresh fetch shows develop `c5360ca` has domain/schema but not auth controllers; feature `7a41aa6` contains refactored auth plus audit, with the same gate/wire gaps. See [backend readiness recheck](../reports/BACKEND_READINESS_RECHECK_2026-10-22.md) for per-ref evidence and current integration blockers.

## 1. Reliability labels

- **Implemented:** an endpoint and its behavior exist in the inspected backend source.
- **Test described:** an integration test exists in source, but was not executed in this audit environment.
- **Needs confirmation:** Mobile must not hard-code the behavior until Backend publishes or approves it.
- **Missing:** there is no production endpoint in the inspected backend commit.

The integration tests could not run locally because `global.json` requires .NET SDK `8.0.418`, while the machine currently has only SDK `10.0.103`. Therefore this matrix does not claim runtime QA evidence.

## 2. Existing endpoint summary

| Endpoint | Auth | Current purpose | Evidence | Mobile readiness |
|---|---|---|---|---|
| `POST /api/auth/login` | Anonymous | Validate credentials and create a login session | Implemented; test described | Blocked by enum and gate-contract confirmation |
| `POST /api/auth/refresh` | Anonymous; refresh token in body | Rotate refresh token and return a new token pair | Implemented; replay test described | Contract usable after DTO mapping is fixed |
| `POST /api/auth/logout` | Bearer access token | Revoke the current session | Implemented; test described | Online logout usable; offline revoke contract missing |
| `GET /api/me` | Bearer access token | Read token identity while onboarding gates are active | Implemented; basic auth test described | Usable for identity bootstrap with caveats |
| `GET /api/me/permissions` | Bearer access token | Return effective functions/actions/zones/grants | Implemented; zone test described | Blocked while password/contact gate is active |

## 3. Common serialization and error rules

ASP.NET Core's current default camel-case JSON naming applies. `Program.cs` does not configure `JsonStringEnumConverter`, so enum-valued properties are currently numeric unless backend code explicitly converts them to strings.

Backend-created business errors use `ProblemDetails` with the message code in both `title` and `extensions.code`:

```json
{
  "title": "MSG12",
  "status": 401,
  "detail": "Wrong identifier or password.",
  "code": "MSG12"
}
```

Mobile must use `code` for catalog mapping and treat `detail` as diagnostic fallback, not final Vietnamese UI copy.

Not every failure currently follows this shape:

- automatic `[ApiController]` validation may return `ValidationProblemDetails` without an OMTS message code;
- JWT authentication failures may return an empty/default 401 response;
- `/api/me/permissions` may return a plain `Unauthorized()` result.

The future HTTP adapter therefore needs a safe `unknownProblem` result instead of assuming every error contains `code`.

## 4. `POST /api/auth/login`

### Current request

```json
{
  "identifier": "nguyenvanan.4821",
  "password": "<secret>",
  "clientType": 1,
  "deviceName": "Duy Thai's Android"
}
```

| Field | Current type | Required by model | Meaning |
|---|---|---|---|
| `identifier` | string | Yes | Username, verified phone or verified email |
| `password` | string | Yes | Current or temporary password |
| `clientType` | numeric enum | No; defaults to `0`/Web | `0 = Web`, `1 = Mobile` in the current enum order |
| `deviceName` | string or null | No | Human-readable session/device label |

**Do not implement `clientType: 1` in Mobile yet.** Its meaning currently depends on internal enum order. Backend should publish a string value such as `"Mobile"` or explicitly guarantee the numeric wire contract.

If Mobile omits `clientType`, backend silently creates a Web session, giving the wrong refresh/session lifetime.

### Current success response

```json
{
  "accessToken": "<jwt>",
  "accessTokenExpiresAt": "2026-10-22T12:15:00+00:00",
  "refreshToken": "<opaque-secret>",
  "refreshTokenExpiresAt": "2026-11-21T12:00:00+00:00",
  "accountId": "00000000-0000-0000-0000-000000000000",
  "displayName": "Nguyen Van An",
  "subjectType": 2,
  "mustChangePassword": true,
  "phoneVerificationRequired": true
}
```

`subjectType` is currently numeric in this response:

| Value | Current backend enum |
|---|---|
| `0` | `SystemAdministrator` |
| `1` | `CooperativeOwner` |
| `2` | `Staff` |
| `3` | `Trader` |

Mobile should not expose these numbers beyond its API adapter. Backend should preferably serialize stable strings.

### Current failure matrix

| HTTP | Code | Current condition | UI recovery |
|---:|---|---|---|
| 401 | `MSG12` | Unknown identifier or wrong password | Keep identifier; clear password; generic credential message |
| 423 | `MSG69` | Five failures / temporary lock | Disable immediate retry as directed by message/policy |
| 403 | `MSG13` | Account locked/suspended or Staff has no effective AccessGrant | Contact Owner/support; do not reveal which internal rule failed |
| 403 | `MSG68` | Temporary password older than backend's current 24-hour policy | Ask Owner to issue a new credential |
| 400 | no stable OMTS code | Malformed/missing DTO or invalid enum | Developer/contract error; safe generic UI fallback |

### Gate mismatch

Current response has two booleans, not the approved `nextAction + onboarding` contract. It also requires verified **phone** for Staff/Trader, while the approved frontend decision allows verified email **or** phone. Mobile must not implement the final route resolver against these fields until Backend/BA reconcile this mismatch.

## 5. `POST /api/auth/refresh`

### Request

```json
{
  "refreshToken": "<opaque-secret>"
}
```

### Success

Returns the same current `AuthTokens` shape as login. The refresh token is rotated; the submitted token immediately becomes stale.

### Failure and concurrency behavior

| HTTP | Code | Condition |
|---:|---|---|
| 401 | `MSG19` | Token unknown, expired, revoked or already rotated |
| 403 | `MSG13` | Account no longer active or Staff no longer has effective access |

Backend source treats reuse of the previous refresh token as possible theft and revokes the whole session. This makes a **single-flight refresh coordinator mandatory** in Mobile: parallel 401 handlers must share one refresh operation instead of sending the same refresh token several times.

The controller's OpenAPI annotations list only 200 and 401, although service behavior can also produce 403 `MSG13`. Backend should update its API description.

## 6. `POST /api/auth/logout`

### Request

- bearer access token required;
- empty body;
- allowed while password change or phone verification is still required.

### Response

- `204 No Content` after attempting to revoke the current session;
- a missing session still ends as 204 in the controller;
- an invalid/revoked bearer token is rejected by authentication before the action runs.

The endpoint is enough for online logout. It is not enough to implement Jira's deferred offline revoke because there is no opaque revocation handle or idempotent queue contract.

## 7. `GET /api/me`

### Success response

```json
{
  "accountId": "00000000-0000-0000-0000-000000000000",
  "sessionId": "00000000-0000-0000-0000-000000000000",
  "username": "nguyenvanan.4821",
  "subjectType": "Staff"
}
```

This endpoint is deliberately allowed through both onboarding gates. It reads identity from token claims and does not currently return `displayName`, declared contacts, verification state, `nextAction` or onboarding checklist. It cannot by itself restore the complete proposed onboarding screen after app restart.

## 8. `GET /api/me/permissions`

### Success response shape

```json
{
  "accountId": "00000000-0000-0000-0000-000000000000",
  "subjectType": "Staff",
  "isCooperativeOwner": false,
  "requiresPasswordChange": false,
  "requiresPhoneVerification": false,
  "functions": [
    {
      "function": "RAFTS",
      "name": "Rafts",
      "allZones": false,
      "zoneIds": ["00000000-0000-0000-0000-000000000000"],
      "actions": ["View"]
    }
  ],
  "grants": [
    {
      "zoneId": "00000000-0000-0000-0000-000000000000",
      "zoneCode": "ZONE-A",
      "zoneName": "Vung A",
      "allZones": false,
      "role": "Zone Manager",
      "permissions": [
        {
          "functionCode": "RAFTS",
          "canView": true,
          "canCreate": false,
          "canEdit": false,
          "canDelete": false,
          "otherPermissions": [],
          "dataScope": 0
        }
      ]
    }
  ]
}
```

Important details:

- `subjectType` and `actions` are explicitly converted to strings;
- `dataScope` remains a numeric enum under current serializer settings;
- `zoneId = null` plus `allZones = true` represents an all-zones grant;
- `functions` is the effective union used to build menus;
- `grants` preserves role and zone detail for explanation/context;
- Cooperative Owner receives effective access everywhere through backend logic, even without Staff-style grants.

### Gate responses

| HTTP | Code | Meaning |
|---:|---|---|
| 403 | `PASSWORD_CHANGE_REQUIRED` | Temporary password must be changed first |
| 403 | `MSG67` | Current backend requires verified phone |
| 401 | not guaranteed | Session invalid/revoked or account lookup unavailable |

Mobile should fetch permissions only after the server confirms that onboarding gates are complete.

## 9. Missing production endpoints

| Capability | Required tickets/screens | Current status |
|---|---|---|
| Start/resend/verify contact challenge | OMTS-151, SCR-02 | Missing |
| Trader registration | OMTS-155, SCR-01 | Missing |
| Account recovery | OMTS-164, SCR-04 | Missing |
| Forced/normal password change | OMTS-168, SCR-05 | Missing; only test-only route exists |
| Onboarding status/completion | OMTS-160/168 | Missing |
| Profile read/update | OMTS-172, SCR-05 | Missing |
| Contact replacement verification | OMTS-172/151 | Missing |
| Notification preferences | OMTS-176, SCR-06 | Missing |
| Push-token registration | OMTS-176 | Missing |
| Deferred offline logout revoke | OMTS-180 | Missing contract |

These features may receive UI/domain contracts later, but must be labeled mock-only until backend publishes production endpoints.

## 10. Decisions required before Mobile auth implementation

1. Backend chooses and publishes a stable Mobile `clientType` representation.
2. Backend serializes `subjectType` and `dataScope` consistently or publishes their numeric contract explicitly.
3. BA/Backend reconcile temporary-password lifetime: current backend 24 hours versus approved frontend proposal 72 hours.
4. BA/Backend reconcile contact gate: phone-only versus verified email-or-phone.
5. Backend confirms whether booleans remain or adopts `nextAction + onboarding`.
6. Backend defines how app restart restores onboarding state and declared masked contacts.
7. Backend normalizes error responses so validation/JWT failures have a safe stable code, or accepts that clients use a generic fallback.

## 11. Adapter boundary proposed for Mobile

The future API adapter owns raw DTOs and maps them into frontend domain results:

```text
HTTP JSON / ProblemDetails
  -> auth API DTO
  -> auth repository adapter
  -> session domain result
  -> session service/state machine
  -> route resolver
  -> UI
```

UI components must never compare `subjectType === 2`, inspect raw HTTP status, or parse `problem.detail`. Those are transport details and belong in the adapter.

## 12. Follow-up proposal

The concrete handoff for enum serialization, Mobile client identity and privacy-safe `deviceName` is documented in `AUTH_ENUM_CONTRACT_PROPOSAL.md`. Its examples are recommendations awaiting Backend confirmation; they do not describe the current runtime contract.
