This is the OMTS mobile app, built as a **Zalo Mini App** (React 18 + TypeScript + Vite, ZaUI `zmp-ui`, ZMP SDK `zmp-sdk`).
It runs inside the Zalo app's webview, not as a native app.

## Zalo platform rules come first

Read `CLAUDE.md` before writing code. It collects the Zalo Mini App review policy, data rules, Checkout SDK payment flow and technical limits.
Zalo rejects or hides apps that break them, so they override convenience. When unsure about a Zalo API, read the official docs at
https://mini.zalo.me/documents (API pages live under `/documents/api/<name>/`); never answer from memory.

## Commands

```bash
npm start          # zmp start --no-frame (dev server, open the printed URL or the Zalo extension simulator)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # production build into www/
npm run deploy     # zmp deploy (Development / Testing)
```

Run lint and typecheck before declaring any task done. CI runs both on every PR.

## Structure

- Entry: `src/app.ts` mounts `src/app/layout.tsx`, which declares routes with ZaUI `ZMPRouter` + `AnimationRoutes`.
- Application composition is in `src/app/`; each business area owns its pages, API calls, components and state under `src/features/<area>/`. Shared foundations are under `src/shared/`. See `docs/PROJECT_STRUCTURE.md`.
- Features do not import app code; shared does not import app or features. ESLint enforces these alias boundaries. Domain-specific state/mock data belongs to its feature; session and global preferences are shared foundations.
- All images live in `src/static/images/` and must be imported, never referenced by a `/public` path.
- Prefer ZaUI components and the design tokens in `src/shared/styles/app.scss`.

# OMTS Mobile working rules

## Project context

- Before starting a new task, read `docs/PROJECT_CONTEXT.md` and the relevant Jira issue, SRS use case, and Figma frame.
- The canonical repositories are `thaideptrai218/omts-web`, `thaideptrai218/omts-mobile`, and `thaideptrai218/omts-backend`. This repository contains Mobile only.
- Current SRS actors are System Administrator, Cooperative Owner, Staff, Zone Manager, Accountant, Trader, and QR Viewer. Do not introduce Household/Farmer actors from historical reports unless current requirements add them again.
- Jira defines sprint scope and dependencies; the current SRS defines business rules; Figma illustrates layout and flow but does not override either source.

## Mobile UX and architecture

- Optimize for field use: touch targets, sunlight-readable contrast, intermittent connectivity, clear pending/sync states, and one-handed interaction where practical.
- Do not assume every Web feature belongs in Mobile. Check Jira and the screen strategy before adding a screen.
- UI components must not call storage or HTTP directly. Use service/repository modules so mock and API adapters can share behavior.
- Use skeletons for initial content loading and local pending/disabled/progress feedback for mutations.

## Decisions that require confirmation

Ask the user before implementing a change that adds/removes a business step, changes actors or zone scope, changes a status transition, changes required fields/validation, changes public QR data, changes offline queue/sync/conflict behavior, changes the Web/Mobile boundary, or resolves an open SRS question.

Session bootstrap, token lifetime, refresh concurrency, permission payloads, and protected cache cleanup affect security or backend contracts. Present the design and obtain confirmation before choosing one.

## Authentication, permissions, and offline behavior

- Users sign in with their Zalo account and link it once to their OMTS profile ("Liên kết tài khoản"); there is no username/password form. See `CLAUDE.md`.
- Zalo Mini Apps have no `localStorage`, `sessionStorage` or cookies. Keep tokens in memory or ZMP `nativeStorage`, send them in the `Authorization` header, and never commit credentials or `.env` files.
- Internal Staff accounts can have multiple zone-role grants. Build navigation from effective permission and scope, not one role label.
- Frontend gates improve navigation; the backend remains the final authorization boundary.
- Connectivity loss must produce the approved `MSG07` experience. Do not invent an offline mutation queue, merge rule, or conflict policy without SRS/Jira confirmation.

## Learning and review workflow

- Work in small reviewable tasks. Before code, explain: what it is, why it is needed, how data/control flows, and likely defense questions.
- Explain concepts from the underlying problem to the concrete OMTS code; avoid definition-only summaries.
- When an error occurs, record the command, important output, root cause, cascading errors, diagnosis, fix, and verification in `docs/learning/`.
- Do not ask the learner to answer a concept that has not been explained first.

## Git workflow

- Branch from `develop`; use Jira-linked `feature/OMTS-<n>-<slug>` or `fix/OMTS-<n>-<slug>` branches for implementation work.
- Use `chore/<slug>` or `docs/<slug>` only when no Jira implementation issue applies.
- Push a branch and open a PR into `develop`; do not push directly to protected `develop` or `main`.
