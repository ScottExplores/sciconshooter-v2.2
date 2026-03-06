import { PANTRY_CONFIG, STORAGE_KEYS } from '../constants';
import { LeaderboardEntry } from '../types';

const BASE_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_CONFIG.ID}/basket/${PANTRY_CONFIG.BASKET_NAME}`;
const MAX_SCORES = 25;
const LOCAL_ARCHIVE_LIMIT = 100;

const DEFAULT_SCORES: LeaderboardEntry[] = [
  { name: "BRIAN", score: 100, date: new Date().toISOString(), wave: 2 },
  { name: "JEFFREY", score: 98, date: new Date().toISOString(), wave: 2 },
  { name: "TYLER", score: 96, date: new Date().toISOString(), wave: 1 },
  { name: "BASE", score: 94, date: new Date().toISOString(), wave: 1 },
  { name: "PATRICK", score: 92, date: new Date().toISOString(), wave: 1 },
  { name: "SCOTT", score: 90, date: new Date().toISOString(), wave: 1 },
  { name: "KOBOLD", score: 88, date: new Date().toISOString(), wave: 1 },
  { name: "ANTON", score: 86, date: new Date().toISOString(), wave: 1 },
  { name: "NAMAN", score: 84, date: new Date().toISOString(), wave: 1 },
  { name: "ED", score: 82, date: new Date().toISOString(), wave: 1 },
  { name: "CALEB", score: 80, date: new Date().toISOString(), wave: 1 },
  { name: "SANA", score: 78, date: new Date().toISOString(), wave: 1 },
  { name: "JESSE", score: 76, date: new Date().toISOString(), wave: 1 },
  { name: "LOUIE", score: 74, date: new Date().toISOString(), wave: 1 },
  { name: "VITALIK", score: 72, date: new Date().toISOString(), wave: 1 },
  { name: "SATOSHI", score: 70, date: new Date().toISOString(), wave: 1 },
  { name: "REVIEWER 2", score: 68, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 1", score: 65, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 2", score: 60, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 3", score: 55, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 4", score: 50, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 5", score: 45, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 6", score: 40, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 7", score: 35, date: new Date().toISOString(), wave: 1 },
  { name: "GUEST 8", score: 30, date: new Date().toISOString(), wave: 1 }
];

const sanitizeEntry = (entry: Partial<LeaderboardEntry> | null | undefined): LeaderboardEntry | null => {
  if (!entry || typeof entry.name !== 'string' || typeof entry.score !== 'number') {
    return null;
  }

  return {
    name: entry.name.trim().substring(0, 15).toUpperCase(),
    score: Math.max(0, Math.floor(entry.score)),
    wave: typeof entry.wave === 'number' ? Math.max(1, Math.floor(entry.wave)) : 1,
    date: entry.date || new Date().toISOString()
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
    return Array.isArray(parsed) ? dedupeAndSort(parsed, LOCAL_ARCHIVE_LIMIT) : [];
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

export const getScores = async (): Promise<LeaderboardEntry[]> => {
  const localArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const offlineTop = readStoredScores(STORAGE_KEYS.OFFLINE_SCORES);

  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        const mergedFallback = dedupeAndSort([...localArchive, ...offlineTop, ...DEFAULT_SCORES], MAX_SCORES);
        writeStoredScores(STORAGE_KEYS.OFFLINE_SCORES, mergedFallback);
        return mergedFallback;
      }

      throw new Error("Failed to fetch from Pantry");
    }

    const data = await response.json();
    const remoteScores = Array.isArray(data.scores) ? data.scores : [];
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

export const saveScore = async (name: string, score: number, wave: number): Promise<LeaderboardEntry[]> => {
  const newEntry: LeaderboardEntry = {
    name: name.trim().substring(0, 15).toUpperCase(),
    score,
    wave,
    date: new Date().toISOString()
  };

  const currentLocalArchive = readStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE);
  const nextLocalArchive = mergeScores(currentLocalArchive, [newEntry], DEFAULT_SCORES);
  writeStoredScores(STORAGE_KEYS.LOCAL_LEADERBOARD_ARCHIVE, nextLocalArchive.slice(0, LOCAL_ARCHIVE_LIMIT));

  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const remoteScores = response.ok ? (await response.json()).scores || [] : [];
    const mergedScores = mergeScores(remoteScores, nextLocalArchive, DEFAULT_SCORES);
    const topScores = mergedScores.slice(0, MAX_SCORES);

    await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: topScores })
    });

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
