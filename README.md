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
- **Campaigns:** create/edit/archive campaigns, choose reward experience/value and targeting, then issue manually. Each player receives a campaign at most once.
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

Only 500 latest records are displayed per collection in this UI; API pagination is documented in core-api. Mini-game award redemption and scheduled campaigns are not implemented yet. The administrative API is a local, unauthenticated development interface; no production operator login is implied.
