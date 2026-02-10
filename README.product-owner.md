# Product Owner Guide - Internxt Drive Desktop Linux

**Current Version:** 2.5.667

## Product Overview

Internxt Drive Desktop Linux is a secure, privacy-focused cloud storage client providing virtual drive integration (FUSE), file synchronization, backups, and system cleanup for Linux users. Built on Electron 33 with React 18 UI.

## Current Feature Set

### Core Drive Features
- **Virtual Drive** - FUSE-mounted cloud filesystem (files appear local, fetched on demand)
- **File Synchronization** - Real-time bidirectional sync via RemoteSyncManager
- **End-to-End Encryption** - Client-side encryption before upload
- **Authentication** - Email/password + SSO via `internxt://` deeplinks
- **Nautilus Integration** - GNOME file manager context menus (sync status, offline/online toggle)
- **Auto-launch** - Start on system boot
- **Auto-update** - electron-updater for seamless updates

### Non-Drive Features (subscription-gated)
- **Backups** - Scheduled folder backups with progress tracking
- **Cleaner** - System cleanup (cache, logs, trash, web storage)

### Platform Support
- **Build targets:** AppImage (universal), .deb (Debian/Ubuntu)
- **Desktop environments:** GNOME (primary, with Nautilus extension), KDE Plasma (tray with SNI context menu support)
- **Dependencies:** libfuse2, python3-nautilus

## Current Codebase Metrics

| Metric | Value |
|--------|-------|
| Total tests | 561 (510 main + 51 renderer) |
| Localization | 3 languages (en, es, fr) |
| ESLint warnings | 235 allowed |
