import { STORAGE_KEYS } from '../constants';
import { LeaderboardData, LeaderboardEntry } from '../types';

const API_URL = (import.meta.env.VITE_LEADERBOARD_API_URL as string | undefined)?.trim() || '/api/leaderboard';
const MAX_SCORES = 25;
const MAX_MONTHLY_SCORES = 5;
const LOCAL_ARCHIVE_LIMIT = 100;
const SEED_DATE = new Date(0).toISOString();

const DEFAULT_SCORES: LeaderboardEntry[] = [
  { name: "BRIAN", score: 100, date: SEED_DATE, wave: 2 },
  { name: "JEFFREY", score: 98, date: SEED_DATE, wave: 2 },
  { name: "TYLER", score: 96, date: SEED_DATE, wave: 1 },
  { name: "BASE", score: 94, date: SEED_DATE, wave: 1 },
  { name: "PATRICK", score: 92, date: SEED_DATE, wave: 1 },
  { name: "SCOTT", score: 90, date: SEED_DATE, wave: 1 },
  { name: "KOBOLD", score: 88, date: SEED_DATE, wave: 1 },
  { name: "ANTON", score: 86, date: SEED_DATE, wave: 1 },
  { name: "NAMAN", score: 84, date: SEED_DATE, wave: 1 },
  { name: "ED", score: 82, date: SEED_DATE, wave: 1 },
  { name: "CALEB", score: 80, date: SEED_DATE, wave: 1 },
  { name: "SANA", score: 78, date: SEED_DATE, wave: 1 },
  { name: "JESSE", score: 76, date: SEED_DATE, wave: 1 },
  { name: "LOUIE", score: 74, date: SEED_DATE, wave: 1 },
  { name: "VITALIK", score: 72, date: SEED_DATE, wave: 1 },
  { name: "SATOSHI", score: 70, date: SEED_DATE, wave: 1 },
  { name: "REVIEWER 2", score: 68, date: SEED_DATE, wave: 1 },
  { name: "GUEST 1", score: 65, date: SEED_DATE, wave: 1 },
  { name: "GUEST 2", score: 60, date: SEED_DATE, wave: 1 },
  { name: "GUEST 3", score: 55, date: SEED_DATE, wave: 1 },
  { name: "GUEST 4", score: 50, date: SEED_DATE, wave: 1 },
  { name: "GUEST 5", score: 45, date: SEED_DATE, wave: 1 },
  { name: "GUEST 6", score: 40, date: SEED_DATE, wave: 1 },
  { name: "GUEST 7", score: 35, date: SEED_DATE, wave: 1 },
  { name: "GUEST 8", score: 30, date: SEED_DATE, wave: 1 }
];

const DEFAULT_SCORE_KEYS = new Set(DEFAULT_SCORES.map((entry) => `${entry.name}|${entry.score}|${entry.wave}`));

const isDefaultSeedEntry = (entry: LeaderboardEntry) => (
  DEFAULT_SCORE_KEYS.has(`${entry.name}|${entry.score}|${entry.wave}`)
);

const sanitizeText = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

const sanitizeUrl = (value: unknown): string | undefined => {
  const url = sanitizeText(value, 500);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  };
};

const isCurrentMonthEntry = (entry: LeaderboardEntry) => {
  const timestamp = new Date(entry.date || 0).getTime();
  const { start, end } = getCurrentMonthRange();
  return Number.isFinite(timestamp) && timestamp >= start && timestamp < end;
};

const sanitizeEntry = (entry: Partial<LeaderboardEntry> | null | undefined): LeaderboardEntry | null => {
  if (!entry || typeof entry.name !== 'string' || typeof entry.score !== 'number') {
    return null;
  }

  return {
    name: entry.name.trim().substring(0, 15).toUpperCase(),
    score: Math.max(0, Math.floor(entry.score)),
    wave: typeof entry.wave === 'number' ? Math.max(1, Math.floor(entry.wave)) : 1,
    date: entry.date || new Date().toISOString(),
    walletAddress: typeof entry.walletAddress === 'string' ? entry.walletAddress.toLowerCase() : undefined,
    donated: Boolean(entry.donated),
    proposalId: sanitizeText(entry.proposalId, 80),
    proposalTitle: sanitizeText(entry.proposalTitle, 180),
    proposalUrl: sanitizeUrl(entry.proposalUrl),
    proposalAuthor: sanitizeText(entry.proposalAuthor, 100)
  };
};

const dedupeAndSort = (scores: LeaderboardEntry[], limit: number): LeaderboardEntry[] => {
  const seen = new Set<string>();
  const normalized = scores
    .map(score => sanitizeEntry(score))
    .filter((score): score is LeaderboardEntry => !!score)
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

const readStoredScores = (key: string): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? dedupeAndSort(parsed, LOCAL_ARCHIVE_LIMIT).filter((score) => !isDefaultSeedEntry(score))
      : [];
  } catch (error) {
    console.error(`Failed to parse ${key}`, error);
    return [];
  }
};

const writeStoredScores = (key: string, scores: LeaderboardEntry[]) => {
  localStorage.setItem(key, JSON.stringify(scores));
};

const mergeScores = (...scoreGroups: LeaderboardEntry[][]): LeaderboardEntry[] => {
  return dedupeAndSort(scoreGroups.flat(), LOCAL_ARCHIVE_LIMIT);
};

