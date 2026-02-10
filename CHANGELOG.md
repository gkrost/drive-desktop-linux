# Changelog

## 2.5.667 (Current)

### Features

- Enhanced GTK and Nautilus integration with version requirements
- Improved device identifier handling and error management
- Enhanced file sync with robust retry mechanisms
- Optimized OpenCallback with TemporalFile for temporary path checks
- Improved backup process management and error tracking
- KDE Plasma tray support via StatusNotifierItem protocol
- Startup configuration logging to `~/.config/internxt-drive/logs/startup-config.log`

### Fixes

- Fixed environment variable loading for payments service
- Resolved debug logging issues in processDeeplink function
- Enhanced retry sync button functionality
- Fixed device name decryption removal
- Fixed Electron 33 dev build (webpack-compiled main process)
- Fixed react-refresh compatibility with React 18

### Technical Improvements

- Upgraded Electron 19 to 33 with security hardening (contextIsolation, sandbox)
- Upgraded React 17 to React 18
- Upgraded TypeScript to 5.9, Vitest to 3.2, webpack to 5.105
- Removed antivirus/ClamAV feature (~92 files, ~7,900 lines)
- Refactored stop controller to use AbortSignal class
- Enhanced error handling across multiple modules
- Improved test coverage and stability
