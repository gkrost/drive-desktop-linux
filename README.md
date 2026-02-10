# Internxt Drive Desktop for Linux

[![DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/internxt/drive-desktop-linux)

**Current Version:** 2.5.667

A secure, privacy-focused cloud storage client for Linux with end-to-end encryption, virtual drive integration (FUSE), and real-time file synchronization.

## Architecture

- **Electron 33** multi-process app (main + renderer + virtual drive)
- **React 18** UI with TailwindCSS
- **TypeORM + SQLite** for local persistence
- **FUSE** virtual filesystem via `@gcas/fuse`
- **DDD + Clean Architecture** with `diod` dependency injection

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.
See [README.developer.md](README.developer.md) for developer setup and configuration reference.
See [README.product-owner.md](README.product-owner.md) for product overview.

## Installation

### .deb Package (Recommended)

```bash
sudo dpkg -i internxt_2.5.667_amd64.deb
```

### AppImage

```bash
chmod +x Internxt-2.5.667.AppImage
./Internxt-2.5.667.AppImage
```

**Note:** AppImage SSO login only works with Chrome. The .deb version works with all browsers.

## Development

### Prerequisites

- Node.js 18+ (v22.21.1 works)
- npm 7+
- System deps: `libfuse2`, `libgtk-3-0`, `python3-nautilus`, `libnss3`, `libxss1`, `libxtst6`, `xdg-utils`

### Setup

```bash
git clone https://github.com/internxt/drive-desktop-linux.git
cd drive-desktop-linux
cp .env.example .env   # Fill in required values (see .env.example for docs)
npm install
npm start              # Start dev server
```

> **Important:** Environment variables are injected at **webpack compile time**, not
> at runtime. After changing `.env` you must restart `npm start` (which recompiles).
> Shell `export` variables have no effect on the running app.
> See [`.env.example`](.env.example) for full documentation of all 16 variables.

### Commands

```bash
npm start              # Dev server (main + renderer)
npm test               # All tests (Vitest)
npm run build          # Production build
npm run package        # Build + electron-builder
npm run lint           # ESLint check
npm run type-check     # TypeScript check
```

## Packaging for Production

```bash
npm run package
```

Targets: AppImage and .deb (Debian/Ubuntu). Configured in `package.json` build section.

## Login Configuration Using Deeplink

To log in via deeplink in development mode, special configuration is required.

### Create Entry-Point Script

Create a script in the root of the project named `enable-sso.sh` and add the following content:

```
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
# Load nvm manually
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd "/your-project-path/drive-desktop-linux"
nvm use 18
npm run start:main "$@"
```

Use the following command to give the script execution permissions:

`chmod +x /your-project-location/drive-desktop-linux/enable-sso.sh`

### Create Linux Handler Protocol File

Use the following command to create the file and add the following content:

` vim ~/.local/share/applications/internxt-protocol.desktop`

```
[Desktop Entry]
Type=Application
Name=Internxt Desktop (Dev)
Exec=/your-project-location/drive-desktop-linux/enable-sso.sh %u
Icon=internxt
Terminal=false
MimeType=x-scheme-handler/internxt;
```

Change the permissions of the newly created file:

`chmod 644 ~/.local/share/applications/internxt-protocol.desktop`

Register the internxt protocol handler:

`xdg-mime default internxt-protocol.desktop x-scheme-handler/internxt`

Update the application database:

`update-desktop-database ~/.local/share/applications`

Check that the internxt protocol is correctly registered:

`gio mime x-scheme-handler/internxt`

Verify by logging into the application.
