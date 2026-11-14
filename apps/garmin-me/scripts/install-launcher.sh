#!/bin/bash
# Create (or update) the "Garmin Me" app in ~/Applications.
#
#   npm run app:install
#
# Opening the app starts the local server and opens the dashboard in your
# browser. Clicking its Dock icon again reopens the dashboard. Quitting the
# app stops the server. Nothing runs when the app is closed.
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
TARGET="$HOME/Applications/Garmin Me.app"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

command -v node >/dev/null || { echo "Node.js is not installed." >&2; exit 1; }
[ -d node_modules ] || npm install --no-audit --no-fund

cat >"$WORK/app.applescript" <<SCRIPT
property launcher : "$APP_DIR/scripts/launcher.sh"
property dashboard : "http://localhost:3015"

on startServer()
	try
		do shell script "/bin/bash " & quoted form of launcher & " start"
		return true
	on error msg
		display dialog "Garmin Me couldn't start." & return & return & msg buttons {"OK"} default button 1 with icon caution
		return false
	end try
end startServer

on run
	display notification "Starting the dashboard…" with title "Garmin Me"
	if startServer() then
		open location dashboard
	else
		quit
	end if
end run

-- Clicking the Dock icon while it is already running.
on reopen
	if startServer() then open location dashboard
end reopen

on idle
	return 3600
end idle

on quit
	try
		do shell script "/bin/bash " & quoted form of launcher & " stop"
	end try
	continue quit
end quit
SCRIPT

mkdir -p "$HOME/Applications"
rm -rf "$TARGET"
/usr/bin/osacompile -s -o "$TARGET" "$WORK/app.applescript"

# Icon: build an .icns from the committed PNG (drawn by launcher-assets/make-icon.py).
SRC_ICON="scripts/launcher-assets/icon.png"
if [ -f "$SRC_ICON" ]; then
  ICONSET="$WORK/GarminMe.iconset"
  mkdir "$ICONSET"
  for s in 16 32 128 256 512; do
    /usr/bin/sips -z $s $s "$SRC_ICON" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    d=$((s * 2))
    /usr/bin/sips -z $d $d "$SRC_ICON" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  /usr/bin/iconutil -c icns "$ICONSET" -o "$TARGET/Contents/Resources/applet.icns"
  # Recent macOS applets take their icon from Assets.car; remove it so ours is used.
  rm -f "$TARGET/Contents/Resources/Assets.car"
  /usr/libexec/PlistBuddy -c "Delete :CFBundleIconName" "$TARGET/Contents/Info.plist" 2>/dev/null || true
fi

/usr/libexec/PlistBuddy -c "Set :CFBundleName 'Garmin Me'" "$TARGET/Contents/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string uk.co.tomwm.garmin-me" "$TARGET/Contents/Info.plist" 2>/dev/null || true
# The applet is edited after signing, so re-sign it locally.
/usr/bin/codesign --force --deep --sign - "$TARGET" >/dev/null 2>&1 || true
touch "$TARGET"

echo "Installed: $TARGET"
echo "Open it from Spotlight or Launchpad, then right-click its Dock icon → Options → Keep in Dock."
