import React from 'react';
import { WalletSession } from '../types';

interface SupportPanelProps {
  wallet: WalletSession;
  isMiniApp: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  compact?: boolean;
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const SupportPanel: React.FC<SupportPanelProps> = ({
  wallet,
  isMiniApp,
  onConnect,
  onDisconnect,
  compact = false
}) => {
  const isConnected = wallet.status === 'connected' && !!wallet.address;

  return (
    <div className={`w-full rounded-2xl border border-cyan-500/20 bg-cyan-950/20 ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Wallet Access</h3>
          {!compact ? (
            <p className="mt-1 text-[10px] text-gray-400">
              Connect once to fund mission credits from Lab Bay with RSC.
            </p>
          ) : null}
        </div>
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="rounded border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition hover:border-white/30 hover:text-white"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className={`mt-3 flex flex-col gap-3 ${compact ? '' : 'md:flex-row md:items-center md:justify-between'}`}>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">{compact ? 'Wallet' : 'Connection'}</div>
          {isConnected ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-white">
              <span>{shortenAddress(wallet.address!)}</span>
              <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${wallet.chainId === 8453 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-200'}`}>
                {wallet.chainId === 8453 ? 'Base Ready' : 'Switch To Base'}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-xs text-gray-300">
              {wallet.error || (isMiniApp ? 'Mini app wallet should be available from the host.' : 'Connect a browser wallet, Coinbase Wallet, or Base Account.')}
            </div>
          )}
        </div>

        {!isConnected && !isMiniApp ? (
          <button
            onClick={onConnect}
            className={`scicon-btn w-full py-2 text-xs font-bold ${compact ? '' : 'md:w-auto md:px-6'}`}
          >
            {wallet.status === 'connecting' ? 'CONNECTING...' : 'CONNECT WALLET'}
          </button>
        ) : null}
      </div>

      {isConnected ? (
        <div className={`mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-gray-400 ${compact ? 'text-center' : ''}`}>
          RSC credit purchases are handled in Lab Bay. Tip jar returns after the destination wallet is confirmed.
        </div>
      ) : null}
    </div>
  );
};

export default SupportPanel;
