#!/usr/bin/env bash
# Deploy TARA Cards to Vercel with the imported papers, behind the passcode.
#
#   apps/tara-cards/scripts/deploy.sh
#
# The question packs are gitignored (the repo is public and UAT-UK prohibits
# sharing test content), so a Git-triggered Vercel build would ship without
# them. This builds on this machine, where the packs exist, and uploads only
# the built output. It refuses to deploy without a passcode configured, and
# afterwards checks from outside that the live site demands one.
set -euo pipefail
cd "$(dirname "$0")/.."

fail() { echo "✗ $*" >&2; exit 1; }

for pack in tara-tsa tara-bmat tara-guide; do
  [ -f "content-packs/$pack.json" ] || fail "content-packs/$pack.json is missing — build it with scripts/import_paper.py / import_guide.py first."
done

[ -f .vercel/project.json ] || fail "Not linked to a Vercel project yet. Run: vercel link"

vercel env ls production 2>/dev/null | grep -q APP_PASSCODE \
  || fail "APP_PASSCODE is not set for production. Run: vercel env add APP_PASSCODE production"

echo "→ Pulling project settings…"
vercel pull --yes --environment=production >/dev/null

echo "→ Building locally (packs included)…"
vercel build --prod

ls .vercel/output/static/tara-cards/assets/tara-tsa-*.json >/dev/null 2>&1 || fail "Build output has no question packs."
grep -rqs '"middleware"\|_middleware' .vercel/output/config.json || fail "Build output has no middleware — the site would be unprotected."
PACK=$(basename "$(ls .vercel/output/static/tara-cards/assets/tara-tsa-*.json)")

echo "→ Uploading the prebuilt output…"
URL=$(vercel deploy --prebuilt --prod)
echo "  deployed: $URL"

echo "→ Checking the passcode gate from outside…"
# The public production alias must show the passcode page (401) for both the
# app and a question file. The per-deployment URL sits behind Vercel's own
# login wall (a 302 to vercel.com/sso), which is also acceptable.
PUBLIC="${PUBLIC_URL:-https://tara-cards.vercel.app}"
page=$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC/tara-cards/")
pack=$(curl -s -o /dev/null -w '%{http_code}' "$PUBLIC/tara-cards/assets/$PACK")
direct=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$URL/tara-cards/assets/$PACK")
echo "  $PUBLIC app without passcode:           $page"
echo "  $PUBLIC question pack without passcode: $pack"
echo "  deployment URL question pack:           $direct"
if [ "$page" != 401 ] || [ "$pack" != 401 ]; then
  fail "The public site is NOT protected. Remove the deployment in the Vercel dashboard now."
fi
case "$direct" in
  401*|"302 https://vercel.com/sso"*) ;;
  *) fail "The deployment URL serves the questions without a passcode. Remove the deployment now." ;;
esac
echo "✓ Deployed and protected: $PUBLIC/tara-cards/"
