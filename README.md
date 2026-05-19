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

## Supabase leaderboard

The app submits scores to `/api/leaderboard`. Supabase is the single source of truth for global scores, monthly scores, wallet-linked RSC badges, and the monthly No. 1 proposal funding signal. Create a Supabase project, run `supabase/leaderboard.sql` in the SQL editor, then add these environment variables in Vercel. If the tables already exist, rerun the same SQL safely to add any missing columns or indexes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADERBOARD_TABLE` (optional, defaults to `scicon_leaderboard`)
- `SUPABASE_MONTHLY_WINNERS_TABLE` (optional, defaults to `scicon_monthly_winners`)
- `CRON_SECRET`

Keep the service role key server-side only. Do not expose it with a `VITE_` prefix.

The home screen shows the current-month top 5 by default and lets players switch to the all-time top 25. Monthly reset is automatic: all score rows stay in `scicon_leaderboard`, and the current monthly board is just the rows whose `date` is inside the current month. Only a score that takes the monthly No. 1 spot can choose the ResearchHub proposal for the 500 RSC monthly allocation signal.

Monthly winner archiving is handled by Vercel Cron. At 00:10 UTC on the first day of each month, `/api/archive-monthly-winner` snapshots the previous month's No. 1 score and proposal pick into `scicon_monthly_winners`. You can view archived winners at `/api/monthly-winners`. To archive a month manually, send an authorized `POST` to `/api/monthly-winners` with `{ "monthKey": "YYYY-MM" }` and `Authorization: Bearer <CRON_SECRET>`.

Optional notifications: set `MONTHLY_WINNER_WEBHOOK_URL` to a Zapier, Make, Discord, Slack, or email-service webhook. The archive job will post the winner payload there after saving it in Supabase. Set `MONTHLY_ALLOCATION_RSC` if the monthly allocation changes from 500.

For local testing against a deployed leaderboard, set `VITE_LEADERBOARD_API_URL` in `.env.local` to the deployed API URL, such as `https://your-app.vercel.app/api/leaderboard`. For local testing against Supabase directly through the local Vite API middleware, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your shell environment before running `npm run dev`.

## Wallet testing

The app supports the Reown AppKit wallet picker, injected browser wallets, Coinbase Wallet, Base Account, and Farcaster mini app wallets. For production, add `VITE_REOWN_PROJECT_ID` from Reown Cloud. `VITE_WALLETCONNECT_PROJECT_ID` also works. Local dev uses Reown's localhost-only demo project id so the wallet picker can be tested without extra setup.
