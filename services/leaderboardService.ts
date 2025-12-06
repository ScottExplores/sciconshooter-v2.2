
import { LeaderboardEntry } from '../types';

const BIN_ID = "6930c9c9ae596e708f81d80b";
const API_KEY = "$2a$10$rajKaU1bi5IW2RqR4LHhKOn7q/qrwTI3JAC2kIKOnJxlNKVme9Tle";
const BASE_URL = "https://api.jsonbin.io/v3/b";

// Default values so the board is never empty
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

// 1. FETCH SCORES
export const getScores = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (!response.ok) throw new Error("Failed to fetch");
    
    const data = await response.json();
    let fetchedScores = data.record.scores || [];

    // --- CLEANUP LOGIC ---
    // Remove "Stale" defaults (Scott 5000, Base 4000) if they exist from previous DB state
    fetchedScores = fetchedScores.filter((s: LeaderboardEntry) => {
        const isStaleScott = s.name === 'SCOTT' && s.score === 5000;
        const isStaleBase = s.name === 'BASE' && s.score === 4000;
        const isStaleGuest = s.name === 'GUEST' && s.score === 1000;
        return !isStaleScott && !isStaleBase && !isStaleGuest;
    });

    // --- MERGE LOGIC ---
    // We want to fill the board up to 25 spots with defaults if needed.
    // Also, we don't want to duplicate defaults if they are already saved.
    
    const mergedScores = [...fetchedScores];
    
    DEFAULT_SCORES.forEach(def => {
        // Check if this specific default is already in the fetched scores
        const exists = mergedScores.some(s => s.name === def.name && s.score === def.score);
        if (!exists) {
            mergedScores.push(def);
        }
    });

    // Sort Descending
    mergedScores.sort((a, b) => b.score - a.score);

    // Return Top 25
    return mergedScores.slice(0, 25);

  } catch (error) {
    console.error("Leaderboard error:", error);
    // Fallback to local storage if API fails
    const local = localStorage.getItem('offline_scores');
    return local ? JSON.parse(local) : DEFAULT_SCORES;
  }
};

// 2. SAVE SCORE
export const saveScore = async (name: string, score: number, wave: number): Promise<LeaderboardEntry[]> => {
  try {
    // Step A: Get current scores (cleaned and merged via getScores)
    const currentScores = await getScores();
    
    // Step B: Add new score
    const newEntry = { name, score, wave, date: new Date().toISOString() };
    const updatedScores = [...currentScores, newEntry];
    
    // Step C: Sort (High to Low) and Keep Top 25
    updatedScores.sort((a, b) => b.score - a.score);
    const top25 = updatedScores.slice(0, 25);
    
    // Step D: Save back to Cloud (JSONBin)
    // This overwrites the bin with the "clean" list, permanently fixing any old bad data
    await fetch(`${BASE_URL}/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify({ scores: top25 })
    });

    // Step E: Save backup to LocalStorage
    localStorage.setItem('offline_scores', JSON.stringify(top25));
    
    return top25;
  } catch (error) {
    console.error("Save error:", error);
    return [];
  }
};
