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

- Expo 57, React Native 0.86, Expo Router, and strict TypeScript are configured.
- Typed routes and React Compiler are enabled.
- The root layout currently renders a plain Stack and the root screen is placeholder content.
- Secure token storage, session bootstrap, API client, refresh flow, route groups, permission navigation, message catalog, and offline banner are not implemented yet.

Do not report `OMTS-133` as complete based on the scaffold alone.

## Current Mobile critical path

1. `OMTS-133`: Mobile foundation.
2. `OMTS-151`: UC08 verification gate.
3. `OMTS-160`: UC02 login and post-login gates.
4. `OMTS-180`: UC07 logout and protected-state cleanup.

## Decisions still requiring confirmation

- QA API base URL and current OpenAPI/response contracts.
- Access/refresh token response shape, lifetime, and refresh endpoint behavior.
- `/me/permissions` payload, especially zone scope and all-zone access.
- Canonical Vietnamese/English message catalog.
- Required offline behavior beyond showing `MSG07`; no mutation queue or conflict policy is assumed.
- Which screens are Mobile-native versus Web-only when Jira has not assigned a channel.

Do not silently resolve these questions in UI code because they affect security, backend integration, or business behavior.