const toLeaderboardData = (scores: LeaderboardEntry[]): LeaderboardData => {
  const archive = dedupeAndSort(scores, LOCAL_ARCHIVE_LIMIT);
  const allTime = dedupeAndSort(archive, MAX_SCORES);
  const monthlyScores = dedupeAndSort(archive.filter(isCurrentMonthEntry), MAX_MONTHLY_SCORES);

  return { scores: allTime, monthlyScores };
};

const readRemoteLeaderboardData = async (): Promise<LeaderboardData> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Leaderboard fetch failed with ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Leaderboard endpoint did not return JSON');
  }

  const data = await response.json();
  const scores = Array.isArray(data.scores) ? dedupeAndSort(data.scores, MAX_SCORES) : [];
  const monthlyScores = Array.isArray(data.monthlyScores)
    ? dedupeAndSort(data.monthlyScores, MAX_MONTHLY_SCORES)
    : dedupeAndSort(scores.filter(isCurrentMonthEntry), MAX_MONTHLY_SCORES);

  return { scores, monthlyScores };
};

const writeRemoteLeaderboardData = async (entry: LeaderboardEntry | null, scores: LeaderboardEntry[] = []): Promise<LeaderboardData> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ entry, scores })
  });

  if (!response.ok) {
    throw new Error(`Leaderboard save failed with ${response.status}`);
  }

  const data = await response.json();
  const nextScores = Array.isArray(data.scores) ? dedupeAndSort(data.scores, MAX_SCORES) : [];
  const monthlyScores = Array.isArray(data.monthlyScores)
    ? dedupeAndSort(data.monthlyScores, MAX_MONTHLY_SCORES)
    : dedupeAndSort(nextScores.filter(isCurrentMonthEntry), MAX_MONTHLY_SCORES);

  return { scores: nextScores, monthlyScores };
};

export const getLeaderboardData = async (): Promise<LeaderboardData> => {
  const localArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const offlineTop = readStoredScores(STORAGE_KEYS.OFFLINE_SCORES);

  try {
    let remoteData = await readRemoteLeaderboardData();

    if (localArchive.length > 0 || offlineTop.length > 0) {
      try {
        remoteData = await writeRemoteLeaderboardData(null, mergeScores(localArchive, offlineTop).filter((score) => !isDefaultSeedEntry(score)));
      } catch (syncError) {
        console.error("Failed to sync local leaderboard archive", syncError);
      }
    }

    const mergedScores = mergeScores(remoteData.scores, remoteData.monthlyScores, localArchive, offlineTop, DEFAULT_SCORES);
    const leaderboardData = toLeaderboardData(mergedScores);

    writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, mergedScores);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, leaderboardData.scores);

    return leaderboardData;
  } catch (error) {
    console.error("Leaderboard error:", error);
    const fallbackScores = dedupeAndSort([...localArchive, ...offlineTop, ...DEFAULT_SCORES], MAX_SCORES);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, fallbackScores);
    return toLeaderboardData([...localArchive, ...offlineTop, ...DEFAULT_SCORES]);
  }
};

export const getScores = async (): Promise<LeaderboardEntry[]> => {
  const data = await getLeaderboardData();
  return data.scores;
};

export const saveScore = async (
  name: string,
  score: number,
  wave: number,
  options: {
    walletAddress?: string | null;
    donated?: boolean;
    proposalId?: string;
    proposalTitle?: string;
    proposalUrl?: string;
    proposalAuthor?: string;
  } = {}
): Promise<LeaderboardData> => {
  const newEntry: LeaderboardEntry = {
    name: name.trim().substring(0, 15).toUpperCase(),
    score: Math.max(0, Math.floor(score)),
    wave: Math.max(1, Math.floor(wave)),
    date: new Date().toISOString(),
    walletAddress: options.walletAddress ? options.walletAddress.toLowerCase() : undefined,
    donated: Boolean(options.donated),
    proposalId: sanitizeText(options.proposalId, 80),
    proposalTitle: sanitizeText(options.proposalTitle, 180),
    proposalUrl: sanitizeUrl(options.proposalUrl),
    proposalAuthor: sanitizeText(options.proposalAuthor, 100)
  };

  const currentLocalArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const nextLocalArchive = mergeScores(currentLocalArchive, [newEntry], DEFAULT_SCORES);
  writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, nextLocalArchive.slice(0, LOCAL_ARCHIVE_LIMIT));

  try {
    const remoteData = await writeRemoteLeaderboardData(newEntry, nextLocalArchive.filter((score) => !isDefaultSeedEntry(score)));
    const mergedScores = mergeScores(remoteData.scores, remoteData.monthlyScores, nextLocalArchive, DEFAULT_SCORES);
    const leaderboardData = toLeaderboardData(mergedScores);

    writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, mergedScores.slice(0, LOCAL_ARCHIVE_LIMIT));
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, leaderboardData.scores);

    return leaderboardData;
  } catch (error) {
    console.error("Save error:", error);
    const fallbackScores = dedupeAndSort([...nextLocalArchive, ...DEFAULT_SCORES], MAX_SCORES);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, fallbackScores);
    return toLeaderboardData([...nextLocalArchive, ...DEFAULT_SCORES]);
  }
};
