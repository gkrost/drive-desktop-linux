# Developer Guide - Internxt Drive Desktop Linux

**Current Development Version:** 2.5.667

## Quick Start

### Prerequisites

- Node.js 18+ (current system: v22.21.1)
- npm 7+
- Git
- System libraries: `libfuse2`, `libgtk-3-0`, `libnotify4`, `libnss3`, `libxss1`, `libxtst6`, `xdg-utils`, `libatspi2.0-0`, `libdrm2`, `libgbm1`, `libasound2t64`, `python3-nautilus`

### Setup

```bash
git clone https://github.com/internxt/drive-desktop-linux.git
cd drive-desktop-linux
cp .env.example .env   # Fill in required values (see .env.example for docs)
npm install
```

### Development Workflow

```bash
npm start              # Start dev server (main + renderer concurrent)
npm run start:renderer # Renderer dev server only
npm run start:main     # Webpack-compile main, then launch Electron
npm run build          # Production build (main + renderer)
npm run package        # Build + electron-builder (no publish)
```

### Testing

```bash
npm test                     # All tests (main + renderer concurrent)
npm run test:main            # Main process only (Vitest)
npm run test:renderer        # Renderer only (Vitest + jsdom)
npm run test:main:watch      # Watch mode
npm run test:coverage        # Coverage report (both)
npm run coverage:merge       # Merge lcov reports
```

### Code Quality

```bash
npm run lint                 # ESLint (max-warnings: 235)
npm run lint:fix             # Auto-fix
npm run format               # Prettier check
npm run format:fix           # Auto-format
npm run type-check           # TypeScript type checking
npm run find-deadcode        # Knip dead code analysis (206 issues max)
```

---

## Environment Variables (.env) — How They Work

This is the most common source of confusion. **Read this before debugging.**

### Compile-time injection, not runtime

All `process.env.*` references are replaced by `dotenv-webpack` at **webpack compile
time**. The `.env` file is read once during the build, and values are baked into
the JS bundle as string literals. The `.env` file itself is NOT shipped in the
packaged app and is NOT read at runtime.

This means:

1. **Shell env vars have no effect.** Running `PAYMENTS_URL=https://... npm start`
   does nothing. The value must be in `.env` and the app must be recompiled.
2. **After changing `.env`, restart `npm start`** (or re-run `npm run build`).
   The old values are cached in the webpack output until recompilation.
3. **In production (packaged) builds**, the values were frozen at build time.
   There is no way to override them at launch.
4. **`import 'dotenv/config'`** exists at the top of `main.ts` as a safety net
   for edge cases, but `dotenv-webpack` is the primary injection mechanism.

### Which variables are required?

At minimum, to get past startup without a crash:

| Variable | Why |
|----------|-----|
| `NEW_CRYPTO_KEY` | `crypt.ts` throws `"No encryption key provided"` if empty |
| `INTERNXT_DESKTOP_HEADER_KEY` | Used in every API request header (`x-internxt-desktop-header`) |
| `PAYMENTS_URL` | Payments service crashes with `undefined` base URL if missing |
| `NEW_DRIVE_URL` | Drive API calls fail silently (empty string fallback) |
| `BRIDGE_URL` | Network/download operations fail |

All 16 variables are documented with comments in [`.env.example`](.env.example).

### Where the URLs end up

There are **no default/fallback URLs in the SDK**. `@internxt/sdk`'s `HttpClient`
takes `baseURL` as a required constructor argument with no fallback. If an env var
is empty, axios sends requests to a relative path on `localhost`, which fails.

```
.env file
  -> dotenv-webpack (compile time)
    -> process.env.NEW_DRIVE_URL becomes "https://gateway.internxt.com/drive"
      -> drive-server.client.instance.ts: axios.create({ baseURL: "https://..." })
```

### Startup diagnostics

All env vars are logged at startup by `src/apps/main/startup-logger.ts`:
- Server URLs are logged in full
- Secrets are masked (first 4 chars + `***`)
- Check `~/.config/internxt-drive/logs/startup-config.log` for the output

