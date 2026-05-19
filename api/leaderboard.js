const MAX_SCORES = 25;
const MAX_MONTHLY_SCORES = 5;
const SYNC_SCORE_LIMIT = 100;
const LEADERBOARD_KEY = process.env.LEADERBOARD_KV_KEY || 'scicon-shooter:leaderboard';
const SUPABASE_TABLE = process.env.SUPABASE_LEADERBOARD_TABLE || 'scicon_leaderboard';

const DEFAULT_SCORES = [
  { name: 'BRIAN', score: 100, wave: 2 },
  { name: 'JEFFREY', score: 98, wave: 2 },
  { name: 'TYLER', score: 96, wave: 1 },
  { name: 'BASE', score: 94, wave: 1 },
  { name: 'PATRICK', score: 92, wave: 1 },
  { name: 'SCOTT', score: 90, wave: 1 },
  { name: 'KOBOLD', score: 88, wave: 1 },
  { name: 'ANTON', score: 86, wave: 1 },
  { name: 'NAMAN', score: 84, wave: 1 },
  { name: 'ED', score: 82, wave: 1 },
  { name: 'CALEB', score: 80, wave: 1 },
  { name: 'SANA', score: 78, wave: 1 },
  { name: 'JESSE', score: 76, wave: 1 },
  { name: 'LOUIE', score: 74, wave: 1 },
  { name: 'VITALIK', score: 72, wave: 1 },
  { name: 'SATOSHI', score: 70, wave: 1 },
  { name: 'REVIEWER 2', score: 68, wave: 1 },
  { name: 'GUEST 1', score: 65, wave: 1 },
  { name: 'GUEST 2', score: 60, wave: 1 },
  { name: 'GUEST 3', score: 55, wave: 1 },
  { name: 'GUEST 4', score: 50, wave: 1 },
  { name: 'GUEST 5', score: 45, wave: 1 },
  { name: 'GUEST 6', score: 40, wave: 1 },
  { name: 'GUEST 7', score: 35, wave: 1 },
  { name: 'GUEST 8', score: 30, wave: 1 }
].map((entry) => ({ ...entry, date: new Date(0).toISOString() }));

const DEFAULT_SCORE_KEYS = new Set(DEFAULT_SCORES.map((entry) => `${entry.name}|${entry.score}|${entry.wave}`));
const LEGACY_SUPABASE_SELECT = 'name,score,wave,date,wallet_address,donated';
const SUPABASE_SELECT = `${LEGACY_SUPABASE_SELECT},proposal_id,proposal_title,proposal_url,proposal_author`;

const isDefaultSeedEntry = (entry) => (
  Boolean(entry) && DEFAULT_SCORE_KEYS.has(`${entry.name}|${entry.score}|${entry.wave}`)
);

const getRedisConfig = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
});

const hasRedisConfig = () => {
  const { url, token } = getRedisConfig();
  return Boolean(url && token);
};

const hasSupabaseConfig = () => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
};

const sanitizeText = (value, maxLength) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

const sanitizeUrl = (value) => {
  const url = sanitizeText(value, 500);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
};

const isMissingProposalColumnError = (error) => (
  /proposal_|schema cache|column/i.test(error?.message || '')
);

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
  };
};

const isCurrentMonthEntry = (entry) => {
  const timestamp = new Date(entry.date || 0).getTime();
  const { start, end } = getCurrentMonthRange();
  return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp < end.getTime();
};

const sanitizeEntry = (entry) => {
  if (!entry || typeof entry.name !== 'string' || typeof entry.score !== 'number') {
    return null;
  }

  const name = entry.name.trim().slice(0, 15).toUpperCase();
  if (!name) return null;

  return {
    name,
    score: Math.max(0, Math.floor(entry.score)),
    wave: typeof entry.wave === 'number' ? Math.max(1, Math.floor(entry.wave)) : 1,
    date: typeof entry.date === 'string' ? entry.date : new Date().toISOString(),
    walletAddress: typeof entry.walletAddress === 'string' ? entry.walletAddress.toLowerCase() : undefined,
    donated: Boolean(entry.donated),
    proposalId: sanitizeText(entry.proposalId, 80),
    proposalTitle: sanitizeText(entry.proposalTitle, 180),
    proposalUrl: sanitizeUrl(entry.proposalUrl),
    proposalAuthor: sanitizeText(entry.proposalAuthor, 100)
  };
};

const dedupeAndSort = (scores, limit = MAX_SCORES) => {
  const seen = new Set();
  const normalized = scores
    .map(sanitizeEntry)
    .filter(Boolean)
    .filter((score) => {
      const key = `${score.name}|${score.score}|${score.wave}|${score.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  normalized.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  return normalized.slice(0, limit);
};

const toLeaderboardPayload = (scores) => {
  const archive = dedupeAndSort(scores, SYNC_SCORE_LIMIT);
  return {
    scores: dedupeAndSort(archive, MAX_SCORES),
    monthlyScores: dedupeAndSort(archive.filter(isCurrentMonthEntry), MAX_MONTHLY_SCORES)
  };
};

const redisCommand = async (command) => {
  const { url, token } = getRedisConfig();
  if (!url || !token) {
    throw new Error('Missing KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Redis command failed with ${response.status}`);
  }

  return response.json();
};

const readRedisScores = async () => {
  const data = await redisCommand(['GET', LEADERBOARD_KEY]);
  if (!data.result) {
    return dedupeAndSort(DEFAULT_SCORES, SYNC_SCORE_LIMIT);
  }

  const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  const scores = Array.isArray(parsed.scores) ? parsed.scores : parsed;
  return dedupeAndSort(Array.isArray(scores) ? scores : DEFAULT_SCORES, SYNC_SCORE_LIMIT);
};

