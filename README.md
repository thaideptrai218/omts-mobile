# omts-mobile

Mobile app for **OMTS — Oyster Management and Traceability System** for Trung Nam Aquaculture Cooperative (SEP490_G83):
field records for Managers and workers (cultivation, environment readings, harvest, attendance).
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

Add dependencies with `npx expo install <package>` (picks SDK-compatible versions).

| Script | Purpose |
|---|---|
| `npm run lint` | `expo lint` |
| `npm run typecheck` | `tsc --noEmit` |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — branches, Jira keys, commit/PR rules, releases.
