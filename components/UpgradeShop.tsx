import React, { useState } from 'react';
import { DonationStatus, Stats, Upgrades, WalletSession } from '../types';
import { ASSETS, DONATION_CONFIG, UPGRADE_BASE_COSTS } from '../constants';

interface UpgradeShopProps {
  stats: Stats;
  wallet: WalletSession;
  onUpgrade: (type: keyof Upgrades | 'repair') => void;
  onDeposit: (coins: number) => void;
  onClose: () => void;
  onConnectWallet: () => void;
  onBuyMissionCredits: (rscAmount: number) => void;
  labFundingStatus: DonationStatus;
  labFundingHash: string;
  labFundingError: string;
  gameId: number;
}

const fundingPackages = DONATION_CONFIG.PRESET_RSC_AMOUNTS.map((amount) => ({
  rsc: amount,
  credits: amount * DONATION_CONFIG.MISSION_CREDITS_PER_RSC
}));

const upgradeCopy: Record<keyof Upgrades, { title: string; tag: string; description: string; color: string }> = {
  fireRate: {
    title: 'Rapid Review',
    tag: 'Fire rate',
    description: 'More shots. More pressure.',
    color: 'indigo'
  },
  speed: {
    title: 'Velocity Grant',
    tag: 'Handling',
    description: 'Sharper movement for tight dodges.',
    color: 'cyan'
  },
  missile: {
    title: 'Proton Missiles',
    tag: 'Auto lock',
    description: 'Adds homing support fire.',
    color: 'blue'
  }
};

const statusText: Record<DonationStatus, string> = {
  idle: 'Confirmed transfers add credits to this mission.',
  switching_network: 'Switching to Base...',
  processing: 'Confirm the RSC transfer in your wallet.',
  confirming: 'Waiting for Base confirmation...',
  success: 'Credits added.',
  error: ''
};

