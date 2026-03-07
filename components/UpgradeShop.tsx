import React, { useState } from 'react';
import { MiniAppState, Stats, Upgrades, WalletSession, DonationStatus } from '../types';
import { UPGRADE_BASE_COSTS, ASSETS, DONATION_CONFIG } from '../constants';
import LabSwapPanel from './LabSwapPanel';

interface UpgradeShopProps {
  stats: Stats;
  wallet: WalletSession;
  miniApp: MiniAppState;
  onUpgrade: (type: keyof Upgrades | 'repair') => void;
  onDeposit: (coins: number) => void;
  onClose: () => void;
  onConnectWallet: () => void;
  onBuyMissionCredits: (rscAmount: number) => void;
  onOpenSwap: () => void;
  labFundingStatus: DonationStatus;
  labFundingHash: string;
  labFundingError: string;
  isEmbeddedSwapEnabled: boolean;
  gameId: number;
}

const fundingPackages = DONATION_CONFIG.PRESET_RSC_AMOUNTS.map((amount) => ({
  rsc: amount,
  credits: amount * DONATION_CONFIG.MISSION_CREDITS_PER_RSC
}));

const UpgradeShop: React.FC<UpgradeShopProps> = ({
  stats,
  wallet,
  onUpgrade,
  onDeposit,
  onClose,
  onConnectWallet,
  onBuyMissionCredits,
  onOpenSwap,
  labFundingStatus,
  labFundingHash,
  labFundingError,
  isEmbeddedSwapEnabled,
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
      setPromoMessage({ text: "ACCESS GRANTED: +100 CREDITS", type: 'success' });
      setPromoCode("");
      setTimeout(() => setPromoMessage(null), 3000);
      return;
    }

    if (code === "HUMANITY") {
      onDeposit(1000);
      setPromoMessage({ text: "HUMANITY FUNDING: +1000 CREDITS", type: 'success' });
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
    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-5xl items-start justify-center overflow-y-auto p-2 sm:p-4">
        <div className="relative my-2 flex w-full max-w-4xl flex-col p-1">
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

          <div className="relative z-10 flex flex-col gap-4 overflow-y-auto p-4 sm:p-5 md:p-6 custom-scrollbar">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <img src={ASSETS.REAL_RSC_ICON} className="h-14 w-14 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] sm:h-16 sm:w-16" alt="Research Coin" />
                <div>
                  <h2 className="arcade-font text-2xl font-black leading-none tracking-widest text-white text-shadow-neon sm:text-3xl md:text-4xl">LABORATORY</h2>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.22em] text-indigo-300">
                    Current-mission funding, upgrades, and Base swaps
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-900/40 px-4 py-3">
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">Mission Credits</span>
                <div className="mt-1 flex items-center gap-2">
                  <img src="https://www.researchhub.com/icons/gold2.svg" className="h-5 w-5" alt="RSC" />
                  <span className="font-mono text-2xl font-bold text-white">{stats.coins}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Wave</div>
                <div className="mt-1 text-lg font-bold text-white">{stats.wave}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Lives</div>
                <div className="mt-1 text-lg font-bold text-white">{stats.lives}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Wallet</div>
                <div className="mt-1 text-sm font-bold text-cyan-200">{wallet.address ? 'Base Ready' : 'Connect Needed'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Conversion</div>
                <div className="mt-1 text-sm font-bold text-emerald-300">100 / 1 RSC</div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-950/15 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">Mission Funding</div>
                    <h3 className="mt-2 text-lg font-bold uppercase tracking-wide text-white">Top up this run with RSC</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      Each funding action sends RSC to the research wallet and mints temporary mission credits for this run only.
                    </p>
                  </div>

                  {!wallet.address ? (
                    <button
                      onClick={onConnectWallet}
                      className="rounded-xl border border-cyan-400/30 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/10"
                    >
                      {wallet.status === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {fundingPackages.map((fundingPackage) => (
                    <button
                      key={fundingPackage.rsc}
                      onClick={() => onBuyMissionCredits(fundingPackage.rsc)}
                      disabled={labFundingStatus === 'switching_network' || labFundingStatus === 'processing' || labFundingStatus === 'confirming'}
                      className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-400/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                        {fundingPackage.rsc} RSC
                      </div>
                      <div className="mt-2 text-2xl font-black text-white">{fundingPackage.credits}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">mission credits</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 min-h-5 text-[10px] uppercase tracking-[0.18em]">
                  {labFundingStatus === 'switching_network' && <span className="text-yellow-300">Switching to Base...</span>}
                  {labFundingStatus === 'processing' && <span className="text-cyan-300">Check wallet to sign the RSC transfer.</span>}
                  {labFundingStatus === 'confirming' && <span className="text-yellow-300">Waiting for the funding transfer to confirm...</span>}
                  {labFundingStatus === 'success' && <span className="text-emerald-300">Mission credits added for this run.</span>}
                  {labFundingStatus === 'error' && <span className="text-red-300">{labFundingError}</span>}
                  {labFundingStatus === 'idle' && <span className="text-gray-500">Funding only affects the active mission. Restarting begins from zero again.</span>}
                </div>

                {labFundingHash ? (
                  <a
                    href={`${DONATION_CONFIG.EXPLORER_BASE_URL}/tx/${labFundingHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300 underline underline-offset-2 hover:text-white"
                  >
                    View funding tx on BaseScan
                  </a>
                ) : null}

                <div className="group relative mt-5">
                  <div className="absolute -inset-0.5 animate-pulse rounded bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-20 blur transition duration-1000 group-hover:opacity-60"></div>
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-black/90 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded border border-gray-700 bg-gray-900 animate-pulse">
                          <span className="text-sm text-cyan-300">+</span>
                        </div>
                        <div className="text-left">
                          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">Promo Access</h3>
                          <p className="text-[9px] uppercase text-gray-500">Enter a code for a supply drop</p>
                        </div>
                      </div>

                      <form onSubmit={handlePromoCode} className="flex w-full items-center gap-2 sm:w-auto">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoMessage(null);
                          }}
                          placeholder="ENTER CODE"
                          className="w-full rounded border border-gray-600 bg-gray-900/80 px-3 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan-300 outline-none placeholder-gray-700 focus:border-cyan-500 sm:w-36"
                        />
                        <button
                          type="submit"
                          className="rounded border border-cyan-700/50 bg-cyan-900/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-800 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                        >
                          Redeem
                        </button>
                      </form>
                    </div>

                    {promoMessage ? (
                      <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/90 ${promoMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="animate-bounce font-mono text-xs font-bold tracking-widest">{promoMessage.text}</span>
                        {promoMessage.type === 'success' ? <div className="absolute inset-0 animate-pulse bg-green-500/10"></div> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <LabSwapPanel
                wallet={wallet}
                isEmbeddedSwapEnabled={isEmbeddedSwapEnabled}
                onConnectWallet={onConnectWallet}
                onOpenSwap={onOpenSwap}
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-indigo-300">Ship Upgrades</div>
                  <p className="mt-1 text-xs text-slate-400">Spend mission credits instantly after you fund or collect them in-run.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  current mission only
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
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
                    className={`w-full rounded-xl border py-3 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('fireRate') && stats.upgrades.fireRate < 5 ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
                  >
                    {stats.upgrades.fireRate >= 5 ? 'MAX LEVEL' : `FUND (${getCost('fireRate')} CREDITS)`}
                  </button>
                </div>

                <div className="flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
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
                    className={`w-full rounded-xl border py-3 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('speed') && stats.upgrades.speed < 5 ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
                  >
                    {stats.upgrades.speed >= 5 ? 'MAX LEVEL' : `FUND (${getCost('speed')} CREDITS)`}
                  </button>
                </div>

                <div className="flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
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
                    className={`w-full rounded-xl border py-3 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getCost('missile') && stats.upgrades.missile < 5 ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
                  >
                    {stats.upgrades.missile >= 5 ? 'MAX LEVEL' : `FUND (${getCost('missile')} CREDITS)`}
                  </button>
                </div>

                <div className="flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
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
                    className={`w-full rounded-xl border py-3 text-xs font-bold font-mono transition-all active:scale-95 ${stats.coins >= getRepairCost() ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-500' : 'cursor-not-allowed border-gray-700 bg-transparent text-gray-600'}`}
                  >
                    {`ADD LIFE (${getRepairCost()} CREDITS)`}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="scicon-btn mt-2 w-full py-4 text-base font-bold tracking-widest md:text-lg"
            >
              RETURN TO MISSION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
