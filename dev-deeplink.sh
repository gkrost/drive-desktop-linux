#!/usr/bin/env bash
# Launcher script for dev deeplink handling.
# Forwards internxt:// URLs to the running dev Electron instance
# via Electron's single-instance lock / 'second-instance' event.

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$PROJECT_DIR/deeplink-debug.log"
ELECTRON="$PROJECT_DIR/node_modules/electron/dist/electron"
MAIN_JS="$PROJECT_DIR/dist/main/main.js"

echo "$(date -Iseconds) dev-deeplink.sh invoked" >> "$LOG_FILE"
echo "  args: $*" >> "$LOG_FILE"

if [ ! -x "$ELECTRON" ]; then
  echo "  ERROR: electron binary not found at $ELECTRON" >> "$LOG_FILE"
  exit 1
fi

if [ ! -f "$MAIN_JS" ]; then
  echo "  ERROR: main.js not found at $MAIN_JS" >> "$LOG_FILE"
  exit 1
fi

echo "  Running: $ELECTRON $MAIN_JS $*" >> "$LOG_FILE"

# The running dev instance holds the single-instance lock.
# This second instance will trigger the 'second-instance' event
# on the running app (passing argv with the internxt:// URL),
# then exit immediately.
exec "$ELECTRON" "$MAIN_JS" "$@" 2>> "$LOG_FILE"