const writeRedisScores = async (scores) => {
  const archive = dedupeAndSort(scores, SYNC_SCORE_LIMIT);
  await redisCommand(['SET', LEADERBOARD_KEY, JSON.stringify({ scores: archive })]);
  return archive;
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

const toSupabaseRow = (entry) => ({
  name: entry.name,
  score: entry.score,
  wave: entry.wave,
  date: entry.date,
  wallet_address: entry.walletAddress || null,
  donated: Boolean(entry.donated),
  proposal_id: entry.proposalId || null,
  proposal_title: entry.proposalTitle || null,
  proposal_url: entry.proposalUrl || null,
  proposal_author: entry.proposalAuthor || null
});

const withoutProposalColumns = (row) => ({
  name: row.name,
  score: row.score,
  wave: row.wave,
  date: row.date,
  wallet_address: row.wallet_address || null,
  donated: Boolean(row.donated)
});

const fromSupabaseRow = (row) => sanitizeEntry({
  name: row.name,
  score: row.score,
  wave: row.wave,
  date: row.date,
  walletAddress: row.wallet_address,
  donated: row.donated,
  proposalId: row.proposal_id,
  proposalTitle: row.proposal_title,
  proposalUrl: row.proposal_url,
  proposalAuthor: row.proposal_author
});

const requestSupabaseScores = async (selectColumns, query = '') => {
  const response = await fetch(supabaseUrl(`${SUPABASE_TABLE}?select=${selectColumns}&order=score.desc,date.desc${query}`), {
    headers: supabaseHeaders()
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase leaderboard fetch failed with ${response.status}: ${details}`);
  }

  return response.json();
};

const readSupabaseScores = async () => {
  const { start, end } = getCurrentMonthRange();
  const monthlyQuery = `&date=gte.${encodeURIComponent(start.toISOString())}&date=lt.${encodeURIComponent(end.toISOString())}&limit=${MAX_MONTHLY_SCORES}`;
  let rows;
  let monthlyRows;

  try {
    rows = await requestSupabaseScores(SUPABASE_SELECT, `&limit=${SYNC_SCORE_LIMIT}`);
    monthlyRows = await requestSupabaseScores(SUPABASE_SELECT, monthlyQuery);
  } catch (error) {
    if (!isMissingProposalColumnError(error)) {
      throw error;
    }

    rows = await requestSupabaseScores(LEGACY_SUPABASE_SELECT, `&limit=${SYNC_SCORE_LIMIT}`);
    monthlyRows = await requestSupabaseScores(LEGACY_SUPABASE_SELECT, monthlyQuery);
  }

  const combinedRows = [
    ...(Array.isArray(rows) ? rows : []),
    ...(Array.isArray(monthlyRows) ? monthlyRows : [])
  ];
  const scores = combinedRows.length > 0
    ? combinedRows.map(fromSupabaseRow).filter(Boolean).filter((score) => !isDefaultSeedEntry(score))
    : [];
  return scores.length > 0 ? dedupeAndSort(scores, SYNC_SCORE_LIMIT) : dedupeAndSort(DEFAULT_SCORES, SYNC_SCORE_LIMIT);
};

const insertSupabaseRows = async (rows) => {
  const response = await fetch(supabaseUrl(`${SUPABASE_TABLE}?on_conflict=name,score,wave,date`), {
    method: 'POST',
    headers: supabaseHeaders({
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    }),
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase leaderboard save failed with ${response.status}: ${details}`);
  }
};

const writeSupabaseScores = async (scores) => {
  const rows = dedupeAndSort(scores, SYNC_SCORE_LIMIT)
    .filter((score) => !isDefaultSeedEntry(score))
    .map(toSupabaseRow);

  if (rows.length > 0) {
    try {
      await insertSupabaseRows(rows);
    } catch (error) {
      if (!isMissingProposalColumnError(error)) {
        throw error;
      }

      // Keeps legacy deployments alive until the Supabase migration below is applied.
      await insertSupabaseRows(rows.map(withoutProposalColumns));
    }
  }

  return readSupabaseScores();
};

const readScores = async () => {
  if (hasSupabaseConfig()) {
    return readSupabaseScores();
  }

  if (hasRedisConfig()) {
    return readRedisScores();
  }

  throw new Error('Missing leaderboard storage config. Add Supabase env vars or KV/Upstash env vars.');
};

const writeScores = async (scores) => {
  if (hasSupabaseConfig()) {
    return writeSupabaseScores(scores);
  }

  if (hasRedisConfig()) {
    return writeRedisScores(scores);
  }

  throw new Error('Missing leaderboard storage config. Add Supabase env vars or KV/Upstash env vars.');
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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    if (req.method === 'GET') {
      const scores = await readScores();
      return sendJson(res, 200, toLeaderboardPayload(scores));
    }

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      const currentScores = await readScores();
      const entry = sanitizeEntry(body.entry);
      const submittedScores = Array.isArray(body.scores) ? body.scores : [];

      if (!entry && submittedScores.length === 0) {
        return sendJson(res, 400, { error: 'Missing leaderboard entry' });
      }

      const scores = await writeScores([...currentScores, ...submittedScores, entry].filter(Boolean));
      return sendJson(res, 200, toLeaderboardPayload(scores));
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return sendJson(res, 500, {
      error: 'Leaderboard storage is not configured',
      details: error.message
    });
  }
};
