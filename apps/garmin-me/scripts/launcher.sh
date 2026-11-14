#!/bin/bash
# Start or stop Garmin Me as a background service on this Mac.
#
#   scripts/launcher.sh start    build if the code changed, start, wait until ready
#   scripts/launcher.sh stop     stop the server this script started
#   scripts/launcher.sh status   say whether it is running
#
# Used by the "Garmin Me" Dock app (see install-launcher.sh), and fine to run
# by hand. It runs the optimised production build from .next-app, separate
# from the .next folder that `npm run dev` uses.
set -u
cd "$(dirname "$0")/.."

PORT=3015
URL="http://127.0.0.1:$PORT"
STATE="$HOME/Library/Application Support/garmin-me"
PIDFILE="$STATE/server.pid"
LOG="$HOME/Library/Logs/garmin-me.log"
export GARMIN_ME_DIST=.next-app
export NODE_OPTIONS=--no-experimental-webstorage
# Apps started from the Dock don't get your terminal's PATH.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

mkdir -p "$STATE" "$(dirname "$LOG")"

listening() { /usr/sbin/lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; }
our_pid() { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null && cat "$PIDFILE"; }

needs_build() {
  [ -f "$GARMIN_ME_DIST/BUILD_ID" ] || return 0
  # Rebuild if any source or config file is newer than the last build.
  [ -n "$(find src package.json next.config.ts -newer "$GARMIN_ME_DIST/BUILD_ID" -type f -print -quit 2>/dev/null)" ]
}

case "${1:-}" in
  start)
    if listening; then
      echo "already running at $URL"
      exit 0
    fi
    command -v node >/dev/null || { echo "Node.js was not found. Install it, or run: npm run app:install" >&2; exit 1; }
    [ -d node_modules ] || { echo "Dependencies are missing. Run: npm --prefix apps/garmin-me install" >&2; exit 1; }
    {
      echo "=== $(date '+%Y-%m-%d %H:%M:%S') start"
      if needs_build; then
        echo "building…"
        npx next build || { echo "BUILD FAILED"; exit 2; }
      fi
    } >>"$LOG" 2>&1 || { echo "The app failed to build. See $LOG" >&2; exit 2; }

    nohup npx next start --hostname 127.0.0.1 --port $PORT >>"$LOG" 2>&1 &
    echo $! >"$PIDFILE"
    for _ in $(seq 1 60); do
      listening && { echo "started at $URL"; exit 0; }
      kill -0 "$(cat "$PIDFILE")" 2>/dev/null || break
      sleep 0.5
    done
    echo "The server did not start. See $LOG" >&2
    exit 3
    ;;
  stop)
    pid=$(our_pid) || { echo "not started by the launcher (nothing to stop)"; rm -f "$PIDFILE"; exit 0; }
    # Stop the server and anything it spawned.
    pkill -TERM -P "$pid" 2>/dev/null
    kill -TERM "$pid" 2>/dev/null
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.25; done
    kill -KILL "$pid" 2>/dev/null
    rm -f "$PIDFILE"
    echo "stopped"
    ;;
  status)
    if listening; then
      if our_pid >/dev/null; then echo "running at $URL (started by the launcher)"; else echo "running at $URL (started some other way, e.g. npm run dev)"; fi
    else
      echo "not running"
    fi
    ;;
  *)
    echo "usage: $0 start|stop|status" >&2
    exit 64
    ;;
esac