---

## Project Architecture

### Directory Layout

```
src/
 apps/
   main/                   # Electron main process
     auth/                 # Authentication, token refresh, deeplinks
     auto-launch/          # System startup registration
     background-processes/ # Background process management
     backups/              # Backup management
     config/               # electron-store configuration
     database/             # TypeORM + SQLite (DriveFile, DriveFolder)
     device/               # Device information
     issues/               # Virtual drive issue handling
     nautilus-extension/   # GNOME file manager integration (Python)
     network/              # Network status monitoring
     platform/             # Platform-specific utilities
     remote-sync/          # File synchronization engine
     thumbnails/           # Thumbnail generation and upload
     token-scheduler/      # JWT token refresh scheduling
     tray/                 # System tray icon and context menu (KDE/GNOME)
     virtual-root-folder/  # Virtual drive root folder
     windows/              # Electron window management
   renderer/              # React UI
     pages/               # Widget, Login, Settings, Onboarding, Issues
     hooks/               # Custom hooks (backups, devices, ...)
     components/          # Shared React components
     context/             # React Context (Backup, Cleaner)
     localize/            # i18n (en, es, fr)
   drive/                 # Virtual drive FUSE integration
   backups/               # Backup service + DI + diff/batch logic
   shared/                # Shared DI containers
 backend/features/
   backup/                # Backup manager, progress, IPC handlers
   cleaner/               # Disk cleanup utility
   device/                # Device management
   payments/              # Payment integration
   usage/                 # Usage tracking
 context/                 # DDD bounded contexts (storage, virtual-drive, local, desktop)
 infra/                   # Infrastructure (SQLite, Drive API client, IPC, schemas.d.ts)
 core/                    # Core utilities (electron paths, isDev)
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Desktop Framework | Electron | ^33.3.1 |
| UI Library | React | ^18.3.1 |
| Language | TypeScript | ^5.9.0 |
| Bundler | Webpack | ^5.105.0 |
| Test Framework | Vitest | ^3.2.4 |
| Database | TypeORM + better-sqlite3 | ^0.3.28 / ^11.10.0 |
| CSS | TailwindCSS | ^3.3.3 |
| DI Container | diod | ^2.0.0 |
| Virtual Drive | @gcas/fuse | ^2.4.2 |
| Realtime | socket.io-client | ^4.8.1 |
| HTTP | axios | ^1.13.5 |

### Key Internxt Packages

| Package | Version | Purpose |
|---------|---------|---------|
| @internxt/sdk | 1.11.17 | Internxt API SDK |
| @internxt/drive-desktop-core | 0.1.7 | Core drive functionality |
| @internxt/inxt-js | ^2.2.3 | Internxt JS utilities |
| @internxt/lib | ^1.1.6 | Shared library |

---

## Configuration Sources

### Environment Variables (.env)

| Variable | Purpose | Production Value |
|----------|---------|-----------------|
| `CRYPTO_KEY` | Legacy encryption key | Secret |
| `MAGIC_IV` | Legacy IV for encryption | Secret |
| `MAGIC_SALT` | Legacy salt for encryption | Secret |
| `NEW_CRYPTO_KEY` | Current encryption key (**required**) | Secret |
| `NEW_DRIVE_URL` | Drive API base URL | `https://gateway.internxt.com/drive` |
| `DRIVE_API_URL` | Drive API endpoint | `https://gateway.internxt.com/api` |
| `PAYMENTS_URL` | Payments service URL | `https://gateway.internxt.com/payments` |
| `BRIDGE_URL` | Network bridge URL | `https://gateway.internxt.com/network` |
| `INTERNXT_DESKTOP_HEADER_KEY` | Desktop client auth header | Secret |
| `APP_SEGMENT_KEY` | Segment analytics key | Secret |
| `APP_SEGMENT_KEY_TEST` | Test analytics key | Secret |
| `BUG_REPORTING_URL` | Bug reporting endpoint | URL |
| `NOTIFICATIONS_URL` | WebSocket notifications | `https://notifications.internxt.com` |
| `LOCK_REFRESH_INTERVAL` | Lock refresh interval (ms) | `20000` |
| `RUDDERSTACK_KEY` | RudderStack analytics key | Secret |
| `RUDDERSTACK_DATA_PLANE_URL` | RudderStack data plane | URL |

