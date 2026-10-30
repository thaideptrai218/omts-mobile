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

- Folder restructuring (31/10/2026): mobile uses app / features / shared, centralized shared API/session foundations and feature-owned routes; backend groups controllers/repositories by feature and separates DTOs/models/interfaces. Source moves preserve UI routes, API payloads and DB schema. See `PROJECT_STRUCTURE.md` and `learning/09-folder-restructure.md`.

- Device incident (31/10/2026): CLI relay GETs timed out while localhost/backend stayed healthy. A fallback HTTPS bootstrap/HMR worked in a desktop browser, but the user reported the generated link invalid in Zalo. Phone recovery is **not verified**; do not treat the fallback link as a working Zalo entry. The user requested folder restructuring first. See `docs/learning/08-device-white-screen.md`.

- Cage purchase requests (31/10/2026, user correction overriding V8 kg for ordering): replaces the preview at `/account/purchases` with API-backed submission/list/detail/cancel, positive whole cages, actual products and pickup dates. Owner inbox/response at `/manage/purchase-requests`; Owner catalogue at `/manage/sales-products`. DB stores requests, idempotency key, status and row version; in-app notifications connect both actors. No cage-to-kg conversion and no payment/invoice/fulfilment/harvest/QR created by this step. See `docs/learning/07-cage-purchase-requests.md`.

- Development role testing (31/10/2026): opt-in server-authorized role switching for one configured linked Owner and its dedicated internal test personas. Owner's real identity/grants stay unchanged. Device mode can switch Owner/Zone Manager/Employee/Trader, with normal token issuance/refresh and old-session revocation. Production disables the tool and rejects persona tokens. Purchase requests now work in cages; harvest/weighing/provenance remain incomplete. See `docs/learning/06-dev-role-switch.md`.

- Workforce basic role support (30/10/2026, DOCX V8): API-backed personal work/attendance/QR/leave at `/account/work`, manager crew assignments/manual-or-QR attendance/job changes at `/manage/workforce`, Owner leave review and dated attendance settings. Employed linked Staff may enter the personal area without management grants; management APIs still enforce zone permissions. No new Accountant feature. This does not complete every V8 use case: missed-time requests/correction, staff-specific attendance variants, cycles/harvest/sales/real public provenance and payslips remain outstanding. See `docs/learning/05-mobile-workforce-roles.md`. SQL migrations applied on dev; code has not been deployed to Zalo or used to replace the pre-existing API process.

- Owner location/form input (30/10/2026): zone/raft create/edit already call real APIs. Added one-shot Zalo location lookup via authenticated Owner-only `POST /api/me/zalo-location`, confirmed map picking, and device-side Vietnamese OCR for labeled raft forms. OCR suggestions are reviewed before applying, never auto-saved. Zone coordinates center the new-raft map without silently becoming the raft position. Coordinates use a decimal-specific parser, independent of money/thousands parsing. Needs validation of Zalo location/camera permission and WebAssembly/worker behavior on real phones; basemap availability still depends on VIETMAP key/quota.

- Historical Trader purchase preview (30/10/2026) was superseded by cage purchase requests on 31/10. Sample-product/kg draft service removed. Trader home continues to exclude mock debt figures/tasks. Sales invoices (OMTS-224/SALE-10) remain unimplemented.

- Zalo Mini App with React 18, TypeScript, Vite, ZaUI, ZMP SDK, Tailwind CSS and Jotai.
- Launch splash, bottom navigation and a role-based dashboard for all seven SRS actors, with legacy sample role data in `src/shared/navigation/roles.ts`; API-backed owner/trader behavior is described above.
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
- Canonical Vietnamese/English message catalog: Mobile currently shows the SRS English texts verbatim (`src/shared/lib/messages.ts`).
- Push channel (Zalo OA/ZNS vs Mini App notifications): `PUSH_PROVIDER` in `src/shared/config/env.ts`.
- Required offline behavior beyond showing `MSG07`; no mutation queue or conflict policy is assumed.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
