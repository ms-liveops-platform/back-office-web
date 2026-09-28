# Orbit LiveOps Console

React + TypeScript + Vite back office. HTTP requests go to core-api; only core-api connects to MongoDB.

## Run

1. In core-api, set `MONGO_DB_CONNECTION_STRING` in `.env` (Atlas or a replica set), then run `npm run dev` on port 5555.
2. In this repository:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:9999. Vite hot reload is enabled. `npm run build` type-checks and creates the production bundle.

Optional `.env` settings are documented in `.env.example`: `VITE_API_URL` defaults to `http://127.0.0.1:5555/api/back-office`, and `VITE_GAME_URL` to `http://127.0.0.1:7777`.

## Sections

- **Analytics:** persisted player/spin totals, mock deposits, daily active players, D1/D7 retention, credit movement, and award delivery. Seeded cohorts are reported separately. No fake fallback metrics.
- **Campaigns:** create/edit/archive campaigns, choose reward experience/value and targeting, then issue manually. Each Issue rechecks current player data; qualifying players can receive awards in multiple runs.
- **Player targeting:** create/edit/archive players with display names and tags, preview intersecting audience criteria, select players for a campaign, or launch the game as a player.
- **Awards:** grant credits immediately or create pending mini-game awards. Pending awards can be revoked. Credited ledger records cannot be erased.
- **Simulation:** create a labeled historical cohort, make mock deposits, and record return sessions. Open games receive balance changes over WebSocket.

Player game links put demo credentials in the URL fragment, which games-web consumes and removes, then remembers in localStorage. Opening a game with no saved identity provisions a new demo player with 100 credits. All balances are mock integer credits.

## Demo walkthrough

1. Seed 12 players in Simulation.
2. Open Player targeting, edit a display name, and launch that player's game.
3. Spin and watch the server deduct 1 credit, then add any winning-way payouts.
4. Deposit 100 credits for that player in Simulation; the open game's balance updates.
5. Create an active credits campaign with tag `simulated`, then Issue.
6. Inspect the awards ledger and Analytics. Use Refresh after activity in the game or another tab.

Only 500 latest records are displayed per collection in this UI; API pagination is documented in core-api. Scheduled campaigns are not implemented yet. The administrative API is a local, unauthenticated development interface; no production operator login is implied.

## Wheel and chest campaigns

Choose Lucky wheel or Lucky chests in Campaigns or Awards. Configure the sector/chest count, instant credit prizes or multipliers, comma-separated amounts, and optional labels. Multiplier prizes require a base amount. Count must match the amount list; each entry has equal odds.

Issue an active campaign to its matched players, or grant a manual award. Connected slots receive the pending bonus over WebSocket and open it after the current spin. Offline players receive it on reconnect. Playing credits the prize once and changes the ledger status to `played`; Refresh displays the result and updated analytics. Targets and scratch are also playable through the same award flow.

## Birds and scratch cards

Select moving targets to configure live bird count (at least three), round duration (5–120 seconds; default 30), minimum and maximum reward, instant credits or multipliers, and a required multiplier base. Every integer in the inclusive range has equal probability; players can hit many targets before the countdown ends. Every hit replaces a bird and adds its reward. The server pays the summed credits, or the summed multipliers × base amount, once at expiry. Reconnecting does not restart the timer.

Select scratch to configure zone count and the amount list. The optional Zone modes list accepts `instant` or `multiplier` per entry, allowing mixed cards; otherwise all zones inherit Prize mode. Base amount applies to multiplier zones only. Only the scratched zone pays; the game reveals the rest in gray.

Both campaign and manual grants snapshot these settings and push to matching connected players. Played outcomes and total mini-game payouts appear in Awards and Analytics.

## Create a player

In **Player targeting**, click **New player** in the page header to open the form. Enter a display name, starting mock credits (default 100), and optional comma-separated tags. Submit **Create player** to save through core-api. The form clears after a successful save and shows the generated player ID with **Open slot as this player**, which launches the authenticated player link. MongoDB must be connected to save players.

## Issue a campaign again

Press **Issue** for a new run using current balances, tags, status and deposit totals. Players who no longer match are excluded; players who still match can receive another award. If a request fails, **Retry issue** reuses the same run ID to avoid duplicate awards. After a successful response, the next **Issue** creates a new run. The displayed counts describe that run.

## Heroku deployment

See [HEROKU.md](HEROKU.md) for the app setup and required public build-time URLs. `npm start` serves the built `dist` directory with SPA route fallback and Heroku’s assigned port. Development commands and ports are unchanged.

## Code quality

Run `npm run lint` to check JavaScript and TypeScript, or `npm run lint:fix` to apply automatic fixes. Run `npm run format` to format the project with Prettier, and `npm run format:check` to check formatting without changing files. Build output, dependencies, coverage, and local environment files are excluded.

TypeScript is pinned to the 6.0 minor series supported by typescript-eslint. Upgrade them together when newer compiler support is available.
