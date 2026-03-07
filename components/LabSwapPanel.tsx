import React from 'react';
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
}) => (
  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/15 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300">Swap Desk</div>
        <h3 className="mt-2 text-lg font-bold uppercase tracking-wide text-white">Swap into RSC on Base</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Use USDC or RSC on Base, then fund the current mission. The external desk stays available as a fallback.
        </p>
      </div>

      <button
        onClick={onOpenSwap}
        className="rounded-xl border border-cyan-400/30 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-200 hover:bg-cyan-400/10"
      >
        Open Aerodrome
      </button>
    </div>

    {!wallet.address ? (
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-xs text-slate-300">
          Connect with Base Account first so the lab can fund credits and route swaps on Base.
        </div>
        <button
          onClick={onConnectWallet}
          className="scicon-btn mt-4 w-full py-3 text-sm font-bold"
        >
          {wallet.status === 'connecting' ? 'CONNECTING...' : 'CONNECT BASE ACCOUNT'}
        </button>
      </div>
    ) : null}

    {wallet.address && isEmbeddedSwapEnabled ? (
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
        <SwapDefault
          from={swapTokens}
          to={swapTokens}
          title="Swap Desk"
          config={{ maxSlippage: 3 }}
          experimental={{ useAggregator: true }}
        />
      </div>
    ) : null}

    {wallet.address && !isEmbeddedSwapEnabled ? (
      <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-200">Embedded Swap Offline</div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Add <code>VITE_ONCHAINKIT_API_KEY</code> to enable the embedded swap panel. The Aerodrome route above is live now.
        </p>
      </div>
    ) : null}
  </div>
);

export default LabSwapPanel;
