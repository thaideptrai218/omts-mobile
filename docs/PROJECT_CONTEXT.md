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

- Zalo Mini App with React 18, TypeScript, Vite, ZaUI, ZMP SDK, Tailwind CSS and Jotai.
- Launch splash, bottom navigation and a role-based dashboard for all seven SRS actors, using **mock data** only (`src/data/`).
- Traceability lookup by lot code or QR scan, with a sample lot; Account page with cooperative info and privacy policy required by Zalo.
- Account module (ACS-01…07, 28/10/2026): API client with token refresh, session in memory + `nativeStorage`, permission-based dashboard, `MSG07` offline banner, shared verification screen, account linking by Zalo phone number (`/link`, no username/password form), temporary-password and phone gates, password recovery and change, personal profile with verified contact changes, notification preferences (push waits for the OMTS-215 channel decision), online/offline logout with a queued server revoke. The role switcher was removed.
- Backend `develop` still lacks the Zalo linking endpoints; the proposed contract is in `docs/zalo-account-linking.md`. Every other ACS screen runs against the real backend.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Zalo linking endpoints (`POST api/auth/zalo/link`, `POST api/auth/zalo/login`, `DELETE api/me/zalo-link`): the backend owner must confirm the contract in `docs/zalo-account-linking.md` and add CORS for `https://h5.zdn.vn`.
- Canonical Vietnamese/English message catalog: Mobile currently shows the SRS English texts verbatim (`src/services/acs/messages.ts`).
- Push channel (Zalo OA/ZNS vs Mini App notifications): `PUSH_PROVIDER` in `src/config.ts`.
- Required offline behavior beyond showing `MSG07`; no mutation queue or conflict policy is assumed.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
