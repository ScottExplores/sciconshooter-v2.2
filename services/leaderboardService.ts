
import { LeaderboardEntry } from '../types';
import { PANTRY_CONFIG } from '../constants';

const BASE_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_CONFIG.ID}/basket/${PANTRY_CONFIG.BASKET_NAME}`;

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
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
        if (response.status === 404) {
             // Basket doesn't exist yet, return defaults
             return DEFAULT_SCORES;
        }
        throw new Error("Failed to fetch from Pantry");
    }
    
    const data = await response.json();
    let fetchedScores = data.scores || [];

    // --- MERGE LOGIC ---
    const mergedScores = [...fetchedScores];
    
    DEFAULT_SCORES.forEach(def => {
        const exists = mergedScores.some(s => s.name === def.name && s.score === def.score);
        if (!exists) {
            mergedScores.push(def);
        }
    });

    mergedScores.sort((a, b) => b.score - a.score);
    return mergedScores.slice(0, 25);

  } catch (error) {
    console.error("Leaderboard error:", error);
    const local = localStorage.getItem('offline_scores');
    return local ? JSON.parse(local) : DEFAULT_SCORES;
  }
};

// 2. SAVE SCORE
export const saveScore = async (name: string, score: number, wave: number): Promise<LeaderboardEntry[]> => {
  try {
    const currentScores = await getScores();
    
    const newEntry = { name, score, wave, date: new Date().toISOString() };
    const updatedScores = [...currentScores, newEntry];
    
    updatedScores.sort((a, b) => b.score - a.score);
    const top25 = updatedScores.slice(0, 25);
    
    // Pantry POST creates/replaces the entire basket content if we send the full object
    await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores: top25 })
    });

    localStorage.setItem('offline_scores', JSON.stringify(top25));
    
    return top25;
  } catch (error) {
    console.error("Save error:", error);
    return [];
  }
};
