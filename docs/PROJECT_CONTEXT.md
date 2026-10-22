# OMTS Mobile — current project context

> Update this summary when Jira, the current SRS, or an approved team decision changes. Planned work is not evidence that a feature has already been implemented.

## Product and actor boundary

OMTS supports Trung Nam Aquaculture Cooperative in managing farming zones, oyster cultivation, sales, traceability, employees, attendance, payroll, and related costs.

Current actors are System Administrator, Cooperative Owner, Staff, Zone Manager, Accountant, Trader, and QR Viewer. The current SRS does not define Household, Household Member, Farmer, or Worker as separate actors. Use the current SRS terminology in navigation, permissions, mock data, and UI copy.

Internal Staff accounts can receive multiple zone-role grants. An account can therefore have different permissions in different farming zones; Mobile navigation must eventually use effective permissions and scope rather than assume one global role.

## Canonical repository topology

OMTS uses three official repositories:

- `thaideptrai218/omts-web`: Next.js Web portal and public QR provenance.
- `thaideptrai218/omts-mobile`: this Expo/React Native field application.
- `thaideptrai218/omts-backend`: .NET backend API.

The repositories release independently. Shared contracts require an explicit team-approved synchronization mechanism; they cannot be imported from an assumed local monorepo.

## Source priority

1. Current Jira issue: sprint scope, owner, dependencies, and done criteria.
2. Current Report 3/SRS: actors, use cases, business rules, permissions, messages, and acceptance criteria.
3. Report 2: approved stack and project-management baseline.
4. OMTS Figma: visual structure and screen flow; it does not override business rules.
5. Historical reports/tracking: background only when they conflict with current sources.

## Confirmed Mobile foundation target

Jira `OMTS-133` requires:

- Expo Router auth and app route groups.
- Token storage using `expo-secure-store`.
- API client with refresh behavior.
- Navigation based on permissions.
- Shared message catalog behavior.
- Offline banner for `MSG07`.
- A build that runs in Expo Go against the QA API, with lint and typecheck passing.

## Current code status

- Expo 57.0.31, React Native 0.86, Expo Router 57.0.29, and strict TypeScript are configured. Expo packages pass the SDK compatibility checks from Expo Doctor.
- Typed routes and React Compiler are enabled.
- The root layout owns a connectivity provider and accessible global offline banner. The typed catalog now covers implemented verification, login and recovery outcomes (MSG01/04/07/12/13/15/16/67/68/69) without displaying raw server prose; MSG07 deliberately does not promise an offline mutation queue. Connectivity transitions and banner visibility have automated tests; physical-device transitions remain unverified.
- Connectivity is isolated through domain, repository and service boundaries. The Expo Network adapter maps native `online/offline/unknown` state without letting UI components call the native module directly.
- `expo-secure-store` is installed and configured for SDK 57, but secure token persistence, session bootstrap, API client, refresh flow, route groups, and permission navigation are not implemented yet.
- The current backend contract has been inventoried at commit `14d7839`. It serializes several public enums numerically, so Mobile has prepared a string-enum proposal but has not hard-coded `clientType: 1` or started production login integration.
- A tested unauthenticated fetch transport and ProblemDetails parser now handle JSON/no-content responses, safe URL joining (including encoded traversal rejection), timeout/cancellation and privacy-safe failures. They deliberately do not attach tokens or refresh sessions while the auth contract remains unresolved.
- OMTS-151 now has a tested production SCR-02 presentation composed from the six-digit field, screen-safe purpose contract and foreground-aware countdown. It is not routed with fake data; endpoint adapters, resend/attempt policy and calling-flow wrappers remain pending, and the transient verification token is not persisted.
- OMTS-155 now has a tested controlled SCR-01 presentation, Email/Phone selector and pure form contract for confirmed password rules. No identifier regex, endpoint call, method-switch data deletion or fake route has been invented while the canonical backend registration contract is absent.
- OMTS-160 now has a tested controlled SCR-03 login presentation, required-only credential validation and provisional MSG12/13/67/68/69 content. Session creation, SecureStore tokens, gate priority, permission navigation and routes remain unimplemented pending the documented backend contracts.
- OMTS-164 M7.1 now has a tested privacy-equivalent recovery-request presentation and MSG15. The next verification action is visually uniform, but an opaque recovery-attempt backend contract is required before routing to SCR-02; Mobile does not fabricate a local challenge.
- The Mobile UI foundation has typed semantic light/dark themes and shared form/feedback primitives now exercised by real auth feature components. The repository currently passes 18 automated suites / 109 tests.
- The current verification baseline is lint, strict TypeScript, Expo Doctor 21/21, `git diff --check` and a successful Expo web export. Expo Go/physical-device connectivity, accessibility/autofill and the QA API remain unverified.

Do not report `OMTS-133` as complete based on the scaffold alone.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Backend approval of the proposed string wire values for Mobile `clientType`, login `subjectType` and permission `dataScope`.
- QA evidence that a Mobile login creates the intended Mobile session and lifetime.
- The final post-login gate response (`nextAction + onboarding` versus the backend's current booleans).
- `/me/permissions` payload stability, especially zone scope and all-zone access.
- Canonical Vietnamese/English message catalog.
- Final Vietnamese wording for `MSG07`; the current banner copy is deliberately narrower than the SRS message because offline draft persistence/synchronization is not implemented by this foundation slice.
- Required offline behavior beyond showing `MSG07`; no mutation queue or conflict policy is assumed.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
