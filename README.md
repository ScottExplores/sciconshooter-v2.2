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

The app submits scores to `/api/leaderboard`. Supabase is the recommended storage path because the game already tracks wallet addresses, RSC support badges, monthly events, and future proposal voting. Create a Supabase project, run `supabase/leaderboard.sql` in the SQL editor, then add these environment variables in Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADERBOARD_TABLE` (optional, defaults to `scicon_leaderboard`)

Keep the service role key server-side only. Do not expose it with a `VITE_` prefix.

KV/Upstash Redis still works for a simpler top-25-only setup. Add these environment variables instead:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Upstash's equivalent names also work:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

For local testing against a deployed leaderboard, set `VITE_LEADERBOARD_API_URL` in `.env.local` to the deployed API URL, such as `https://your-app.vercel.app/api/leaderboard`. For local testing against Supabase directly through the local Vite API middleware, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your shell environment before running `npm run dev`.

## Wallet testing

The app supports the Reown AppKit wallet picker, injected browser wallets, Coinbase Wallet, Base Account, and Farcaster mini app wallets. For production, add `VITE_REOWN_PROJECT_ID` from Reown Cloud. `VITE_WALLETCONNECT_PROJECT_ID` also works. Local dev uses Reown's localhost-only demo project id so the wallet picker can be tested without extra setup.
