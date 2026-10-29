# OMTS Mobile — current project context

> Update this summary when Jira, the current SRS, or an approved team decision changes. Planned work is not evidence that a feature has already been implemented.

## Product and actor boundary

OMTS supports Trung Nam Aquaculture Cooperative in managing farming zones, oyster cultivation, sales, traceability, employees, attendance, payroll, and related costs.

Current actors are System Administrator, Cooperative Owner, Staff, Zone Manager, Accountant, Trader, and QR Viewer. The current SRS does not define Household, Household Member, Farmer, or Worker as separate actors. Use the current SRS terminology in navigation, permissions, mock data, and UI copy.

Internal Staff accounts can receive multiple zone-role grants. An account can therefore have different permissions in different farming zones; Mobile navigation must eventually use effective permissions and scope rather than assume one global role.

## Canonical repository topology

OMTS uses three official repositories:

- `thaideptrai218/omts-web`: Next.js Web portal and public QR provenance.
- `thaideptrai218/omts-mobile`: this Zalo Mini App (React + Vite + ZaUI), replacing the earlier Expo/React Native scaffold.
- `thaideptrai218/omts-backend`: .NET backend API.

The repositories release independently. Shared contracts require an explicit team-approved synchronization mechanism; they cannot be imported from an assumed local monorepo.

## Source priority

1. Current Jira issue: sprint scope, owner, dependencies, and done criteria.
2. Current Report 3/SRS: actors, use cases, business rules, permissions, messages, and acceptance criteria.
3. Report 2: approved stack and project-management baseline.
4. OMTS Figma: visual structure and screen flow; it does not override business rules.
5. Historical reports/tracking: background only when they conflict with current sources.

## Platform change (October 2026)

The mobile channel moved from an Expo/React Native app to a **Zalo Mini App**. The Expo scaffold was removed from this repository.
Jira `OMTS-133` (Mobile foundation) was written for Expo: secure storage via `expo-secure-store`, Expo Router route groups and Expo Go builds.
Its acceptance criteria must be re-mapped to Zalo Mini App equivalents before it can be reported as done:

- Login via Zalo account linking instead of a username/password form (see `CLAUDE.md`).
- Token kept in memory or ZMP `nativeStorage`; Zalo Mini Apps have no `localStorage`, `sessionStorage` or cookies.
- Routes with ZaUI `ZMPRouter`; permission-based navigation; shared message catalog; `MSG07` offline banner.
- Builds deployed with `zmp deploy` and tested inside Zalo; lint and typecheck passing in CI.

## Current code status

- Owner location/form input (30/10/2026): zone/raft create/edit already call real APIs. Added one-shot Zalo location lookup via authenticated Owner-only `POST /api/me/zalo-location`, confirmed map picking, and device-side Vietnamese OCR for labeled raft forms. OCR suggestions are reviewed before applying, never auto-saved. Zone coordinates center the new-raft map without silently becoming the raft position. Coordinates use a decimal-specific parser, independent of money/thousands parsing. Needs validation of Zalo location/camera permission and WebAssembly/worker behavior on real phones; basemap availability still depends on VIETMAP key/quota.

- Trader purchase preview (30/10/2026, user-requested small UI trial): `/account/purchases`, trader-only; request form (sample product, positive kg, Vietnam pickup date, optional note), review/edit draft and invoice availability state. No sales API or submission; draft lives only in the mounted screen and is discarded on navigation away/account change. Trader home no longer renders mock debt figures or mock tasks. This is not completion of SALE-01/02/10 or OMTS-223/224.

- Zalo Mini App with React 18, TypeScript, Vite, ZaUI, ZMP SDK, Tailwind CSS and Jotai.
- Launch splash, bottom navigation and a role-based dashboard for all seven SRS actors, using **mock data** only (`src/data/`).
- Traceability lookup by lot code or QR scan, with a sample lot; Account page with cooperative info and privacy policy required by Zalo.
- Account module (ACS-01…07, 28/10/2026): API client with token refresh, session in memory + `nativeStorage`, permission-based dashboard, `MSG07` offline banner, account linking by Zalo phone number (`/link`) as the only way in: no password form, password recovery or change, verification codes, post-login gates, contact changes or self-created trader accounts (passwords are Web-only; 28/10/2026 decision), personal profile with read-only contacts, notification preferences (push waits for the OMTS-215 channel decision), online/offline logout with a queued server revoke. The role switcher was removed.
- The local backend source implements Zalo linking, silent re-entry, unlinking and trader approval requests. Deployment availability must be checked separately; the contract is in `docs/zalo-account-linking.md`.

### Account linking and API authentication

- Mobile identifies the user through Zalo, with no username/password form or OTP flow. The backend resolves the phone number using Zalo tokens, matches it to an OMTS account and stores the Zalo user ID on that account.
- Linking returns OMTS access/refresh tokens. These tokens are still required for protected API calls and zone permissions; removing password entry does not remove API authentication.
- Subsequent app openings restore the OMTS session or obtain one using the linked Zalo identity (`api/auth/zalo/login`), without requesting the phone number again.
- Keep session refresh, protected-route checks, logout/revocation and unlinking. They support the linked account and are not password-login leftovers.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Confirm that the QA deployment includes the locally implemented Zalo endpoints and CORS for `https://h5.zdn.vn`.
- Canonical Vietnamese/English message catalog: Mobile currently shows the SRS English texts verbatim (`src/services/acs/messages.ts`).
- Push channel (Zalo OA/ZNS vs Mini App notifications): `PUSH_PROVIDER` in `src/config.ts`.
- Required offline behavior beyond showing `MSG07`; no mutation queue or conflict policy is assumed.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
