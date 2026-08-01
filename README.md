# Meridian — Portfolio return advisor

Meridian is a client-side financial advisor that reviews your current investments, scores allocation fit, and ranks concrete recommendations to improve expected return.

## What it does

- Capture holdings by name, asset class, amount, and expense ratio
- Choose a risk stance and time horizon
- Compare your mix to a model allocation (conservative / moderate / growth)
- Surface diversification and return-efficiency scores
- Rank moves that can lift return: deploy idle cash, trim concentration, cut fee drag, rebalance underweights

Educational illustration only — not personalized investment advice.

## Setup

```bash
npm install
npm run dev
```

Open the URL lite-server prints (usually `http://localhost:3000`).

## Sample walkthrough

1. Click **Try a sample portfolio** on the hero, or **Load sample** in the advisor.
2. Adjust risk stance / horizon if you like.
3. Click **Get recommendations** to refresh the readout.
4. Add your own holdings and re-run.

## Project notes

This repository previously hosted a Truffle “Hot or Not” voting demo. The frontend is now Meridian. Legacy Solidity contracts under `contracts/` are unused by the advisor UI.

## Scripts

- `npm run dev` — serve the app with lite-server
- `npm test` — run the recommendation engine checks
