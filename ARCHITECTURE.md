# Architecture Documentation - Internxt Drive Desktop Linux

## Overview

Internxt Drive Desktop Linux is an Electron-based desktop application providing encrypted cloud storage with virtual drive (FUSE), file synchronization, backups, and system cleanup. It follows a layered architecture with Domain-Driven Design (DDD), Clean Architecture, and Dependency Injection via `diod`.

## Core Architecture

### Multi-Process Model

```
Main Process (Node.js 20.18 via Electron 33)
  - Auth, config, tray, windows, sync engine, backups, database
  - Entry: src/apps/main/main.ts
  - Dev: webpack-compiled to dist/main/main.js, then launched by Electron

Renderer Process (React 18 + Chromium)
  - UI: Widget, Login, Settings, Onboarding, Issues
  - Entry: src/apps/renderer/index.tsx -> App.tsx (routes)

Virtual Drive Process
  - FUSE filesystem callbacks via @gcas/fuse
  - Entry: src/apps/drive/
```

### Layered Architecture

```
Presentation   src/apps/renderer/         React UI
Application    src/apps/main/             Electron services
               src/backend/features/      Backend features (backup, cleaner, payments, usage)
Domain         src/context/               DDD bounded contexts (storage, virtual-drive, local, desktop)
Infrastructure src/infra/                 SQLite, Drive API client, IPC, schemas.d.ts (228KB auto-gen)
Core           src/core/                  Electron paths, isDev utilities
```

### Dependency Injection

- Framework: `diod` (^2.0.0)
- Containers: `mainProcessSharedInfraContainer.ts`, `backgroundProcessSharedInfraBuilder.ts`, `baseInfra.ts`
- Providers: `DependencyInjectionMnemonicProvider`, `DependencyInjectionUserProvider`

### IPC Communication

Main-renderer communication via Electron IPC with `contextIsolation: true` and
`nodeIntegration: false`. Key channel groups:
- Sync: file/folder operations, progress, errors
- Backup: configuration, lifecycle, progress, fatal errors
- Cleaner: report generation, cleanup progress, disk space
- Auth: login, logout, token refresh
- Config: settings read/write
- Windows: show/hide widget, settings, onboarding

### Database

- ORM: TypeORM (^0.3.28) with experimental decorators
- Engine: better-sqlite3 (^11.10.0) - native module requiring rebuild per Electron version
- Entities: `DriveFile`, `DriveFolder`
- Location: `~/.config/Internxt/` (Electron app data)

### Event System

- Custom `EventBus` in `src/apps/main/event-bus.ts`
- Key events: `APP_IS_READY`, `USER_LOGGED_IN`, `USER_LOGGED_OUT`
- Socket.io client for real-time server notifications (`src/apps/main/realtime.ts`)

### Environment Variable Injection

All `process.env.*` references are replaced at **webpack compile time** by
`dotenv-webpack`. Values from `.env` become string literals in the bundle.
There are no SDK default URLs; if a variable is missing, axios receives an
empty string as `baseURL` and requests fail. See
[README.developer.md](README.developer.md) for full details on this mechanism.

### Tray (KDE/GNOME)

The tray implementation (`src/apps/main/tray/tray.ts`) uses Electron's native
`Tray` with platform-aware behavior:
- **Linux (KDE/SNI):** Context menu is permanently attached via `setContextMenu()`
  as required by the StatusNotifierItem protocol. Refreshed on every click.
- **Linux (GNOME/X11):** Same persistent menu approach works via AppIndicator.
- **macOS/Windows:** Right-click pops up menu via `popUpContextMenu()`, left-click
  clears it.

---

## Codebase Statistics

| Metric | Value |
|--------|-------|
| Total tests | 561 (510 main + 51 renderer) |
| Localization languages | 3 (en, es, fr) |
| ESLint warnings allowed | 235 |
