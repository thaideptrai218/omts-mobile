This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

# OMTS Mobile working rules

## Project context

- Before starting a new task, read `docs/PROJECT_CONTEXT.md` and the relevant Jira issue, SRS use case, and Figma frame.
- The canonical repositories are `thaideptrai218/omts-web`, `thaideptrai218/omts-mobile`, and `thaideptrai218/omts-backend`. This repository contains Mobile only.
- Current SRS actors are System Administrator, Cooperative Owner, Staff, Zone Manager, Accountant, Trader, and QR Viewer. Do not introduce Household/Farmer actors from historical reports unless current requirements add them again.
- Jira defines sprint scope and dependencies; the current SRS defines business rules; Figma illustrates layout and flow but does not override either source.

## Mobile UX and architecture

- Optimize for field use: touch targets, sunlight-readable contrast, intermittent connectivity, clear pending/sync states, and one-handed interaction where practical.
- Do not assume every Web feature belongs in Mobile. Check Jira and the screen strategy before adding a screen.
- Keep route files in `src/app/`; keep components, services, repositories, hooks, schemas, and domain contracts outside the route directory.
- UI components must not call SecureStore, mock storage, or HTTP directly. Use service/repository contracts so mock and API adapters can share behavior.
- Use skeletons for initial content loading and local pending/disabled/progress feedback for mutations.

## Decisions that require confirmation

Ask the user before implementing a change that adds/removes a business step, changes actors or zone scope, changes a status transition, changes required fields/validation, changes public QR data, changes offline queue/sync/conflict behavior, changes the Web/Mobile boundary, or resolves an open SRS question.

Session bootstrap, access/refresh token lifetime, refresh concurrency, permission payloads, and protected cache cleanup affect security or backend contracts. Present the design and obtain confirmation before choosing one.

## Authentication, permissions, and offline behavior

- Store real Mobile tokens only through `expo-secure-store`; never use AsyncStorage, source files, or committed environment files for credentials.
- Separate `(auth)` and `(app)` navigation once the session bootstrap design is confirmed. Do not flash a protected screen before bootstrap finishes.
- Internal Staff accounts can have multiple zone-role grants. Build navigation from effective permission and scope, not one role label.
- Frontend gates improve navigation; the backend remains the final authorization boundary.
- Connectivity loss must produce the approved `MSG07` experience. Do not invent an offline mutation queue, merge rule, or conflict policy without SRS/Jira confirmation.

## Learning and review workflow

- Work in small reviewable tasks. Before code, explain: what it is, why it is needed, how data/control flows, and likely defense questions.
- Explain concepts from the underlying problem to the concrete OMTS code; avoid definition-only summaries.
- When an error occurs, record the command, important output, root cause, cascading errors, diagnosis, fix, and verification in `docs/learning/`.
- Do not ask the learner to answer a concept that has not been explained first.
- Run `npm run lint`, `npm run typecheck`, and `npx expo-doctor` as proportionate checks before declaring foundation changes complete.

## Git workflow

- Branch from `develop`; use Jira-linked `feature/OMTS-<n>-<slug>` or `fix/OMTS-<n>-<slug>` branches for implementation work.
- Use `chore/<slug>` or `docs/<slug>` only when no Jira implementation issue applies.
- Push a branch and open a PR into `develop`; do not push directly to protected `develop` or `main`.
