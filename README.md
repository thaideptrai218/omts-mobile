# omts-mobile

Mobile app for **OMTS — Oyster Management and Traceability System** for Trung Nam Aquaculture Cooperative (SEP490_G83),
delivered as a **Zalo Mini App**: role-based dashboards for cooperative staff and traders, and public traceability by QR code.
Sibling repos: [omts-backend](https://github.com/thaideptrai218/omts-backend) · [omts-web](https://github.com/thaideptrai218/omts-web)

## Stack

Zalo Mini App · React 18 · TypeScript · Vite · ZaUI (`zmp-ui`) · ZMP SDK (`zmp-sdk`) · Tailwind CSS · Jotai

## Getting started

Prerequisites: Node.js (version in `.nvmrc`), npm, Zalo Mini App CLI, and the Zalo app on your phone for device testing.

```bash
npm install -g zmp-cli
npm ci
cp .env.example .env     # fill APP_ID; ZMP_TOKEN is written by `npm run login`; empty VITE_API_BASE_URL = proxy to the local backend
npm run login
npm start                # zmp start --no-frame, then open the printed localhost URL
```

Preview inside the **Zalo Mini App** VS Code extension simulator, or deploy a Development build and scan its QR code with Zalo.
APIs such as `getAccessToken`, `getPhoneNumber` and Checkout SDK only work inside Zalo, not in a desktop browser.

| Script | Purpose |
|---|---|
| `npm start` | Dev server without the zmp-cli phone frame |
| `npm run lint` | ESLint (TypeScript + React Hooks rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build into `www/` |
| `npm run deploy` | `zmp deploy` (Development or Testing build) |

## Project layout

```text
src/
  app.ts             Zalo entry point; restore session, start connectivity, mount React
  app/               application layout, session guard, navigation shell
  features/          account, dashboard, farming, organization, purchasing, sales,
                     workforce, notifications, traceability, development
  shared/            api, auth, config, hooks, lib, navigation, platform, preferences,
                     routing, styles, ui
  static/images/     imported images
scripts/testing/     manual browser test scenarios
docs/                context, structure, contracts, learning notes
app-config.json      Zalo window configuration
www/                 generated build output (git-ignored)
```

Detailed responsibilities and import boundaries: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Rules

Zalo review policy, data and payment rules, and technical limits are collected in [CLAUDE.md](CLAUDE.md). Read it before adding features.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — branches, Jira keys, commit/PR rules, releases.

## Project guidance

- [Current project context](docs/PROJECT_CONTEXT.md)
- [Learning and defense notes](docs/learning/README.md)