### Hardcoded URLs in Renderer

| URL | File | Purpose |
|-----|------|---------|
| `https://drive.internxt.com` | `Widget/Header.tsx` | Web app link |
| `https://drive.internxt.com/login?universalLink=true` | `Login/index.tsx` | Login deeplink |
| `https://drive.internxt.com/new` | `Login/index.tsx` | Signup link |
| `https://drive.internxt.com/preferences?tab=plans` | `SyncAction.tsx`, `Usage.tsx` | Plans page |
| `https://drive.internxt.com/app/backups` | `ViewBackups.tsx` | Backup settings |
| `https://help.internxt.com` | Various | Help center |

### electron-store Configuration

Authentication: `bearerToken`, `newToken`, `mnemonic`, `userData`
Backup: `backupsEnabled`, `backupInterval`, `lastBackup`, `backupList`
Sync: `syncRoot`, `lastSync`, `logEnginePath`, `lastSavedListing`
Device: `deviceId` (deprecated), `deviceUUID`, `clientId`
UI: `preferedLanguage`, `preferedTheme`, `lastOnboardingShown`
Features: `nautilusExtensionVersion`, `shouldFixDanglingFiles`, `availableUserProducts`

### HTTP Request Headers

```
Authorization: Bearer ${token}
content-type: application/json; charset=utf-8
internxt-client: drive-desktop-linux
internxt-version: ${packageConfig.version}
x-internxt-desktop-header: ${process.env.INTERNXT_DESKTOP_HEADER_KEY}
```

---

## Build & CI/CD

### Dev Build Flow

The development build uses two concurrent webpack processes:

1. **Renderer**: `webpack serve` with HMR via `webpack.config.renderer.dev.ts`
2. **Main**: `webpack --config webpack.config.main.dev.ts` compiles the main
   process to `dist/main/main.js`, then `electron ./dist/main/main.js` launches it

The main process is webpack-compiled in dev (not run via ts-node) because
Electron 33 (Node 20.18) rejects `.ts` files in its ESM module format checker
before ts-node's CJS hooks can intercept them.

### Build Targets (Linux)

- **AppImage** - Universal Linux package
- **deb** - Debian/Ubuntu package (depends: `libfuse2`, `python3-nautilus`)

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | PR open/sync/reopen | Run main + renderer tests |
| `lint.yml` | PR open/sync/reopen | ESLint, Prettier, type-check |
| `publish.yml` | Release published / manual | Build + publish to GitHub |
| `sonar-analysis.yml` | - | SonarQube code quality |
| `find-dead-code.yml` | - | Knip dead code detection |
| `stale-prs.yml` | - | Auto-close stale PRs |

### Native Module Handling

- `better-sqlite3` requires rebuild for target Electron/Node version
- `sharp` (referenced in asarUnpack) requires prebuilt binaries
- `npm run rebuild` uses `electron-rebuild` for native compilation
- Webpack externals: `@gcas/fuse`, `better-sqlite3`, `reflect-metadata`, `typeorm`

---

## Feature Inventory

### Core Drive Features
- Virtual Drive (FUSE mount)
- File Synchronization (RemoteSyncManager)
- Authentication (email/password + SSO deeplinks)
- Token management (auto-refresh)
- Thumbnails
- Nautilus extension (GNOME file manager integration)
- Auto-launch at startup
- Real-time updates (socket.io)
- Auto-update (electron-updater)

### Non-Drive Features
- **Backups** - Scheduled folder backups with progress tracking
- **Cleaner** - System cleanup utility (cache, logs, trash)

### Feature Gating
Non-drive features are gated by `UserAvailableProducts` subscription checks.
