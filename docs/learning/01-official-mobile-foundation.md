# Lesson 01 — Official OMTS Mobile foundation

## 1. React Native, Expo, and Expo Router

React Native supplies UI primitives such as `View`, `Text`, and `StyleSheet` that render to native platforms. Expo provides a managed toolchain and compatible native modules around React Native. Expo Router adds file-based navigation on top of React Navigation.

These names describe different layers rather than competing choices:

```text
OMTS screen code
  → Expo Router decides which screen/layout is active
  → React Native renders native UI primitives
  → Expo provides the SDK, tooling, configuration, and native-module integration
```

The installed major version matters because Expo aligns a specific React Native version and module set. Dependencies that touch native code should be installed with `npx expo install`, which chooses a version compatible with the current Expo SDK.

## 2. Current source structure

```text
src/app/
├─ _layout.tsx
└─ index.tsx
```

`_layout.tsx` currently returns `<Stack />`. It defines the navigator that can contain route screens. `index.tsx` is the root `/` screen and currently renders placeholder OMTS text.

This proves routing and rendering are scaffolded. It does not prove authentication, API access, permissions, or offline behavior.

The planned foundation will eventually separate `(auth)` and `(app)` route groups. Those names organize navigation; they do not automatically validate tokens or permissions.

## 3. Why non-route code stays outside `src/app`

Expo Router interprets files in `src/app` as navigation structure. Placing services, hooks, or utility modules there can accidentally make routing harder to understand or create unintended route behavior.

The intended separation is:

```text
src/app/          route files and layouts
src/components/   reusable native UI
src/services/     API-facing contracts and adapters
src/hooks/        reusable stateful behavior
src/domain/       domain types and pure rules
```

The exact directories should be introduced only when a real feature needs them; an empty architecture tree adds maintenance without behavior.

## 4. Public environment variables are not secrets

The API URL is configured through `EXPO_PUBLIC_API_BASE_URL`. Values with the `EXPO_PUBLIC_` prefix can be embedded into the client bundle. That is appropriate for a base URL, which the application must know, but never for passwords, private keys, OTP secrets, or bearer tokens.

Local `.env` variants are ignored while `.env.example` remains committed as documentation. A gitignore rule only prevents new untracked files from being added; it cannot remove a secret that has already entered Git history.

## 5. Runtime dependency versus development dependency

`eslint-config-expo` configures the lint tool and is needed while developing or in CI. It is not application functionality used by the installed Mobile app. Therefore it belongs in `devDependencies`, not in both `dependencies` and `devDependencies`.

Removing the duplicate runtime declaration does not remove lint support because the devDependency remains locked and installed by `npm ci` in development/CI.

## 6. Foundation behavior that is still missing

The following Jira requirements are not implemented yet:

- secure token storage with `expo-secure-store`;
- session bootstrap before showing protected navigation;
- access-token refresh and concurrency control;
- effective-permission navigation;
- approved message catalog and `MSG07` offline banner;
- running against the QA API in Expo Go.

These should be built as tested vertical slices. Adding folders or packages alone is not evidence that the behavior works.

### Diagnostic notes from the first clean install

`npm ci` completed and the manifest remained consistent with the lockfile. It warned that the installed ESLint release and a transitive UUID release are no longer supported upstream.

Both the full audit and `npm audit --omit=dev` reported 29 advisories in the Expo/Metro/config dependency tree. npm's forced suggestions would either downgrade Expo 57 to Expo 44 or move Expo Router to an incompatible major. `npm audit fix --force` was therefore not used; changing one native-toolchain package outside the Expo-compatible set can break installation or runtime behavior.

`npx expo-doctor` then ran 21 Expo-specific compatibility and configuration checks, and all 21 passed. The two results answer different questions:

- npm audit reports known advisories anywhere in the dependency graph;
- Expo Doctor checks whether the project's Expo packages and configuration form a supported compatible set.

The advisories remain technical debt and should be rechecked when Expo publishes a compatible upgrade. A green Expo Doctor does not erase security advisories, while an audit suggestion is not automatically a safe SDK migration plan.

## 7. Defense questions

### Is Expo a replacement for React Native?

No. Expo is a framework/toolchain built around React Native. OMTS still uses React Native components, while Expo supplies SDK modules, configuration, development tooling, and build services.

### Why must tokens use SecureStore instead of AsyncStorage?

AsyncStorage is general persisted key-value storage and is not designed as protected credential storage. SecureStore uses platform security facilities for sensitive values. Backend validation is still required even when local storage is secure.

### Does `(app)` automatically protect Mobile screens?

No. It organizes routes. Session bootstrap and permission logic must decide whether the user can enter, and the backend must authorize protected requests.

### Why can the API base URL be public but not a token?

The app must know where to send requests, so the base URL is not a credential. A token proves identity or authority and must not be compiled into or committed with the client.

## 8. Current evidence and limits

- The official repository and `develop` workflow are confirmed.
- Expo/Router/TypeScript scaffolding exists.
- The environment ignore rule now covers `.env` variants while preserving `.env.example`.
- The duplicate runtime lint dependency has been removed.
- Auth, API, permission, and offline behaviors remain unimplemented.
