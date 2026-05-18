import React, { useState } from 'react';
import { WalletSession } from '../types';

interface WalletButtonProps {
  wallet: WalletSession;
  onConnect: (connectorId?: string) => void;
  onDisconnect: () => void;
  onOpenSwap: () => void;
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletButton: React.FC<WalletButtonProps> = ({
  wallet,
  onConnect,
  onDisconnect,
  onOpenSwap
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isConnected = wallet.status === 'connected' && !!wallet.address;

  return (
    <div className="absolute right-3 top-3 z-50 font-mono text-white">
      <button
        onClick={() => {
          if (isConnected) {
            setIsOpen((value) => !value);
            return;
          }

          onConnect();
        }}
        disabled={wallet.status === 'connecting'}
        className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md transition ${
          isConnected
            ? 'border-emerald-300/40 bg-emerald-950/80 text-emerald-100'
            : 'border-cyan-300/40 bg-black/75 text-cyan-100 hover:border-cyan-100'
        }`}
      >
        {isConnected ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]"></span>
            {shortenAddress(wallet.address!)}
            {wallet.hasDonated ? <span className="text-yellow-300">RSC</span> : null}
          </span>
        ) : wallet.status === 'connecting' ? (
          'Connecting...'
        ) : (
          'Connect'
        )}
      </button>

      {isOpen && isConnected ? (
        <div className="absolute right-0 mt-2 w-[min(88vw,320px)] rounded-2xl border border-cyan-400/20 bg-[#040812]/95 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Wallet</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white">
                  <span>{shortenAddress(wallet.address!)}</span>
                  <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${wallet.chainId === 8453 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-200'}`}>
                    {wallet.chainId === 8453 ? 'Base' : 'Switch needed'}
                  </span>
                  {wallet.connectorName ? <span className="text-gray-500">{wallet.connectorName}</span> : null}
                </div>
              </div>

              <button
                onClick={onOpenSwap}
                className="w-full rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/15"
              >
                Get RSC on Aerodrome
              </button>

              {wallet.hasDonated ? (
                <div className="rounded-xl border border-yellow-300/20 bg-yellow-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-yellow-200">
                  RSC supporter badge active
                </div>
              ) : null}

              <button
                onClick={onDisconnect}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-300 transition hover:border-white/30 hover:text-white"
              >
                Disconnect
              </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WalletButton;
