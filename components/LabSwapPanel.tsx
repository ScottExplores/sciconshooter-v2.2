import React, { useState } from 'react';
import { SwapDefault } from '@coinbase/onchainkit/swap';
import type { Token } from '@coinbase/onchainkit/token';
import { DONATION_CONFIG } from '../constants';
import { WalletSession } from '../types';

const swapTokens: Token[] = [
  {
    address: DONATION_CONFIG.USDC_CONTRACT_ADDRESS,
    chainId: DONATION_CONFIG.BASE_CHAIN_ID,
    decimals: 6,
    image: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    name: 'USD Coin',
    symbol: 'USDC'
  },
  {
    address: DONATION_CONFIG.RSC_CONTRACT_ADDRESS,
    chainId: DONATION_CONFIG.BASE_CHAIN_ID,
    decimals: 18,
    image: 'https://assets.coingecko.com/coins/images/28146/standard/RH_BOTTLE_CLEAN_Aug_2024_1.png?1732742001',
    name: 'ResearchCoin',
    symbol: 'RSC'
  }
];

interface LabSwapPanelProps {
  wallet: WalletSession;
  isEmbeddedSwapEnabled: boolean;
  onConnectWallet: () => void;
  onOpenSwap: () => void;
}

const LabSwapPanel: React.FC<LabSwapPanelProps> = ({
  wallet,
  isEmbeddedSwapEnabled,
  onConnectWallet,
  onOpenSwap
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/15 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Swap Desk</div>
            <h3 className="mt-2 text-base font-bold uppercase tracking-wide text-white">Need more RSC?</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Open the embedded swap desk here, swap on Base, then come straight back to mission funding.
            </p>
          </div>

          <button
            onClick={() => (wallet.address ? setIsOpen(true) : onConnectWallet())}
            className="rounded-xl border border-cyan-400/30 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/10"
          >
            {wallet.address ? 'Open Swap' : wallet.status === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {wallet.address ? 'Embedded swap ready' : 'Connect wallet to enable embedded swap'}
          </div>
          <button
            onClick={onOpenSwap}
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 underline underline-offset-2 hover:text-white"
          >
            Aerodrome fallback
          </button>
        </div>
      </div>

      {isOpen && wallet.address && isEmbeddedSwapEnabled ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-[28px] border border-cyan-400/20 bg-[#020816] p-3 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Embedded Swap</div>
                <div className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white">Swap RSC on Base</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
              <SwapDefault
                from={swapTokens}
                to={swapTokens}
                title="Swap Desk"
                config={{ maxSlippage: 3 }}
                experimental={{ useAggregator: true }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default LabSwapPanel;
