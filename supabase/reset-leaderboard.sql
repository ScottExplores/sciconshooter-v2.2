-- Destructive reset: run only when you intentionally want a clean leaderboard.
-- This removes all score rows and archived monthly winners, then resets identity counters.
truncate table public.scicon_monthly_winners, public.scicon_leaderboard restart identity;
