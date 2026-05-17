<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Y8dpXQRPnZfRavbYSvuY9uqr2T_S_gML

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Global leaderboard

The app submits scores to `/api/leaderboard`. On Vercel, create a KV database or an Upstash Redis database and add these environment variables:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Upstash's equivalent names also work:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

For local testing against a deployed leaderboard, set `VITE_LEADERBOARD_API_URL` in `.env.local` to the deployed API URL, such as `https://your-app.vercel.app/api/leaderboard`.

## Wallet testing

The app supports injected browser wallets, Coinbase Wallet, Base Account, and Farcaster mini app wallets. To enable WalletConnect as another mobile option, add `VITE_WALLETCONNECT_PROJECT_ID` from WalletConnect Cloud.
