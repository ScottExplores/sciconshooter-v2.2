import React, { useState } from 'react';
import { DonationStatus, PowerupType, Stats, Upgrades, WalletSession } from '../types';
import { ASSETS, DONATION_CONFIG, UPGRADE_BASE_COSTS } from '../constants';
import type { FundingCreditToken } from './FundingWidgetModal';

interface UpgradeShopProps {
  stats: Stats;
  wallet: WalletSession;
  onUpgrade: (type: keyof Upgrades | 'repair') => void;
  onDeposit: (coins: number) => void;
  onBuyPowerup: (type: PowerupType) => void;
  onClose: () => void;
  onConnectWallet: (connectorId?: string) => void;
  onBuyMissionCredits: (rscAmount: number, token?: FundingCreditToken) => void;
  onOpenRscSwap: () => void;
  onOpenKarmaSwap: () => void | Promise<void>;
  onClaimProfileCredits: () => void;
  labFundingStatus: DonationStatus;
  labFundingHash: string;
  labFundingExplorerBaseUrl: string;
  labFundingError: string;
  gameId: number;
}

const fundingPackages = DONATION_CONFIG.PRESET_RSC_AMOUNTS.map((amount) => ({
  rsc: amount,
  credits: amount * DONATION_CONFIG.MISSION_CREDITS_PER_RSC
}));

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

type FounderPowerupType = Exclude<PowerupType, PowerupType.EXTRA_LIFE | PowerupType.KARMA_LASER>;

const upgradeCopy: Record<keyof Upgrades, { title: string; tag: string; icon: string; description: string }> = {
  fireRate: {
    title: 'Rapid Review',
    tag: 'Fire',
    icon: '⚡',
    description: 'Faster shots'
  },
  speed: {
    title: 'Velocity Grant',
    tag: 'Speed',
    icon: '🚀',
    description: 'Sharper moves'
  },
  missile: {
    title: 'Proton Missiles',
    tag: 'Lock',
    icon: '🎯',
    description: 'Auto support'
  }
};

const powerupCopy: Record<FounderPowerupType, { title: string; tag: string; image: string }> = {
  [PowerupType.DOUBLE_SHOT]: {
    title: 'Double Shot',
    tag: 'Parallel fire',
    image: ASSETS.FOUNDER_4
  },
  [PowerupType.TRIPLE_SHOT]: {
    title: 'Triple Shot',
    tag: 'Spread fire',
    image: ASSETS.FOUNDER_BRIAN
  },
  [PowerupType.MAGNET]: {
    title: 'Credit Magnet',
    tag: 'Pull coins',
    image: ASSETS.FOUNDER_PATRICK
  },
  [PowerupType.SHIELD]: {
    title: 'Shield',
    tag: 'Block hits',
    image: ASSETS.FOUNDER_JEFFREY
  }
};

const purchasablePowerups: FounderPowerupType[] = [
  PowerupType.DOUBLE_SHOT,
  PowerupType.TRIPLE_SHOT,
  PowerupType.MAGNET,
  PowerupType.SHIELD
];

const labFundingTokens: Record<FundingCreditToken, {
  label: string;
  symbol: string;
  chain: string;
  icon: string;
}> = {
  RSC: {
    label: 'Use RSC',
    symbol: 'RSC',
    chain: 'Base',
    icon: ASSETS.REAL_RSC_ICON
  },
  KRMA: {
    label: 'Use KARMA',
    symbol: 'KRMA',
    chain: 'BNB Smart Chain',
    icon: ASSETS.KARMA_TOKEN
  }
};

const getStatusText = (status: DonationStatus, token: FundingCreditToken) => {
  const tokenMeta = labFundingTokens[token];

  const statusText: Record<DonationStatus, string> = {
    idle: 'Confirmed token transfers save wallet-linked credits.',
    switching_network: `Switching to ${tokenMeta.chain}...`,
    processing: 'Confirm the token transfer in your wallet.',
    confirming: `Waiting for ${tokenMeta.chain} confirmation...`,
    success: 'Credits added to your wallet bank.',
    error: ''
  };

  return statusText[status];
};

