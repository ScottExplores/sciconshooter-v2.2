import React from 'react';
import { DONATION_CONFIG } from '../constants';
import { DonationStatus, WalletSession } from '../types';

interface SupportPanelProps {
  wallet: WalletSession;
  isMiniApp: boolean;
  donationStatus: DonationStatus;
  donationHash: string;
  donationError: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onDonate: (amount: number) => void;
  compact?: boolean;
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const SupportPanel: React.FC<SupportPanelProps> = ({
  wallet,
  isMiniApp,
  donationStatus,
  donationHash,
  donationError,
  onConnect,
  onDisconnect,
  onDonate,
  compact = false
}) => {
  const isConnected = wallet.status === 'connected' && !!wallet.address;
  const buttonRowClass = compact ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-2 md:gap-3';

  return (
    <div className={`w-full rounded-2xl border border-cyan-500/20 bg-cyan-950/20 ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Base Account Access</h3>
          {!compact ? (
            <p className="mt-1 text-[10px] text-gray-400">
              Connect once so the lab can swap into RSC, fund mission credits, and optionally send a support tip.
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
              {wallet.error || (isMiniApp ? 'Mini app wallet should be available from the host.' : 'Use Base Account, then the lab can fund and swap without extra setup.')}
            </div>
          )}
        </div>

        {!isConnected && !isMiniApp ? (
          <button
            onClick={onConnect}
            className={`scicon-btn w-full py-2 text-xs font-bold ${compact ? '' : 'md:w-auto md:px-6'}`}
          >
            {wallet.status === 'connecting' ? 'CONNECTING...' : 'CONNECT BASE ACCOUNT'}
          </button>
        ) : null}
      </div>

      {isConnected ? (
        <div className="mt-4 space-y-2">
          <div className={buttonRowClass}>
            {DONATION_CONFIG.PRESET_RSC_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => onDonate(amount)}
                disabled={donationStatus === 'switching_network' || donationStatus === 'processing' || donationStatus === 'confirming'}
                className="rounded-xl border border-cyan-400/30 bg-black/40 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-wait disabled:opacity-60"
              >
                Tip {amount} RSC
              </button>
            ))}
          </div>

          <div className={`min-h-5 text-[10px] uppercase tracking-[0.18em] ${compact ? 'text-center' : ''}`}>
            {donationStatus === 'switching_network' && <span className="text-yellow-300">Switching to Base...</span>}
            {donationStatus === 'processing' && <span className="text-cyan-300">Check wallet to sign.</span>}
            {donationStatus === 'confirming' && <span className="text-yellow-300">Waiting for confirmation...</span>}
            {donationStatus === 'success' && <span className="text-emerald-300">Donation confirmed. Thank you.</span>}
            {donationStatus === 'error' && <span className="text-red-300">{donationError}</span>}
            {donationStatus === 'idle' && <span className="text-gray-500">{compact ? 'Tips are optional.' : 'Tips are optional. Lab purchases still use their own current-mission funding flow.'}</span>}
          </div>

          {donationHash ? (
            <a
              href={`${DONATION_CONFIG.EXPLORER_BASE_URL}/tx/${donationHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-300 underline underline-offset-2 hover:text-white"
            >
              View donation on BaseScan
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default SupportPanel;
