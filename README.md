# omts-mobile

Mobile app for **OMTS — Oyster Management and Traceability System** for Trung Nam Aquaculture Cooperative (SEP490_G83):
field workflows for Staff and Zone Managers within their permitted farming-zone scope (cultivation, environment readings, harvest, and attendance).
Sibling repos: [omts-backend](https://github.com/thaideptrai218/omts-backend) · [omts-web](https://github.com/thaideptrai218/omts-web)

## Stack

Expo · React Native · Expo Router · TypeScript

## Getting started

Prerequisites: Node.js (version in `.nvmrc`), npm, the **Expo Go** app on your phone.

```bash
npm ci
cp .env.example .env.local   # set EXPO_PUBLIC_API_BASE_URL to your machine's LAN IP
npx expo start               # scan the QR code with Expo Go
```

`EXPO_PUBLIC_API_BASE_URL` must be an absolute `http` or `https` URL without
credentials, query parameters, or fragments. When testing on a physical phone,
use an API address the phone can reach; `localhost` points to the phone itself.
Values with the `EXPO_PUBLIC_` prefix are bundled into the app, so never put
tokens, passwords, private keys, or other secrets in them.

Add dependencies with `npx expo install <package>` (picks SDK-compatible versions).

| Script | Purpose |
|---|---|
| `npm run lint` | `expo lint` |
| `npm test` | Jest component/unit tests, run serially |
| `npm run typecheck` | `tsc --noEmit` |
| `npx expo-doctor` | Expo SDK and dependency compatibility checks |
| `npx expo export --platform web` | Metro/static-export smoke test |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — branches, Jira keys, commit/PR rules, releases.

## Project guidance

- [Current project context](docs/PROJECT_CONTEXT.md)