const UpgradeShop: React.FC<UpgradeShopProps> = ({
  stats,
  wallet,
  onUpgrade,
  onDeposit,
  onBuyPowerup,
  onClose,
  onConnectWallet,
  onBuyMissionCredits,
  onOpenRscSwap,
  onOpenKarmaSwap,
  onClaimProfileCredits,
  labFundingStatus,
  labFundingHash,
  labFundingExplorerBaseUrl,
  labFundingError,
  gameId
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selectedFundingToken, setSelectedFundingToken] = useState<FundingCreditToken>('RSC');
  const selectedTokenMeta = labFundingTokens[selectedFundingToken];

  const getCost = (type: keyof Upgrades) => {
    const level = stats.upgrades[type];
    return UPGRADE_BASE_COSTS[type] + (5 * (Math.pow(2, level) - 1));
  };

  const getRepairCost = () => {
    const repairs = stats.repairsCount || 0;
    return UPGRADE_BASE_COSTS.repair + (repairs * 5);
  };

  const getPowerupCost = (type: PowerupType) => (
    UPGRADE_BASE_COSTS.powerup + ((stats.powerupUses?.[type] || 0) * 10)
  );

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
  const canBuyAnyUpgrade = (Object.keys(upgradeCopy) as Array<keyof Upgrades>).some((type) => stats.coins >= getCost(type) && stats.upgrades[type] < 5)
    || stats.coins >= getRepairCost()
    || purchasablePowerups.some((type) => stats.coins >= getPowerupCost(type));
  const txExplorerLabel = labFundingExplorerBaseUrl.toLowerCase().includes('bsc') ? 'BscScan' : 'BaseScan';

  return (
    <div className="absolute inset-0 z-30 bg-black/82 backdrop-blur-md">
      <div className="mx-auto flex h-[100dvh] w-full max-w-5xl items-start justify-center overflow-y-auto px-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2 sm:p-4">
        <div className="relative my-2 flex w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-slate-950/94 shadow-[0_26px_90px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent"></div>

          <div className="relative z-10 flex max-h-[calc(100dvh-1rem)] flex-col">
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 pb-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="arcade-font text-2xl font-black leading-none tracking-widest text-white sm:text-3xl">LAB BAY</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/75">Fund. Upgrade. Return.</p>
                </div>

                <div className={`min-w-[138px] rounded-2xl border px-3 py-2 ${canBuyAnyUpgrade ? 'border-yellow-300/40 bg-yellow-300/10' : 'border-cyan-300/20 bg-cyan-950/25'}`}>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">Mission Credits</span>
                  <div className="mt-1 flex items-center gap-2">
                    <img src={ASSETS.RSC_TOKEN} className="h-5 w-5" alt="Credits" />
                    <span className="font-mono text-2xl font-bold text-white">{stats.coins}</span>
                  </div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-black/28 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[8px] font-black uppercase tracking-[0.14em] text-yellow-100/80">Wallet Bank</div>
                        <div className="mt-0.5 text-[11px] font-bold text-white">{stats.profileCredits || 0} ready</div>
                      </div>
                      <button
                        type="button"
                        onClick={onClaimProfileCredits}
                        disabled={(stats.profileCredits || 0) <= 0}
                        className="rounded-lg border border-yellow-100/40 bg-yellow-200 px-2 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-500"
                      >
                        Deploy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <section className="mt-3 rounded-[22px] border border-cyan-300/15 bg-white/[0.04] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Ship Modules</div>
                    <p className="mt-1 text-xs text-slate-400">Mission-only upgrades, condensed for mobile.</p>
                  </div>
                  {canBuyAnyUpgrade ? (
                    <div className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-yellow-100">
                      Ready
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(upgradeCopy) as Array<keyof Upgrades>).map((type) => {
                    const cost = getCost(type);
                    const level = stats.upgrades[type];
                    const isReady = stats.coins >= cost && level < 5;
                    const copy = upgradeCopy[type];

                    return (
                      <button
                        key={type}
                        disabled={!isReady}
                        onClick={() => onUpgrade(type)}
                        className={`min-h-[116px] rounded-2xl border p-2 text-left transition active:scale-95 ${isReady ? 'border-cyan-300/55 bg-cyan-300/12 text-white hover:bg-cyan-300/20' : 'border-white/8 bg-black/25 text-slate-500'}`}
                      >
                        <div className="text-2xl">{copy.icon}</div>
                        <div className="mt-2 text-[10px] font-black uppercase leading-tight tracking-wide">{copy.tag}</div>
                        <div className="mt-1 text-[9px] leading-tight text-slate-400">{copy.description}</div>
                        <div className="mt-2 flex h-1 gap-0.5">
                          {[...Array(5)].map((_, index) => (
                            <span key={index} className={`flex-1 rounded-full ${index < level ? 'bg-cyan-300' : 'bg-slate-800'}`}></span>
                          ))}
                        </div>
                        <div className="mt-2 font-mono text-[10px] font-black text-white">{level >= 5 ? 'MAX' : `${cost}`}</div>
                      </button>
                    );
                  })}

                  <button
                    disabled={stats.coins < getRepairCost()}
                    onClick={() => onUpgrade('repair')}
                    className={`min-h-[116px] rounded-2xl border p-2 text-left transition active:scale-95 ${stats.coins >= getRepairCost() ? 'border-red-300/55 bg-red-300/12 text-white hover:bg-red-300/20' : 'border-white/8 bg-black/25 text-slate-500'}`}
                  >
                    <div className="text-2xl">🧪</div>
                    <div className="mt-2 text-[10px] font-black uppercase leading-tight tracking-wide">Repair</div>
                    <div className="mt-1 text-[9px] leading-tight text-slate-400">Recover one life</div>
                    <div className="mt-2 flex gap-0.5">
                      {[...Array(Math.max(1, stats.lives))].slice(0, 5).map((_, index) => (
                        <span key={index} className="h-1 flex-1 rounded-full bg-red-300"></span>
                      ))}
                    </div>
                    <div className="mt-2 font-mono text-[10px] font-black text-white">{getRepairCost()}</div>
                  </button>
                </div>
              </section>

              <section className="mt-3 rounded-[22px] border border-indigo-300/15 bg-indigo-300/[0.06] p-3">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-200">Founder Powerups</div>
                    <p className="mt-1 text-xs text-slate-400">Four field drops. Starts at 10 credits and scales each use.</p>
                  </div>
                </div>

                <div className="relative">
                  <div className="grid grid-cols-4 gap-2">
                  {purchasablePowerups.map((type) => {
                    const copy = powerupCopy[type];
                    const cost = getPowerupCost(type);
                    const canBuy = stats.coins >= cost;

                    return (
                      <button
                        key={type}
                        onClick={() => onBuyPowerup(type)}
                        disabled={!canBuy}
                        className={`min-h-[104px] rounded-2xl border p-2 text-left transition active:scale-95 ${canBuy ? 'border-indigo-200/45 bg-white/[0.08] text-white hover:bg-white/[0.12]' : 'border-white/8 bg-black/25 text-slate-500'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/20 bg-slate-900">
                            <img src={copy.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </span>
                          <span className={`rounded-full px-1.5 py-1 text-[8px] font-black uppercase tracking-wide ${canBuy ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                            {cost}
                          </span>
                        </div>
                        <div className="mt-2 text-[9px] font-black uppercase leading-tight tracking-wide">{copy.title}</div>
                        <div className="mt-1 text-[9px] uppercase tracking-wide text-slate-400">{copy.tag}</div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              </section>

              <section className="mt-3 rounded-[22px] border border-emerald-300/20 bg-emerald-300/8 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">RSC Funding</div>
                    <h3 className="mt-1 text-sm font-bold uppercase tracking-wide text-white">Mission credits</h3>
                    <p className="mt-1 text-xs text-slate-400">Buy wallet-linked credits, then deploy them into this run above.</p>
                  </div>

                  {wallet.address ? (
                    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-right">
                      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-100">Base ready</div>
                      <div className="mt-1 text-[10px] font-bold text-white">{shortenAddress(wallet.address)}</div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(['RSC', 'KRMA'] as FundingCreditToken[]).map((token) => {
                    const tokenMeta = labFundingTokens[token];
                    const isSelected = selectedFundingToken === token;

                    return (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setSelectedFundingToken(token)}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition active:scale-95 ${
                          isSelected
                            ? token === 'KRMA'
                              ? 'border-purple-100 bg-purple-300/22 text-white shadow-[0_0_22px_rgba(168,85,247,0.16)]'
                              : 'border-emerald-100 bg-emerald-300/18 text-white shadow-[0_0_22px_rgba(16,185,129,0.16)]'
                            : 'border-white/10 bg-black/28 text-slate-300 hover:border-cyan-200/45'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={tokenMeta.icon} alt="" className={`h-7 w-7 rounded-full border object-cover ${token === 'RSC' ? 'border-white/10 bg-white' : 'border-purple-200/35 bg-slate-950'}`} />
                          <div>
                            <div className="font-mono text-[9px] font-black uppercase tracking-[0.14em]">{tokenMeta.label}</div>
                            <div className="mt-0.5 text-[9px] font-semibold text-slate-400">{tokenMeta.chain}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedFundingToken === 'KRMA' ? (
                  <div className="mt-2 rounded-2xl border border-purple-200/20 bg-purple-400/10 p-3 text-[11px] font-semibold leading-relaxed text-purple-100">
                    Promo mode: KARMA runs on BNB Smart Chain. 1 KRMA gives the same 100 wallet-bank credits as 1 RSC.
                  </div>
                ) : null}

                {!wallet.address ? (
                  <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-black/30 p-2">
                    <button
                      type="button"
                      onClick={() => onConnectWallet()}
                      className="w-full rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-100"
                    >
                      {wallet.status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                    {wallet.error ? <div className="mt-2 px-1 text-[10px] leading-relaxed text-red-300">{wallet.error}</div> : null}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {fundingPackages.map((fundingPackage) => (
                    <button
                      key={fundingPackage.rsc}
                      onClick={() => {
                        if (wallet.address) {
                          onBuyMissionCredits(fundingPackage.rsc, selectedFundingToken);
                        }
                      }}
                      disabled={!wallet.address || isFundingBusy}
                      className="rounded-2xl border border-emerald-300/20 bg-black/38 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-300/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className={`font-mono text-[9px] font-bold uppercase tracking-[0.14em] ${selectedFundingToken === 'KRMA' ? 'text-purple-200' : 'text-emerald-200'}`}>{fundingPackage.rsc} {selectedTokenMeta.symbol}</div>
                      <div className="mt-1 text-lg font-black text-white">{fundingPackage.credits}</div>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-slate-400">credits</div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedFundingToken === 'KRMA') {
                      onOpenKarmaSwap();
                      return;
                    }

                    onOpenRscSwap();
                  }}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10"
                >
                  {selectedFundingToken === 'KRMA' ? 'Need KARMA? Open PancakeSwap' : 'Need RSC? Buy ResearchCoin'}
                </button>

                <div className="mt-3 min-h-5 font-mono text-[10px] uppercase tracking-[0.14em]">
                  {labFundingStatus === 'error' ? (
                    <span className="text-red-300">{labFundingError}</span>
                  ) : (
                    <span className={labFundingStatus === 'success' ? 'text-emerald-200' : 'text-slate-400'}>
                      {getStatusText(labFundingStatus, selectedFundingToken)}
                    </span>
                  )}
                </div>

                {labFundingHash ? (
                  <a
                    href={`${labFundingExplorerBaseUrl}/tx/${labFundingHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300 underline underline-offset-2 hover:text-white"
                  >
                    View tx on {txExplorerLabel}
                  </a>
                ) : null}

                <form onSubmit={handlePromoCode} className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
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
                    className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-100 transition hover:border-cyan-100"
                  >
                    Redeem
                  </button>
                </form>

                {promoMessage ? (
                  <div className={`mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${promoMessage.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {promoMessage.text}
                  </div>
                ) : null}
              </section>
            </div>

            <div className="border-t border-white/10 bg-slate-950/96 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button onClick={onClose} className="scicon-btn w-full py-4 text-base font-bold tracking-widest">
                Return to mission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeShop;
