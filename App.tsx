
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import StartScreen from './components/StartScreen';
import UIOverlay from './components/UIOverlay';
import UpgradeShop from './components/UpgradeShop';
import Tutorial from './components/Tutorial';
import { GameState, Stats, Upgrades, LeaderboardEntry } from './types';
import { audioService } from './services/audioService';
import { UPGRADE_BASE_COSTS, ASSETS, GAME_CONFIG } from './constants';
import { getScores, saveScore } from './services/leaderboardService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameId, setGameId] = useState<number>(0); // key to force re-mount
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  
  // Lifted state for Lab Glow to ensure it only happens once per session
  const [showLabGlow, setShowLabGlow] = useState<boolean>(true);

  // Initialize Leaderboard (Global)
  useEffect(() => {
    const fetchScores = async () => {
        // Prevent flashing: Only show loading if we genuinely have no data to show
        const alreadyHasData = leaderboard.length > 0;
        
        if (!alreadyHasData) {
            setLoadingLeaderboard(true);
        }

        try {
            const scores = await getScores();
            // Only update if we received valid data
            if (scores && scores.length > 0) {
                setLeaderboard(scores);
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            // Only turn off loading if we were the ones who turned it on
            if (!alreadyHasData) {
                setLoadingLeaderboard(false);
            }
        }
    };
    
    // Fetch when entering Menu or Game Over screens
    if (gameState === GameState.MENU || gameState === GameState.GAMEOVER) {
        fetchScores();
    }
  }, [gameState]); // Keeping explicit deps to ensure fetch triggers correctly on state change

  const [stats, setStats] = useState<Stats>({
    score: 0,
    highScore: parseInt(localStorage.getItem('rh_highscore') || '0'), // Keep personal highscore local
    wave: 1,
    coins: 0,
    totalCoins: 0,
    enemiesDefeated: 0,
    lives: 3,
    repairsCount: 0,
    upgrades: {
      fireRate: 0,
      speed: 0,
      missile: 0
    },
    bossProgress: 0,
    isBossActive: false,
    bossHp: 0,
    bossMaxHp: 100
  });

  const startGame = () => {
    audioService.init();
    setStats(prev => ({ 
        ...prev, 
        score: 0, 
        wave: 1, 
        coins: 0, 
        totalCoins: 0,
        enemiesDefeated: 0,
        lives: 3, 
        repairsCount: 0,
        upgrades: { fireRate: 0, speed: 0, missile: 0 },
        bossProgress: 0,
        isBossActive: false,
        bossHp: 0,
        bossMaxHp: 100
    }));
    setShowNameInput(false);
    setPlayerNameInput('');
    setIsSubmittingScore(false);
    setGameId(prev => prev + 1); 
    setGameState(GameState.TUTORIAL);
  };

  const handleTutorialComplete = () => {
    setGameState(GameState.PLAYING);
  };

  const resetGame = () => {
    setGameState(GameState.MENU);
  };

  const handleUpgrade = (type: keyof Upgrades | 'repair') => {
    if (type === 'repair') {
       // Repair Cost: Base 10 + (RepairsCount * 5)
       const currentRepairs = stats.repairsCount || 0;
       const cost = UPGRADE_BASE_COSTS.repair + (currentRepairs * 5);

       if (stats.coins >= cost) {
         audioService.playSound('powerup');
         setStats(prev => ({
            ...prev,
            coins: prev.coins - cost,
            lives: prev.lives + 1, // NO CAP on lives
            repairsCount: (prev.repairsCount || 0) + 1
         }));
       }
       return;
    }

    const currentLevel = stats.upgrades[type];
    const cost = UPGRADE_BASE_COSTS[type] + (5 * (Math.pow(2, currentLevel) - 1));

    if (stats.coins >= cost && currentLevel < 5) {
        audioService.playSound('coin'); 
        setStats(prev => ({
            ...prev,
            coins: prev.coins - cost,
            upgrades: {
                ...prev.upgrades,
                [type]: prev.upgrades[type] + 1
            }
        }));
    }
  };

  const handleDeposit = (amount: number) => {
    setStats(prev => ({
        ...prev,
        coins: prev.coins + amount
    }));
    audioService.playSound('coin');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        if (gameState === GameState.PLAYING) {
           setGameState(GameState.SHOP);
        } else if (gameState === GameState.SHOP) {
           setGameState(GameState.PLAYING);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Over Logic - Check Global Leaderboard
  useEffect(() => {
    if (gameState === GameState.GAMEOVER) {
      if (stats.score > stats.highScore) {
        localStorage.setItem('rh_highscore', stats.score.toString());
        setStats(s => ({...s, highScore: s.score}));
      }
      
      const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
      // Logic: If leaderboard has < 25 entries OR score >= 25th place
      const lowestScore = sorted.length < 25 ? 0 : sorted[Math.min(sorted.length - 1, 24)].score;
      
      if (stats.score > 0 && (sorted.length < 25 || stats.score >= lowestScore)) {
          setShowNameInput(true);
      }
    }
  }, [gameState, stats.score, leaderboard]);

  const submitScore = async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Prevent double submission
      if (!playerNameInput.trim() || isSubmittingScore) return;
      
      setIsSubmittingScore(true);
      
      const name = playerNameInput.trim().substring(0, 15).toUpperCase();
      const score = stats.score;
      const wave = stats.wave;

      // Optimistic update locally
      // This populates 'leaderboard' immediately so the Menu check (leaderboard.length === 0) fails
      // and skips the "Scanning Archive..." loading state.
      const newEntry: LeaderboardEntry = { name, score, wave };
      const optimisticList = [...leaderboard, newEntry].sort((a,b) => b.score - a.score).slice(0, 25);
      setLeaderboard(optimisticList);
      
      try {
        await saveScore(name, score, wave);
      } catch (error) {
        console.error("Score submission error", error);
      }
      
      // Reset flags and go to Menu
      setIsSubmittingScore(false);
      setShowNameInput(false);
      setGameState(GameState.MENU);
  };

  const getPubStatus = (score: number) => {
    if (score < 500) return { title: "DESK REJECTED", color: "text-red-500", desc: "Try adding more novelty." };
    if (score < 1500) return { title: "UNDER REVIEW", color: "text-yellow-400", desc: "Reviewer #2 has some notes." };
    if (score < 3000) return { title: "ACCEPTED W/ REVISIONS", color: "text-blue-400", desc: "So close to the cover." };
    return { title: "NATURE COVER", color: "text-purple-400", desc: "Scientific breakthrough!" };
  };

  const pubStatus = getPubStatus(stats.score);

  return (
    <div className="relative w-full h-full bg-[#0b1020] select-none">
      
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED || gameState === GameState.GAMEOVER || gameState === GameState.SHOP || gameState === GameState.TUTORIAL) && (
        <GameCanvas 
           key={gameId}
           stats={stats} 
           setStats={setStats} 
           setGameState={setGameState}
           gameState={gameState}
        />
      )}

      {gameState === GameState.TUTORIAL && (
         <Tutorial onReady={handleTutorialComplete} />
      )}

      {(gameState === GameState.PLAYING) && (
        <UIOverlay 
            stats={stats} 
            setGameState={setGameState} 
            lives={stats.lives}
            showLabGlow={showLabGlow}
            onDisableLabGlow={() => setShowLabGlow(false)}
        />
      )}

      {gameState === GameState.MENU && (
        <StartScreen 
            onStart={startGame} 
            onAbout={() => setGameState(GameState.ABOUT)} 
            leaderboard={leaderboard} 
            isLoading={loadingLeaderboard}
        />
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm p-1">
             <div className="scicon-border-container"></div>
             <div className="scicon-inner-bg"></div>
             <div className="scicon-node node-tl-1"></div>
             <div className="scicon-node node-tr-1"></div>
             <div className="scicon-node node-bl-1"></div>
             <div className="scicon-node node-br-1"></div>

             <div className="relative z-10 p-8 text-center space-y-6">
                <h2 className="text-3xl font-bold text-white arcade-font tracking-widest text-shadow-neon">PAUSED</h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => setGameState(GameState.PLAYING)}
                    className="scicon-btn w-full py-3 text-sm font-bold"
                  >
                    RESUME
                  </button>
                  <button 
                    onClick={resetGame}
                    className="scicon-btn scicon-btn-secondary w-full py-3 text-sm font-bold text-gray-300"
                  >
                    QUIT
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {gameState === GameState.SHOP && (
        <UpgradeShop 
            stats={stats} 
            onUpgrade={handleUpgrade} 
            onDeposit={handleDeposit}
            onClose={() => setGameState(GameState.PLAYING)} 
            gameId={gameId}
        />
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md animate-bounce-in p-1 max-h-[95vh] flex flex-col">
             <div className="scicon-border-container"></div>
             <div className="scicon-inner-bg"></div>
             <div className="scicon-node node-tl-1"></div>
             <div className="scicon-node node-tr-1"></div>
             <div className="scicon-node node-bl-1"></div>
             <div className="scicon-node node-br-1"></div>
             
             <div className="relative z-10 p-6 text-center space-y-4 overflow-y-auto custom-scrollbar">
                
                {showNameInput ? (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-yellow-400 arcade-font tracking-widest animate-pulse">NEW HIGH SCORE!</h2>
                        <div className="text-4xl text-white font-bold">{stats.score}</div>
                        <p className="text-sm text-gray-300 font-mono">ENTER YOUR NAME:</p>
                        
                        {/* Wrapped in Form for better submit handling */}
                        <form onSubmit={submitScore} className="space-y-4">
                            <input 
                                type="text" 
                                maxLength={15} 
                                value={playerNameInput}
                                onChange={(e) => setPlayerNameInput(e.target.value.toUpperCase())}
                                className="bg-black/50 border border-indigo-500 text-center text-white text-xl p-2 w-full uppercase font-mono focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                                placeholder="NAME"
                                autoFocus
                                disabled={isSubmittingScore}
                            />
                             <button 
                                type="submit"
                                disabled={!playerNameInput || isSubmittingScore}
                                className={`scicon-btn w-full py-3 text-lg font-bold ${isSubmittingScore ? 'opacity-70 cursor-wait' : ''}`}
                              >
                                {isSubmittingScore ? 'TRANSMITTING...' : 'SUBMIT RECORD'}
                              </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div>
                          <h2 className={`text-3xl font-black ${pubStatus.color} arcade-font tracking-widest mb-1`}>{pubStatus.title}</h2>
                          <p className="text-gray-400 text-sm font-mono uppercase">{pubStatus.desc}</p>
                        </div>

                        <div className="bg-white/5 p-4 rounded border border-white/10">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-gray-400">SCORE</span>
                             <span className="text-2xl font-bold text-white">{stats.score}</span>
                           </div>
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-gray-400">WAVE</span>
                             <span className="text-xl font-bold text-indigo-400">{stats.wave}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-gray-400">HIGH SCORE</span>
                             <span className="text-xl font-bold text-yellow-400">{Math.max(stats.score, stats.highScore)}</span>
                           </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button 
                                onClick={startGame}
                                className="scicon-btn w-full py-4 text-xl font-bold animate-pulse"
                            >
                                RETRY MISSION
                            </button>
                            <button 
                                onClick={() => setGameState(GameState.MENU)}
                                className="scicon-btn scicon-btn-secondary w-full py-3 text-sm font-bold text-gray-400"
                            >
                                MAIN MENU
                            </button>
                        </div>
                    </>
                )}
             </div>
          </div>
        </div>
      )}

      {gameState === GameState.ABOUT && (
        <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg p-1 max-h-[90vh] flex flex-col">
             <div className="scicon-border-container"></div>
             <div className="scicon-inner-bg"></div>
             <div className="scicon-node node-tl-1"></div>
             <div className="scicon-node node-tr-1"></div>
             <div className="scicon-node node-bl-1"></div>
             <div className="scicon-node node-br-1"></div>

             <div className="relative z-10 p-6 space-y-6 text-center overflow-y-auto custom-scrollbar">
                <h2 className="text-3xl font-black text-white arcade-font tracking-widest">MISSION BRIEFING</h2>
                
                <div className="space-y-4 text-left text-gray-300 text-sm leading-relaxed font-mono">
                   <p>
                     <strong className="text-indigo-400">OBJECTIVE:</strong> Navigate the treacherous landscape of academic publishing. Pilot the <span className="text-white">Research Flask</span> and protect your manuscript from predatory journals and paywalls.
                   </p>
                   <p>
                     <strong className="text-indigo-400">ENEMIES:</strong>
                     <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
                        <li><span className="text-red-400">Predatory Journals (Red):</span> Fast, aggressive, and relentless.</li>
                        <li><span className="text-yellow-500">Bureaucracy Bricks (Orange):</span> Slow moving obstacles that block progress.</li>
                        <li><span className="text-green-500">Misinformation Swarms (Green):</span> Weak individually but deadly in numbers.</li>
                        <li><span className="text-red-600 font-bold">THE GATEKEEPER:</span> A massive boss that guards the path to publication.</li>
                     </ul>
                   </p>
                   <p>
                     <strong className="text-indigo-400">RESOURCES:</strong>
                     <ul className="list-disc list-inside mt-1 space-y-1 pl-2">
                        <li><span className="text-yellow-300">RSC Tokens:</span> Collect to fund research upgrades.</li>
                        <li><span className="text-purple-400">Founders:</span> Special power-ups (Shields, Multi-shot, Magnets).</li>
                     </ul>
                   </p>
                   <p className="text-xs text-gray-500 italic mt-4 border-t border-gray-700 pt-2">
                      "Science is a battlefield. Publish or Perish."
                   </p>
                </div>

                <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="scicon-btn w-full py-3 text-lg font-bold"
                >
                    ACKNOWLEDGED
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
