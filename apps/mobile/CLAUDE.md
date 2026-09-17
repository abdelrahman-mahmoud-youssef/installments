# Mobile app (Expo + React Native + TypeScript)

iOS-first companion app for the installment SaaS. Shared codebase for iOS and Android via Expo SDK 57 + Expo Router.

## Run

- `pnpm dev:mobile` from the repo root (backend must be running on port 3001); root `pnpm dev` intentionally does not start the mobile app
- The API URL is auto-derived from the Expo dev server host (phone on the same LAN hits `http://<dev-machine>:3001`). Override with `EXPO_PUBLIC_API_URL`.
- Auth is a JWT from `POST /auth/login`, stored in `expo-secure-store` and sent as a Bearer header (no cookies — the web proxy is not used).

## Building for iOS (EAS)

- No Mac/Xcode needed — `eas build --profile preview --platform ios` (internal test install) or `--profile production` (App Store) build in the cloud, per `eas.json`.
- Both non-dev profiles set `EXPO_PUBLIC_API_URL` to a real deployed backend — update the placeholder in `eas.json` once the backend is live (the mobile app hits it directly, so it must be **publicly** reachable, unlike the web frontend's Railway-private backend URL).
- `app.json`'s `icon`/`adaptiveIcon`/splash assets live in `assets/`, generated from the same master logo (`apps/frontend/public/qistak.png`) used for the web app's PWA icons — regenerate from that file if the brand mark changes, don't hand-edit the PNGs.
- `eas submit --platform ios` uploads to App Store Connect once Apple Developer credentials are set up via `eas credentials`.

## Architecture (do not silently change)

- **Routes** live in `app/` (Expo Router file-based). Five tabs — Dashboard `(home)`, Contracts, Customers, Wallets (payment methods), More — rendered by `NativeTabs` (`expo-router/unstable-native-tabs`, SF Symbols on iOS, Ionicons on Android). Each tab is a folder with a `_layout.tsx` re-exporting `TabStack` (`src/navigation/tab-stack.tsx`) and an `index.tsx`, so every tab root gets a native large-title header; the tab screen sets its title via `<Stack.Screen options>` (Customers also puts its search in `headerSearchBarOptions`). Detail screens (`contract/[id]`, `customer/[id]`, `staff`, `activity`, `settings`) stay in the root stack. All header options come from `useStackScreenOptions()` — never set `headerStyle`/`headerBlurEffect` per screen.
- **Navigation chrome is native and system-styled** (Liquid Glass on iOS 26, material on older iOS, Material on Android): headers are transparent on iOS and every root `ScrollView`/`FlatList` must pass `contentInsetAdjustmentBehavior="automatic"` so content scrolls beneath the header and tab bar.
- **Theme**: all colors/spacing/radius/font sizes come from `src/theme/tokens.ts` via `useTheme()`. Never hardcode a color in a screen. Light/dark/system mode and the font-size setting live in `theme-context.tsx`; every text size flows through `fontSize(token)` so the font-size setting scales the whole app.
- **i18n**: every string goes through `useI18n().t('section.key')` with dictionaries in `src/i18n/translations.ts` (en + ar, structurally identical — `ar` is typed as `typeof en`). Arabic switches the app to RTL via `I18nManager.forceRTL` + reload; layouts must use logical properties (`start`/`end`, `flexDirection: 'row'`) so they flip automatically.
- **API layer**: all HTTP through `src/api/*` (thin typed wrappers over `src/api/client.ts`). Never `fetch` in a component. Money stays in minor units end-to-end; formatting only via `formatMoney`/`MoneyText`.
- **Server state**: TanStack Query hooks in `src/hooks/queries.ts` (infinite queries for paginated lists, mutations invalidate related keys). UI state is local React state.
- **UI primitives** in `src/components/ui/` (AppText, Card, Button, Badge, TextField, BottomSheet, ConfirmSheet, Skeleton, EmptyState, ErrorState, toast…). Feature components in `src/components/<feature>/`. Reuse these; never re-implement a card/sheet/badge inline.
- **Glass is for the floating layer only.** `GlassSurface` (`expo-glass-effect`, solid `surface` fallback where Liquid Glass is unavailable) backs `BottomSheet`, the toast, and `Button variant="glass"` (floating primary actions such as "Record payment"). Content — `Card`, list rows, stat tiles — stays opaque; never put glass on scrolling content.
- **OVERDUE is derived** on the client the same way as the backend: `dueDate < today AND status IN (PENDING, PARTIALLY_PAID)` (`src/lib/statuses.ts`).
- Destructive actions (remove wallet, deactivate, sign out) always go through `ConfirmSheet`.
