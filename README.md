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

The app submits scores to `/api/leaderboard`. Supabase is the single source of truth for global scores, weekly scores, wallet-linked token badges, and the weekly No. 1 proposal allocation pick. Create a Supabase project, run `supabase/leaderboard.sql` in the SQL editor, then add these environment variables in Vercel. If the tables already exist, rerun the same SQL safely to add any missing columns or indexes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_LEADERBOARD_TABLE` (optional, defaults to `scicon_leaderboard`)
- `SUPABASE_MONTHLY_WINNERS_TABLE` (optional, defaults to `scicon_monthly_winners`)
- `CRON_SECRET`

Keep the service role key server-side only. Do not expose it with a `VITE_` prefix.

The home screen shows the current-week top 5 by default and lets players switch to the all-time top 25. Weekly reset is automatic: all score rows stay in `scicon_leaderboard`, and the current weekly board is just the rows whose `date` is inside the current Monday-through-Sunday week. Only a score that takes the weekly No. 1 spot can choose the ResearchHub proposal for the 100 RSC weekly allocation pick.

Monthly winner archiving is handled by Vercel Cron. At 00:10 UTC on the first day of each month, `/api/archive-monthly-winner` snapshots the previous month's No. 1 score and proposal pick into `scicon_monthly_winners`. You can view archived winners at `/api/monthly-winners`. To archive a month manually, send an authorized `POST` to `/api/monthly-winners` with `{ "monthKey": "YYYY-MM" }` and `Authorization: Bearer <CRON_SECRET>`.

Optional notifications: the archived-winner cron endpoints still use the original monthly table names until a weekly archive migration is added. Set `MONTHLY_WINNER_WEBHOOK_URL` only if you still want those legacy monthly archive notices.

To intentionally start over with a clean leaderboard, run `supabase/reset-leaderboard.sql` once in the Supabase SQL Editor. Do not add that reset SQL to normal migrations because it deletes all leaderboard rows.

For local testing against a deployed leaderboard, set `VITE_LEADERBOARD_API_URL` in `.env.local` to the deployed API URL, such as `https://your-app.vercel.app/api/leaderboard`. For local testing against Supabase directly through the local Vite API middleware, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to your shell environment before running `npm run dev`.

## Wallet testing

The app uses thirdweb `ConnectButton` for wallet connection. Add `VITE_THIRDWEB_CLIENT_ID` from the thirdweb dashboard before running locally or deploying. The wallet modal recommends Base Account and also supports in-app login through email, Google, Discord, Telegram, Farcaster, and X, plus MetaMask, Rainbow, Rabby, Binance, Coinbase Wallet, Ledger, and Trust Wallet.

Social login uses thirdweb in-app wallets with redirect auth so mobile and embedded browsers do not have to allow popups. In the thirdweb dashboard, keep In-App Wallets enabled and add domain restrictions for every place the app runs, for example `localhost:5173`, `sciconshooter.xyz`, and `www.sciconshooter.xyz`. Use the public client ID in `VITE_THIRDWEB_CLIENT_ID`; never put the secret key in frontend code.

Token funding uses thirdweb widgets and direct ERC-20 transfers:

- Mission credits use a direct Base ERC-20 RSC transfer to the treasury wallet, then add credits after the transaction confirms.
- Promotional KARMA credits use a direct KRMA transfer on BNB Smart Chain to the same treasury wallet. 1 KRMA earns the same 100 mission credits as 1 RSC during the promo period.
- The Swap for RSC tab opens the thirdweb USDC-to-RSC widget with Aerodrome as a fallback route because Bridge routing can vary by token support.
- `BuyWidget` is limited to Base USDC funding, which players can swap into RSC before buying credits.

Confirmed token-credit purchases are stored as wallet-linked profile credits. If a player has profile credits, the lab shows a Deploy button to move them into the current mission.
