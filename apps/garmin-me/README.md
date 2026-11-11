# Garmin Me

A personal, local-only dashboard for your own Garmin Connect data: training,
recovery, strength and daily health. It reads from Garmin's official
**Personal API** (read-only) and keeps everything on this Mac.

## Run it

From the repo root:

```bash
npm install
npm -w apps/garmin-me run garmin:key   # once: paste your key (input is hidden)
npm run dev:garmin-me                  # then open http://localhost:3015
```

The first page load starts a sync. Recent data appears within a minute.
Choosing a longer range loads older history in the background (see *Rate
limits*).

## Your key and your data

| What | Where | Notes |
|---|---|---|
| API key | `~/.config/garmin-me/api-key` | `chmod 600`, outside the repo. `GARMIN_PERSONAL_API_KEY` overrides it. |
| Access token | server memory only | 24 h lifetime, renewed automatically and after a 401. |
| Cached data | `~/Library/Application Support/garmin-me/garmin.db` | SQLite. Delete the file to start again. |

- Create or revoke a key at <https://connect.garmin.com/app/settings/personalApiToken>.
  Keys expire (1 year at most); when yours does, the app says so and you run
  `garmin:key` again.
- The key and token are only used by server code. Nothing in `src/components`
  or the browser ever sees them.
- This repository is public, so no key or fitness data is stored inside it,
  and the app is not part of the Vercel build (`build.js`).
- The dev server binds to `127.0.0.1`, so other devices on your network
  can't reach it.

## What it shows

| Section | Contents |
|---|---|
| Overview | Last night's sleep, HRV, resting HR and Body Battery next to the period's training time, sessions, run distance and load; training-by-sport, HRV, sleep and resting-HR charts; recent activities |
| Running | Distance, runs, pace, heart rate, distance per period, time in HR zones, pace and HR per run |
| Recovery | HRV (with Garmin's baseline range), resting HR, sleep stages and score, Body Battery, stress |
| Strength | Sessions, time, session length and heart rate. Garmin has no sets/reps/weights for these sessions |
| Health | Steps, intensity minutes, stress, active calories, SpO2, weight and body composition, and all other sports |

Ranges: 7 days, 30 days, 12 weeks (weekly buckets), 12 months (monthly buckets,
weekly averages for daily metrics). Every card carries a small dot: grey for Garmin's own data (including simple
totals and averages of it), amber for a figure this app estimates that Garmin
doesn't report, such as average pace across runs or a projected finish date.
Days with no recording are shown as gaps, never as zero. None of this is
medical advice.

## How it fits together

```
Garmin Personal API
   │  src/lib/garmin/client.ts     key → token, GET only, pacing, 429/401 handling
   ▼
src/lib/garmin/sync.ts             background sync job, progress, errors
   ▼
src/lib/garmin/db.ts               SQLite cache of Garmin's raw JSON, untouched
   ▼
src/lib/garmin/normalize.ts        raw JSON → Activity / Day (the only file that knows Garmin's field names)
   ▼
src/lib/metrics.ts                 periods, buckets, means, sums, comparisons
   ▼
src/app/*/page.tsx                 one page per section, built from
src/components/                    Kpi, ChartCard, ActivityTable, ZoneBar, Shell
```

**Adding a metric:** add a field to `Day` or `Activity` in `normalize.ts` and
one line in its mapper, then use it in a page with `<Kpi>` or `<ChartCard>`.
Because the cache keeps the raw responses, no re-download or migration is
needed. Run `npm run garmin:probe` to see every field Garmin returns.

### Endpoints used

| Data | Endpoint |
|---|---|
| Activities | `/activitylist-service/activities/search/activities` |
| HRV | `/hrv-service/hrv/daily/{from}/{to}` (28-day chunks) |
| Sleep | `/sleep-service/sleep/dailySleep?date=` |
| Weight and body composition | `/weight-service/weight/range/{from}/{to}?includeAll=true` (whole history in one call) |
| Daily summary (steps, resting HR, stress, Body Battery) | `/usersummary-service/usersummary/daily?calendarDate=` |

The auth flow and endpoint list were taken from
[apratico/garmin-mcp](https://github.com/apratico/garmin-mcp) (MIT). That
project is an MCP server for Claude to call; a web app is better served by
calling the same API directly from the Next.js server, so this app does not
need Java or the MCP server installed.

### Rate limits and caching

Garmin allows about 100 requests a minute. Sleep and the daily summary cost one
request per day each, so the client spaces requests ~0.7 s apart and waits when
Garmin answers 429. A day is fetched once and then kept; only the last couple
of days are re-fetched on refresh. Loading a full 12 months for the first time
takes around ten minutes, newest first, and the page fills in as it goes.

The app itself loads at most the last 400 days. `npm run garmin:backfill`
loads everything older, once (about ten minutes per year of history); after
that it is all local and never fetched again.

The app syncs when you press refresh, when the cache is over an hour old, or
when the selected range reaches further back than what's cached.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start on <http://localhost:3015> |
| `npm run garmin:key` | Save and test the API key |
| `npm run garmin:backfill` | One-off: load history older than the last 400 days. No argument goes back to your first activity; pass a date (`-- 2019-01-01`) to choose, or `-- --dry` to see how long it will take. Resumable |
| `npm run garmin:probe` | Print the shape of each Garmin response (`-- --save` keeps raw samples outside the repo) |
| `npm run typecheck` | TypeScript check |

Stack: Next.js 15 (App Router), TypeScript, Tailwind 4, Recharts, Node's
built-in `node:sqlite`. Needs Node 22.5 or newer.
