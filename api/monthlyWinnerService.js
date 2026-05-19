const LEADERBOARD_TABLE = process.env.SUPABASE_LEADERBOARD_TABLE || 'scicon_leaderboard';
const WINNERS_TABLE = process.env.SUPABASE_MONTHLY_WINNERS_TABLE || 'scicon_monthly_winners';
const DEFAULT_ALLOCATION_RSC = 500;

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
});

const assertSupabaseConfig = () => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Missing Supabase config. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
};

const supabaseUrl = (path) => {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, '')}/rest/v1/${path}`;
};

const supabaseHeaders = (extraHeaders = {}) => {
  const { key } = getSupabaseConfig();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extraHeaders
  };
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.end(JSON.stringify(payload));
};

const parseBody = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

const isAuthorized = (req) => {
  const tokens = [process.env.ADMIN_SECRET, process.env.CRON_SECRET].filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.some((token) => req.headers.authorization === `Bearer ${token}`);
};

const monthKeyFromDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getPreviousMonthKey = (now = new Date()) => (
  monthKeyFromDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)))
);

const getMonthRange = (monthKey) => {
  if (!/^\d{4}-\d{2}$/.test(monthKey || '')) {
    throw new Error('Month must be formatted as YYYY-MM.');
  }

  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { start, end };
};

const fetchJson = async (path, options = {}) => {
  assertSupabaseConfig();
  const response = await fetch(supabaseUrl(path), options);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed with ${response.status}: ${details}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const readMonthlyWinners = async (limit = 24) => {
  const rows = await fetchJson(`${WINNERS_TABLE}?select=*&order=month_key.desc&limit=${limit}`, {
    headers: supabaseHeaders()
  });

  return Array.isArray(rows) ? rows : [];
};

const readTopScoreForMonth = async (monthKey) => {
  const { start, end } = getMonthRange(monthKey);
  const query = [
    'select=name,score,wave,date,wallet_address,donated,proposal_id,proposal_title,proposal_url,proposal_author',
    'order=score.desc,date.desc',
    'limit=1',
    `date=gte.${encodeURIComponent(start.toISOString())}`,
    `date=lt.${encodeURIComponent(end.toISOString())}`
  ].join('&');
  const rows = await fetchJson(`${LEADERBOARD_TABLE}?${query}`, {
    headers: supabaseHeaders()
  });

  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};

const toWinnerRow = (monthKey, scoreRow) => {
  const { start, end } = getMonthRange(monthKey);
  const allocationRsc = Number.parseInt(process.env.MONTHLY_ALLOCATION_RSC || '', 10) || DEFAULT_ALLOCATION_RSC;

  return {
    month_key: monthKey,
    month_start: start.toISOString(),
    month_end: end.toISOString(),
    winner_name: scoreRow.name,
    score: scoreRow.score,
    wave: scoreRow.wave || 1,
    score_date: scoreRow.date,
    wallet_address: scoreRow.wallet_address || null,
    donated: Boolean(scoreRow.donated),
    proposal_id: scoreRow.proposal_id || null,
    proposal_title: scoreRow.proposal_title || null,
    proposal_url: scoreRow.proposal_url || null,
    proposal_author: scoreRow.proposal_author || null,
    allocation_rsc: allocationRsc
  };
};

const notifyMonthlyWinner = async (winner) => {
  const webhookUrl = process.env.MONTHLY_WINNER_WEBHOOK_URL;
  if (!webhookUrl) return { sent: false, reason: 'MONTHLY_WINNER_WEBHOOK_URL not configured' };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'scicon_monthly_winner',
      winner
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Monthly winner webhook failed with ${response.status}: ${details}`);
  }

  return { sent: true };
};

const markNotificationSent = async (monthKey) => {
  await fetchJson(`${WINNERS_TABLE}?month_key=eq.${encodeURIComponent(monthKey)}`, {
    method: 'PATCH',
    headers: supabaseHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ notification_sent_at: new Date().toISOString() })
  });
};

const archiveMonthlyWinner = async (monthKey = getPreviousMonthKey()) => {
  const topScore = await readTopScoreForMonth(monthKey);
  if (!topScore) {
    return { archived: false, monthKey, reason: 'No score rows found for this month.' };
  }

  const winnerRow = toWinnerRow(monthKey, topScore);
  const savedRows = await fetchJson(`${WINNERS_TABLE}?on_conflict=month_key`, {
    method: 'POST',
    headers: supabaseHeaders({
      Prefer: 'resolution=merge-duplicates,return=representation'
    }),
    body: JSON.stringify(winnerRow)
  });
  const winner = Array.isArray(savedRows) ? savedRows[0] : winnerRow;

  let notification = { sent: false, reason: 'MONTHLY_WINNER_WEBHOOK_URL not configured' };
  try {
    notification = await notifyMonthlyWinner(winner);
    if (notification.sent) {
      await markNotificationSent(monthKey);
    }
  } catch (error) {
    notification = { sent: false, error: error.message };
  }

  return { archived: true, monthKey, winner, notification };
};

module.exports = {
  archiveMonthlyWinner,
  getPreviousMonthKey,
  isAuthorized,
  parseBody,
  readMonthlyWinners,
  sendJson
};
