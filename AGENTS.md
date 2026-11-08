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

- Zalo entry: `src/app.ts` imports `src/main.tsx`, which restores the session, starts connectivity and mounts `src/App.tsx`.
- Follow the user's structure: `assets`, `components`, `features`, `hooks`, `layouts`, `pages`, `routes`, `services`, `contexts`, `utils`, `constants`. See `docs/PROJECT_STRUCTURE.md`. Do not introduce an `app/` or `shared/` hierarchy.
- Business pages, services, hooks and components belong to `src/features/<area>/`. Use `services/` for API calls inside a feature. Shared components use `components/ComponentName/ComponentName.tsx`; global pages belong to `pages/`, and routing belongs to `routes/`.
- All business models, API request/response DTOs and form data belong to `features/<area>/models/`, grouped by entity. Shared data types belong to `src/models/`. Import them directly with `import type`; do not define or re-export models from services, or put anonymous request/response object types in service signatures. ESLint enforces this separation.
- Models contain type declarations and type-only imports. Services keep runtime API/SDK logic; atoms belong to `state/`, sample data to `data/`. Local component props and animation phases may stay beside their component.
- `App.tsx` composes providers, `layouts/MainLayout.tsx` and `routes/AppRoutes.tsx`. Reusable components receive business UI through props; features do not import application layouts/pages/routes/providers. ESLint enforces these alias boundaries.
- Keep Jotai atoms and the existing default store. `contexts/AppProviders.tsx` composes the existing ZaUI/snackbar providers; do not add a duplicate authentication context or password forms for the folder template.
- Import `@/App.tsx` explicitly from `main.tsx`: extensionless `@/App` resolves to Zalo's `app.ts` on Windows. `allowImportingTsExtensions` is enabled with `noEmit` for this purpose.
- All images live in `src/assets/images/` and must be imported, never referenced by a `/public` path.
- Prefer ZaUI components and the design tokens in `src/assets/styles/app.scss`.

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