const UpgradeShop: React.FC<UpgradeShopProps> = ({
  stats,
  wallet,
  onUpgrade,
  onDeposit,
  onClose,
  onConnectWallet,
  onBuyMissionCredits,
  labFundingStatus,
  labFundingHash,
  labFundingError,
  gameId
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getCost = (type: keyof Upgrades) => {
    const level = stats.upgrades[type];
    return UPGRADE_BASE_COSTS[type] + (5 * (Math.pow(2, level) - 1));
  };

  const getRepairCost = () => {
    const repairs = stats.repairsCount || 0;
    return UPGRADE_BASE_COSTS.repair + (repairs * 5);
  };

  const handlePromoCode = (event: React.FormEvent) => {
    event.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'EXPLORES') {
      const storageKey = `scicon_promo_explores_${gameId}`;
      if (sessionStorage.getItem(storageKey)) {
        setPromoMessage({ text: 'Already redeemed this mission', type: 'error' });
        setTimeout(() => setPromoMessage(null), 2000);
        return;
      }

      onDeposit(100);
      sessionStorage.setItem(storageKey, 'true');
      setPromoMessage({ text: '+100 mission credits', type: 'success' });
      setPromoCode('');
      setTimeout(() => setPromoMessage(null), 2500);
      return;
    }

    if (code === 'HUMANITY') {
      onDeposit(1000);
      setPromoMessage({ text: '+1000 mission credits', type: 'success' });
      setPromoCode('');
      setTimeout(() => setPromoMessage(null), 2500);
      return;
    }

    setPromoMessage({ text: 'Invalid access code', type: 'error' });
    setTimeout(() => setPromoMessage(null), 2000);
  };

  const isFundingBusy = labFundingStatus === 'switching_network' || labFundingStatus === 'processing' || labFundingStatus === 'confirming';
  const canBuyAnyUpgrade = (Object.keys(upgradeCopy) as Array<keyof Upgrades>).some((type) => stats.coins >= getCost(type) && stats.upgrades[type] < 5) || stats.coins >= getRepairCost();

  return (
    <div className="absolute inset-0 z-30 bg-black/82 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-5xl items-start justify-center overflow-y-auto p-2 sm:p-4">
        <div className="relative my-2 flex w-full max-w-4xl flex-col overflow-hidden border border-cyan-300/20 bg-slate-950/92 shadow-[0_26px_90px_rgba(0,0,0,0.6)] [clip-path:polygon(18px_0,100%_0,100%_92%,96%_100%,0_100%,0_18px)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent"></div>

          <div className="relative z-10 flex flex-col gap-4 overflow-y-auto p-4 sm:p-5 md:p-6 custom-scrollbar">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 place-items-center border border-cyan-300/25 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.12)] [clip-path:polygon(20%_0,80%_0,100%_20%,100%_80%,80%_100%,20%_100%,0_80%,0_20%)] sm:h-16 sm:w-16">
                  <svg viewBox="0 0 64 64" className="h-10 w-10 text-cyan-100" aria-hidden="true">
                    <path d="M25 7h14v7l-4 5v9l16 19c3 4 0 10-5 10H18c-5 0-8-6-5-10l16-19v-9l-4-5V7Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                    <path d="M22 43h20M27 28h10M25 49h14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h2 className="arcade-font text-2xl font-black leading-none tracking-widest text-white sm:text-3xl md:text-4xl">LAB BAY</h2>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-200/75">
                    Fund. Upgrade. Return.
                  </p>
                </div>
              </div>

              <div className={`border px-4 py-3 ${canBuyAnyUpgrade ? 'border-yellow-300/40 bg-yellow-300/10' : 'border-cyan-300/20 bg-cyan-950/25'}`}>
                <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/70">Mission Credits</span>
                <div className="mt-1 flex items-center gap-2">
                  <img src={ASSETS.RSC_TOKEN} className="h-5 w-5" alt="RSC" />
                  <span className="font-mono text-2xl font-bold text-white">{stats.coins}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="border border-emerald-300/20 bg-emerald-300/8 p-4 [clip-path:polygon(12px_0,100%_0,100%_90%,96%_100%,0_100%,0_12px)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200">RSC Funding</div>
                    <h3 className="mt-2 text-base font-bold uppercase tracking-wide text-white">Mission credits</h3>
                  </div>

                  {!wallet.address ? (
                    <button
                      onClick={onConnectWallet}
                      className="border border-cyan-300/30 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100 transition hover:border-cyan-100"
                    >
                      {wallet.status === 'connecting' ? 'Connecting' : 'Connect'}
                    </button>
                  ) : (
                    <span className="border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-100">
                      Base ready
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {fundingPackages.map((fundingPackage) => (
                    <button
                      key={fundingPackage.rsc}
                      onClick={() => (wallet.address ? onBuyMissionCredits(fundingPackage.rsc) : onConnectWallet())}
                      disabled={isFundingBusy}
                      className="border border-emerald-300/20 bg-black/38 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-300/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                        {fundingPackage.rsc} RSC
                      </div>
                      <div className="mt-1 text-xl font-black text-white">{fundingPackage.credits}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">credits</div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 min-h-5 font-mono text-[10px] uppercase tracking-[0.16em]">
                  {labFundingStatus === 'error' ? (
                    <span className="text-red-300">{labFundingError}</span>
                  ) : (
                    <span className={labFundingStatus === 'success' ? 'text-emerald-200' : 'text-slate-400'}>
                      {statusText[labFundingStatus]}
                    </span>
                  )}
                </div>

                {labFundingHash ? (
                  <a
                    href={`${DONATION_CONFIG.EXPLORER_BASE_URL}/tx/${labFundingHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300 underline underline-offset-2 hover:text-white"
                  >
                    View tx on BaseScan
                  </a>
                ) : null}

                <form onSubmit={handlePromoCode} className="mt-4 flex items-center gap-2 border border-white/10 bg-black/30 p-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(event) => {
                      setPromoCode(event.target.value);
                      setPromoMessage(null);
                    }}
                    placeholder="ACCESS CODE"
                    className="w-full border border-transparent bg-transparent px-2 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan-200 outline-none placeholder-slate-600 focus:border-cyan-400/40"
                  />
                  <button
                    type="submit"
                    className="border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-100 transition hover:border-cyan-100"
                  >
                    Redeem
                  </button>
                </form>

                {promoMessage ? (
                  <div className={`mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${promoMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {promoMessage.text}
                  </div>
                ) : null}
              </section>

              <section className="border border-cyan-300/15 bg-white/[0.04] p-4 [clip-path:polygon(12px_0,100%_0,100%_90%,96%_100%,0_100%,0_12px)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200">Ship Upgrades</div>
                    <p className="mt-1 text-xs text-slate-400">Current mission only</p>
                  </div>
                  {canBuyAnyUpgrade ? (
                    <div className="border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-yellow-100">
                      Upgrade ready
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(upgradeCopy) as Array<keyof Upgrades>).map((type) => {
                    const cost = getCost(type);
                    const level = stats.upgrades[type];
                    const isReady = stats.coins >= cost && level < 5;
                    const copy = upgradeCopy[type];

                    return (
                      <div key={type} className={`flex min-h-[168px] flex-col justify-between border p-3 transition ${isReady ? 'border-yellow-300/35 bg-yellow-300/8' : 'border-white/8 bg-black/25'}`}>
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-wide text-white">{copy.title}</h3>
                              <p className="mt-1 text-xs text-slate-500">{copy.description}</p>
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200/70">{copy.tag}</span>
                          </div>
                          <div className="mt-4 flex h-1.5 gap-1">
                            {[...Array(5)].map((_, index) => (
                              <div key={index} className={`flex-1 ${index < level ? 'bg-cyan-300' : 'bg-slate-800'}`}></div>
                            ))}
                          </div>
                        </div>
                        <button
                          disabled={!isReady}
                          onClick={() => onUpgrade(type)}
                          className={`mt-4 w-full border py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition active:scale-95 ${isReady ? 'border-cyan-300 bg-cyan-300/15 text-cyan-50 hover:bg-cyan-300/25' : 'cursor-not-allowed border-slate-700 bg-transparent text-slate-600'}`}
                        >
                          {level >= 5 ? 'Max level' : `${cost} credits`}
                        </button>
                      </div>
                    );
                  })}

                  <div className={`flex min-h-[168px] flex-col justify-between border p-3 transition ${stats.coins >= getRepairCost() ? 'border-red-300/35 bg-red-300/8' : 'border-white/8 bg-black/25'}`}>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Emergency Aid</h3>
                          <p className="mt-1 text-xs text-slate-500">Recover one life unit.</p>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-200/70">Repair</span>
                      </div>
                      <div className="mt-4 flex gap-1">
                        {[...Array(Math.max(1, stats.lives))].slice(0, 5).map((_, index) => (
                          <div key={index} className="h-1.5 flex-1 bg-red-300"></div>
                        ))}
                      </div>
                    </div>
                    <button
                      disabled={stats.coins < getRepairCost()}
                      onClick={() => onUpgrade('repair')}
                      className={`mt-4 w-full border py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition active:scale-95 ${stats.coins >= getRepairCost() ? 'border-red-300 bg-red-300/15 text-red-50 hover:bg-red-300/25' : 'cursor-not-allowed border-slate-700 bg-transparent text-slate-600'}`}
                    >
                      {getRepairCost()} credits
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <button
              onClick={onClose}
              className="scicon-btn mt-1 w-full py-4 text-base font-bold tracking-widest md:text-lg"
            >
              Return to mission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
