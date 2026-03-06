import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import GameCanvas from './components/GameCanvas';
import StartScreen from './components/StartScreen';
import UIOverlay from './components/UIOverlay';
import UpgradeShop from './components/UpgradeShop';
import Tutorial from './components/Tutorial';
import SupportPanel from './components/SupportPanel';
import { DonationStatus, GameState, LeaderboardEntry, MiniAppState, Stats, Upgrades, WalletSession } from './types';
import { audioService } from './services/audioService';
import { ASSETS, DONATION_CONFIG, STORAGE_KEYS, UPGRADE_BASE_COSTS } from './constants';
import { getScores, saveScore } from './services/leaderboardService';
import { miniAppService } from './services/miniAppService';

const RSC_ABI = [
  "function transfer(address to, uint amount) returns (bool)"
];

const defaultWalletState: WalletSession = {
  address: null,
  chainId: null,
  status: 'idle',
  error: ''
};

const defaultMiniAppState: MiniAppState = {
  isMiniApp: false,
  clientFid: null,
  added: false,
  userFid: null,
  platformType: null
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameId, setGameId] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [showLabGlow, setShowLabGlow] = useState<boolean>(true);
  const [wallet, setWallet] = useState<WalletSession>(defaultWalletState);
  const [miniApp, setMiniApp] = useState<MiniAppState>(defaultMiniAppState);
  const [donationStatus, setDonationStatus] = useState<DonationStatus>('idle');
  const [donationHash, setDonationHash] = useState<string>('');
  const [donationError, setDonationError] = useState<string>('');

  useEffect(() => {
    const fetchScores = async () => {
      const alreadyHasData = leaderboard.length > 0;
      if (!alreadyHasData) {
        setLoadingLeaderboard(true);
      }

      try {
        const scores = await getScores();
        if (scores && scores.length > 0) {
          setLeaderboard(scores);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        if (!alreadyHasData) {
          setLoadingLeaderboard(false);
        }
      }
    };

    if (gameState === GameState.MENU || gameState === GameState.GAMEOVER) {
      fetchScores();
    }
  }, [gameState]);

  const getInitialStats = (): Stats => {
    const savedStats = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats);
        return {
          ...parsed,
          score: 0,
          wave: 1,
          coins: parsed.coins || 0,
          enemiesDefeated: 0,
          lives: 3,
          repairsCount: 0,
          bossProgress: 0,
          isBossActive: false,
          bossHp: 0,
          bossMaxHp: 100
        };
      } catch (e) {
        console.error("Failed to parse saved stats", e);
      }
    }

    return {
      score: 0,
      highScore: parseInt(localStorage.getItem(STORAGE_KEYS.HIGH_SCORE) || '0'),
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
    };
  };

  const [stats, setStats] = useState<Stats>(getInitialStats());

  useEffect(() => {
    const statsToSave = {
      highScore: stats.highScore,
      coins: stats.coins,
      totalCoins: stats.totalCoins,
      upgrades: stats.upgrades
    };
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(statsToSave));
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, stats.highScore.toString());
  }, [stats.highScore, stats.coins, stats.totalCoins, stats.upgrades]);

  const syncWallet = async (runtime: MiniAppState = miniApp) => {
    const ethereum = await miniAppService.getEthereumProvider();
    if (!ethereum) {
      setWallet(prev => ({
        ...prev,
        address: null,
        chainId: null,
        status: 'idle',
        error: runtime.isMiniApp ? 'Open this from the Base app to use the embedded wallet.' : prev.error
      }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(ethereum as any);
      const accounts = await provider.send('eth_accounts', []);
      const network = await provider.getNetwork();

      if (accounts.length > 0) {
        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);
        setWallet({
          address: accounts[0],
          chainId: Number(network.chainId),
          status: 'connected',
          error: ''
        });
        return;
      }

      localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
      setWallet({
        address: null,
        chainId: Number(network.chainId),
        status: 'idle',
        error: runtime.isMiniApp ? 'Wallet access should come from the host mini app client.' : ''
      });
    } catch (error) {
      console.error("Wallet sync failed", error);
    }
  };

  useEffect(() => {
    let active = true;

    const setupMiniApp = async () => {
      const state = await miniAppService.getState();
      if (!active) return;

      setMiniApp(state);
      if (state.isMiniApp) {
        await miniAppService.ready();
      }

      await syncWallet(state);

      const injected = (window as any).ethereum;
      if (!injected) {
        return;
      }

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
          setWallet(prev => ({
            ...prev,
            address: null,
            status: 'idle',
            error: state.isMiniApp ? 'Wallet access should come from the host mini app client.' : ''
          }));
          return;
        }

        localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);
        setWallet(prev => ({
          ...prev,
          address: accounts[0],
          status: 'connected',
          error: ''
        }));
      };

      const handleChainChanged = (chainIdHex: string) => {
        const chainId = Number.parseInt(chainIdHex, 16);
        setWallet(prev => ({
          ...prev,
          chainId,
          status: prev.address ? 'connected' : 'idle'
        }));
      };

      injected.on?.('accountsChanged', handleAccountsChanged);
      injected.on?.('chainChanged', handleChainChanged);

      return () => {
        injected.removeListener?.('accountsChanged', handleAccountsChanged);
        injected.removeListener?.('chainChanged', handleChainChanged);
      };
    };

    let cleanup: (() => void) | undefined;
    setupMiniApp().then((dispose) => {
      cleanup = dispose;
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  const startGame = () => {
    audioService.init();
    setStats(prev => ({
      ...prev,
      score: 0,
      wave: 1,
      coins: 0,
      enemiesDefeated: 0,
      lives: 3,
      repairsCount: 0,
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
      const currentRepairs = stats.repairsCount || 0;
      const cost = UPGRADE_BASE_COSTS.repair + (currentRepairs * 5);

      if (stats.coins >= cost) {
        audioService.playSound('powerup');
        setStats(prev => ({
          ...prev,
          coins: prev.coins - cost,
          lives: prev.lives + 1,
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

  const switchToBase = async (provider: ethers.BrowserProvider) => {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: DONATION_CONFIG.BASE_CHAIN_ID_HEX }]);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await provider.send("wallet_addEthereumChain", [{
          chainId: DONATION_CONFIG.BASE_CHAIN_ID_HEX,
          chainName: 'Base Mainnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: [DONATION_CONFIG.EXPLORER_BASE_URL]
        }]);
        return;
      }

      throw switchError;
    }
  };

  const connectWallet = async () => {
    const ethereum = await miniAppService.getEthereumProvider();
    if (!ethereum) {
      setWallet({
        address: null,
        chainId: null,
        status: 'error',
        error: miniApp.isMiniApp ? 'Open this inside the Base app to access the mini app wallet.' : 'Install a wallet with Base support to connect.'
      });
      return;
    }

    if (miniApp.isMiniApp) {
      await syncWallet(miniApp);
      return;
    }

    setWallet(prev => ({ ...prev, status: 'connecting', error: '' }));

    try {
      const provider = new ethers.BrowserProvider(ethereum as any);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, accounts[0]);
      setWallet({
        address: accounts[0],
        chainId: Number(network.chainId),
        status: 'connected',
        error: ''
      });
    } catch (error: any) {
      const message = error?.message?.includes('user rejected') ? 'Wallet connection was cancelled.' : 'Wallet connection failed.';
      setWallet({
        address: null,
        chainId: null,
        status: 'error',
        error: message
      });
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    setWallet(defaultWalletState);
    setDonationStatus('idle');
    setDonationHash('');
    setDonationError('');
  };

  const donateRsc = async (amount: number) => {
    const ethereum = await miniAppService.getEthereumProvider();
    if (!ethereum) {
      setDonationStatus('error');
      setDonationError('No wallet detected.');
      return;
    }

    if (!wallet.address) {
      await connectWallet();
      return;
    }

    setDonationStatus('processing');
    setDonationHash('');
    setDonationError('');

    try {
      const provider = new ethers.BrowserProvider(ethereum as any);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== 8453) {
        setDonationStatus('switching_network');
        await switchToBase(provider);
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(DONATION_CONFIG.RSC_CONTRACT_ADDRESS, RSC_ABI, signer);

      setDonationStatus('processing');
      const tx = await contract.transfer(
        DONATION_CONFIG.RECIPIENT_ADDRESS,
        ethers.parseUnits(amount.toString(), 18)
      );

      setDonationHash(tx.hash);
      setDonationStatus('confirming');

      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        throw new Error('Donation transaction reverted.');
      }

      const latestNetwork = await provider.getNetwork();
      setWallet(prev => ({
        ...prev,
        chainId: Number(latestNetwork.chainId),
        status: prev.address ? 'connected' : prev.status
      }));
      setDonationStatus('success');
      setTimeout(() => {
        setDonationStatus('idle');
        setDonationHash('');
      }, 5000);
    } catch (error: any) {
      console.error("Donation error", error);
      const message = error?.message?.includes('user rejected')
        ? 'Donation cancelled.'
        : error?.message?.includes('insufficient funds')
          ? 'Not enough RSC or gas for that donation.'
          : 'Donation failed.';
      setDonationStatus('error');
      setDonationError(message);
    }
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

  useEffect(() => {
    if (gameState === GameState.GAMEOVER) {
      if (stats.score > stats.highScore) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, stats.score.toString());
        setStats(s => ({ ...s, highScore: s.score }));
      }

      const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
      const lowestScore = sorted.length < 25 ? 0 : sorted[Math.min(sorted.length - 1, 24)].score;

      if (stats.score > 0 && (sorted.length < 25 || stats.score >= lowestScore)) {
        setShowNameInput(true);
      }
    }
  }, [gameState, stats.score, stats.highScore, leaderboard]);

  const submitScore = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!playerNameInput.trim() || isSubmittingScore) return;

    setIsSubmittingScore(true);

    const name = playerNameInput.trim().substring(0, 15).toUpperCase();
    const score = stats.score;
    const wave = stats.wave;

    const newEntry: LeaderboardEntry = { name, score, wave };
    const optimisticList = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 25);
    setLeaderboard(optimisticList);

    try {
      const updatedScores = await saveScore(name, score, wave);
      if (updatedScores.length > 0) {
        setLeaderboard(updatedScores);
      }
    } catch (error) {
      console.error("Score submission error", error);
    }

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

  const openReferral = async () => {
    await miniAppService.openUrl(ASSETS.REFERRAL_LINK);
  };

  const pubStatus = getPubStatus(stats.score);

  return (
    <div className="relative h-full w-full select-none bg-[#0b1020]">
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

      {gameState === GameState.PLAYING && (
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
          wallet={wallet}
          miniApp={miniApp}
          donationStatus={donationStatus}
          donationHash={donationHash}
          donationError={donationError}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          onDonate={donateRsc}
          onOpenReferral={openReferral}
        />
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-1">
            <div className="scicon-border-container"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 space-y-6 p-8 text-center">
              <h2 className="arcade-font text-3xl font-bold tracking-widest text-white text-shadow-neon">PAUSED</h2>
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
          wallet={wallet}
          miniApp={miniApp}
          onUpgrade={handleUpgrade}
          onDeposit={handleDeposit}
          onClose={() => setGameState(GameState.PLAYING)}
          onConnectWallet={connectWallet}
          gameId={gameId}
        />
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[95vh] w-full max-w-md flex-col p-1 animate-bounce-in">
            <div className="scicon-border-container"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 space-y-4 overflow-y-auto p-6 text-center custom-scrollbar">
              {showNameInput ? (
                <div className="space-y-4">
                  <h2 className="arcade-font animate-pulse text-2xl font-black tracking-widest text-yellow-400">NEW HIGH SCORE!</h2>
                  <div className="text-4xl font-bold text-white">{stats.score}</div>
                  <p className="font-mono text-sm text-gray-300">ENTER YOUR NAME:</p>

                  <form onSubmit={submitScore} className="space-y-4">
                    <input
                      type="text"
                      maxLength={15}
                      value={playerNameInput}
                      onChange={(e) => setPlayerNameInput(e.target.value.toUpperCase())}
                      className="w-full border border-indigo-500 bg-black/50 p-2 text-center font-mono text-xl uppercase text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
                      placeholder="NAME"
                      autoFocus
                      disabled={isSubmittingScore}
                    />
                    <button
                      type="submit"
                      disabled={!playerNameInput || isSubmittingScore}
                      className={`scicon-btn w-full py-3 text-lg font-bold ${isSubmittingScore ? 'cursor-wait opacity-70' : ''}`}
                    >
                      {isSubmittingScore ? 'TRANSMITTING...' : 'SUBMIT RECORD'}
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className={`arcade-font mb-1 text-3xl font-black tracking-widest ${pubStatus.color}`}>{pubStatus.title}</h2>
                    <p className="font-mono text-sm uppercase text-gray-400">{pubStatus.desc}</p>
                  </div>

                  <div className="rounded border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-gray-400">SCORE</span>
                      <span className="text-2xl font-bold text-white">{stats.score}</span>
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-gray-400">WAVE</span>
                      <span className="text-xl font-bold text-indigo-400">{stats.wave}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">HIGH SCORE</span>
                      <span className="text-xl font-bold text-yellow-400">{Math.max(stats.score, stats.highScore)}</span>
                    </div>
                  </div>

                  <SupportPanel
                    wallet={wallet}
                    isMiniApp={miniApp.isMiniApp}
                    donationStatus={donationStatus}
                    donationHash={donationHash}
                    donationError={donationError}
                    onConnect={connectWallet}
                    onDisconnect={disconnectWallet}
                    onDonate={donateRsc}
                    compact
                  />

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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col p-1">
            <div className="scicon-border-container"></div>
            <div className="scicon-inner-bg"></div>
            <div className="scicon-node node-tl-1"></div>
            <div className="scicon-node node-tr-1"></div>
            <div className="scicon-node node-bl-1"></div>
            <div className="scicon-node node-br-1"></div>

            <div className="relative z-10 space-y-6 overflow-y-auto p-6 text-center custom-scrollbar">
              <h2 className="arcade-font text-3xl font-black tracking-widest text-white">MISSION BRIEFING</h2>

              <div className="space-y-4 text-left font-mono text-sm leading-relaxed text-gray-300">
                <p>
                  <strong className="text-indigo-400">OBJECTIVE:</strong> Navigate the treacherous landscape of academic publishing. Pilot the <span className="text-white">Research Flask</span> and protect your manuscript from predatory journals and paywalls.
                </p>
                <div>
                  <strong className="text-indigo-400">ENEMIES:</strong>
                  <ul className="mt-1 list-inside list-disc space-y-1 pl-2">
                    <li><span className="text-red-400">Predatory Journals:</span> Fast, aggressive, and relentless.</li>
                    <li><span className="text-yellow-500">Bureaucracy Bricks:</span> Heavy moving obstacles that clog the lane.</li>
                    <li><span className="text-green-500">Misinformation Swarms:</span> Weak individually but deadly in numbers.</li>
                    <li><span className="font-bold text-red-600">THE GATEKEEPER:</span> A towering boss that guards the path to publication.</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-indigo-400">RESOURCES:</strong>
                  <ul className="mt-1 list-inside list-disc space-y-1 pl-2">
                    <li><span className="text-yellow-300">RSC Tokens:</span> Collect them during the mission, then spend them in the lab.</li>
                    <li><span className="text-cyan-300">Wallet Donations:</span> Optional support only. They do not buy gameplay upgrades.</li>
                    <li><span className="text-purple-400">Founders:</span> Special power-ups like shields, spread fire, and magnets.</li>
                  </ul>
                </div>
                <p className="mt-4 border-t border-gray-700 pt-2 text-xs italic text-gray-500">
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
