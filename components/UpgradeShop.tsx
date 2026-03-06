import React, { useState } from 'react';
import { MiniAppState, Stats, Upgrades, WalletSession } from '../types';
import { UPGRADE_BASE_COSTS, ASSETS } from '../constants';

interface UpgradeShopProps {
  stats: Stats;
  wallet: WalletSession;
  miniApp: MiniAppState;
  onUpgrade: (type: keyof Upgrades | 'repair') => void;
  onDeposit: (coins: number) => void;
  onClose: () => void;
  onConnectWallet: () => void;
  gameId: number;
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const UpgradeShop: React.FC<UpgradeShopProps> = ({
  stats,
  wallet,
  miniApp,
  onUpgrade,
  onDeposit,
  onClose,
  onConnectWallet,
  gameId
}) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === "EXPLORES") {
      const storageKey = `scicon_promo_explores_${gameId}`;
      if (sessionStorage.getItem(storageKey)) {
        setPromoMessage({ text: "ALREADY REDEEMED THIS MISSION", type: 'error' });
        setTimeout(() => setPromoMessage(null), 2000);
        return;
      }

      onDeposit(100);
      sessionStorage.setItem(storageKey, "true");
      setPromoMessage({ text: "ACCESS GRANTED: +100 COINS", type: 'success' });
      setPromoCode("");
      setTimeout(() => setPromoMessage(null), 3000);
      return;
    }

    if (code === "HUMANITY") {
      onDeposit(1000);
      setPromoMessage({ text: "HUMANITY FUNDING: +1000 COINS", type: 'success' });
      setPromoCode("");
      setTimeout(() => setPromoMessage(null), 3000);
      return;
    }

    setPromoMessage({ text: "INVALID ACCESS CODE", type: 'error' });
    setTimeout(() => setPromoMessage(null), 2000);
  };

  const getCost = (type: keyof Upgrades) => {
    const level = stats.upgrades[type];
    return UPGRADE_BASE_COSTS[type] + (5 * (Math.pow(2, level) - 1));
  };

  const getRepairCost = () => {
    const repairs = stats.repairsCount || 0;
    return UPGRADE_BASE_COSTS.repair + (repairs * 5);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[95vh] w-full max-w-3xl flex-col p-1">
        <div className="scicon-border-container"></div>
        <div className="scicon-inner-bg"></div>
        <div className="scicon-node node-tl-1"></div>
        <div className="scicon-node node-tl-2"></div>
        <div className="scicon-node node-tr-1"></div>
        <div className="scicon-node node-tr-2"></div>
        <div className="scicon-node node-bl-1"></div>
        <div className="scicon-node node-bl-2"></div>
        <div className="scicon-node node-br-1"></div>
        <div className="scicon-node node-br-2"></div>

        <div className="relative z-10 flex flex-col overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="mb-6 flex flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <img src={ASSETS.REAL_RSC_ICON} className="h-16 w-16 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] md:h-20 md:w-20" alt="Research Coin" />
              <div>
                <h2 className="arcade-font text-3xl font-black leading-none tracking-widest text-white text-shadow-neon md:text-4xl">LABORATORY</h2>
                <p className="mt-1 text-xs font-mono uppercase tracking-wider text-indigo-400">Upgrade your ship with mission-earned RSC</p>
              </div>
            </div>

            <div className="hidden min-w-[150px] flex-col items-end rounded border border-indigo-500/30 bg-indigo-900/40 p-4 md:flex">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-300">Grant Balance</span>
              <div className="flex items-center justify-end gap-2">
                <img src="https://www.researchhub.com/icons/gold2.svg" className="h-6 w-6" alt="RSC" />
                <span className="font-mono text-3xl font-bold text-white">{stats.coins}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded border border-gray-700 bg-gray-900/60 p-4 shadow-inner">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold uppercase tracking-wide text-white">Simplified Spending</div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Upgrades now spend only the RSC you earn in-run. No upgrade purchase sends tokens to any wallet.
                  </p>
                </div>
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Gameplay Only
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 md:grid-cols-4">
                <div className="rounded border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Wave</div>
                  <div className="mt-1 text-lg font-bold text-white">{stats.wave}</div>
                </div>
                <div className="rounded border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Lives</div>
                  <div className="mt-1 text-lg font-bold text-white">{stats.lives}</div>
                </div>
                <div className="rounded border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Current RSC</div>
                  <div className="mt-1 text-lg font-bold text-white">{stats.coins}</div>
                </div>
                <div className="rounded border border-white/5 bg-black/40 p-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Lifetime RSC</div>
                  <div className="mt-1 text-lg font-bold text-white">{stats.totalCoins}</div>
                </div>
              </div>
            </div>

            <div className="rounded border border-cyan-500/20 bg-cyan-950/20 p-4">
              <div className="text-sm font-bold uppercase tracking-wide text-cyan-200">Wallet Status</div>
              <p className="mt-1 text-[11px] text-gray-400">
                Wallets are now optional. Connect only if you want to use the donation buttons on the menu or debrief screen.
              </p>

              <div className="mt-4 rounded border border-white/5 bg-black/40 p-3">
                {wallet.address ? (
                  <>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Connected Address</div>
                    <div className="mt-1 font-mono text-sm text-white">{shortenAddress(wallet.address)}</div>
                    <div className={`mt-2 inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${wallet.chainId === 8453 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-200'}`}>
                      {wallet.chainId === 8453 ? 'Base Ready' : 'Switch To Base To Donate'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Not Connected</div>
                    {miniApp.isMiniApp ? (
                      <div className="mt-3 text-xs text-gray-300">
                        In the mini app, wallet access is provided by the host client automatically.
                      </div>
                    ) : (
                      <button
                        onClick={onConnectWallet}
                        className="mt-3 w-full rounded border border-cyan-400/30 bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10"
                      >
                        {wallet.status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="group relative mb-6">
            <div className="absolute -inset-0.5 animate-pulse rounded bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-30 blur transition duration-1000 group-hover:opacity-75"></div>
            <div className="relative flex flex-col items-center justify-between gap-3 overflow-hidden rounded border border-indigo-500/30 bg-black/90 p-3 md:flex-row">
              <div className="absolute left-0 top-0 h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

              <div className="z-10 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-700 bg-gray-900 animate-pulse">
                  <span className="text-sm text-cyan-300">+</span>
                </div>
                <div className="text-left">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">Promo Access</h3>
                  <p className="text-[9px] uppercase text-gray-500">Enter a code for a supply drop</p>
                </div>
              </div>

              <form onSubmit={handlePromoCode} className="z-10 flex w-full items-center gap-2 md:w-auto">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoMessage(null);
                  }}
                  placeholder="ENTER CODE"
                  className="w-full rounded border border-gray-600 bg-gray-900/80 px-3 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan-300 outline-none placeholder-gray-700 focus:border-cyan-500 md:w-32"
                />
                <button
                  type="submit"
                  className="rounded border border-cyan-700/50 bg-cyan-900/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-800 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                >
                  Redeem
                </button>
              </form>

              {promoMessage ? (
                <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/90 ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="animate-bounce font-mono text-xs font-bold tracking-widest">{promoMessage.text}</span>
                  {promoMessage.type === 'success' ? <div className="absolute inset-0 animate-pulse bg-green-500/10"></div> : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="flex h-full flex-col justify-between border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10 md:p-4">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">Rapid Review</h3>
                    <p className="text-xs text-gray-500">Increases firing speed.</p>
                  </div>
                  <div className="text-2xl opacity-50">I</div>
                </div>
                <div className="mb-4 flex h-1.5 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.fireRate ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
                  ))}
                </div>
              </div>
              <button
                disabled={stats.coins < getCost('fireRate') || stats.upgrades.fireRate >= 5}
                onClick={() => onUpgrade('fireRate')}
                className={`w-full rounded border py-2 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('fireRate') && stats.upgrades.fireRate < 5 ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
              >
                {stats.upgrades.fireRate >= 5 ? 'MAX LEVEL' : `FUND (${getCost('fireRate')} RSC)`}
              </button>
            </div>

            <div className="flex h-full flex-col justify-between border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10 md:p-4">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">Velocity Grant</h3>
                    <p className="text-xs text-gray-500">Increases ship speed.</p>
                  </div>
                  <div className="text-2xl opacity-50">+</div>
                </div>
                <div className="mb-4 flex h-1.5 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.speed ? 'bg-purple-500' : 'bg-gray-800'}`}></div>
                  ))}
                </div>
              </div>
              <button
                disabled={stats.coins < getCost('speed') || stats.upgrades.speed >= 5}
                onClick={() => onUpgrade('speed')}
                className={`w-full rounded border py-2 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('speed') && stats.upgrades.speed < 5 ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
              >
                {stats.upgrades.speed >= 5 ? 'MAX LEVEL' : `FUND (${getCost('speed')} RSC)`}
              </button>
            </div>

            <div className="flex h-full flex-col justify-between border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10 md:p-4">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">Proton Missiles</h3>
                    <p className="text-xs text-gray-500">Fires homing missiles automatically.</p>
                  </div>
                  <div className="text-2xl opacity-50">M</div>
                </div>
                <div className="mb-4 flex h-1.5 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${i < stats.upgrades.missile ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                  ))}
                </div>
              </div>
              <button
                disabled={stats.coins < getCost('missile') || stats.upgrades.missile >= 5}
                onClick={() => onUpgrade('missile')}
                className={`w-full rounded border py-2 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('missile') && stats.upgrades.missile < 5 ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
              >
                {stats.upgrades.missile >= 5 ? 'MAX LEVEL' : `FUND (${getCost('missile')} RSC)`}
              </button>
            </div>

            <div className="flex h-full flex-col justify-between border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10 md:p-4">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">Emergency Aid</h3>
                    <p className="text-xs text-gray-500">Recover one life unit.</p>
                  </div>
                  <div className="text-2xl opacity-50">H</div>
                </div>
                <div className="mb-4 h-1.5 bg-transparent"></div>
              </div>
              <button
                disabled={stats.coins < getRepairCost()}
                onClick={() => onUpgrade('repair')}
                className={`w-full rounded border py-2 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getRepairCost() ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
              >
                {`ADD LIFE (${getRepairCost()} RSC)`}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="scicon-btn mt-auto w-full py-3 text-base font-bold tracking-widest md:py-4 md:text-lg"
          >
            RETURN TO MISSION
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
