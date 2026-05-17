import { STORAGE_KEYS } from '../constants';
import { LeaderboardEntry } from '../types';

const API_URL = (import.meta.env.VITE_LEADERBOARD_API_URL as string | undefined)?.trim() || '/api/leaderboard';
const MAX_SCORES = 25;
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
    donated: Boolean(entry.donated)
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

const readRemoteScores = async (): Promise<LeaderboardEntry[]> => {
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
  return Array.isArray(data.scores) ? dedupeAndSort(data.scores, MAX_SCORES) : [];
};

const writeRemoteScores = async (entry: LeaderboardEntry | null, scores: LeaderboardEntry[] = []): Promise<LeaderboardEntry[]> => {
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
  return Array.isArray(data.scores) ? dedupeAndSort(data.scores, MAX_SCORES) : [];
};

export const getScores = async (): Promise<LeaderboardEntry[]> => {
  const localArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const offlineTop = readStoredScores(STORAGE_KEYS.OFFLINE_SCORES);

  try {
    let remoteScores = await readRemoteScores();

    if (localArchive.length > 0 || offlineTop.length > 0) {
      try {
        remoteScores = await writeRemoteScores(null, mergeScores(localArchive, offlineTop).filter((score) => !isDefaultSeedEntry(score)));
      } catch (syncError) {
        console.error("Failed to sync local leaderboard archive", syncError);
      }
    }

    const mergedScores = mergeScores(remoteScores, localArchive, offlineTop, DEFAULT_SCORES);
    const topScores = mergedScores.slice(0, MAX_SCORES);

    writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, mergedScores);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, topScores);

    return topScores;
  } catch (error) {
    console.error("Leaderboard error:", error);
    const fallbackScores = dedupeAndSort([...localArchive, ...offlineTop, ...DEFAULT_SCORES], MAX_SCORES);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, fallbackScores);
    return fallbackScores;
  }
};

export const saveScore = async (
  name: string,
  score: number,
  wave: number,
  options: { walletAddress?: string | null; donated?: boolean } = {}
): Promise<LeaderboardEntry[]> => {
  const newEntry: LeaderboardEntry = {
    name: name.trim().substring(0, 15).toUpperCase(),
    score: Math.max(0, Math.floor(score)),
    wave: Math.max(1, Math.floor(wave)),
    date: new Date().toISOString(),
    walletAddress: options.walletAddress ? options.walletAddress.toLowerCase() : undefined,
    donated: Boolean(options.donated)
  };

  const currentLocalArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const nextLocalArchive = mergeScores(currentLocalArchive, [newEntry], DEFAULT_SCORES);
  writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, nextLocalArchive.slice(0, LOCAL_ARCHIVE_LIMIT));

  try {
    const remoteScores = await writeRemoteScores(newEntry, nextLocalArchive.filter((score) => !isDefaultSeedEntry(score)));
    const mergedScores = mergeScores(remoteScores, nextLocalArchive, DEFAULT_SCORES);
    const topScores = mergedScores.slice(0, MAX_SCORES);

    writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, mergedScores.slice(0, LOCAL_ARCHIVE_LIMIT));
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, topScores);

    return topScores;
  } catch (error) {
    console.error("Save error:", error);
    const fallbackScores = dedupeAndSort([...nextLocalArchive, ...DEFAULT_SCORES], MAX_SCORES);
    writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, fallbackScores);
    return fallbackScores;
  }
};
