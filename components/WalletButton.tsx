import React, { useState } from 'react';
import { ConnectButton } from 'thirdweb/react';
import { ASSETS, DONATION_CONFIG } from '../constants';
import { WalletSession } from '../types';
import type { FundingWidgetMode } from './FundingWidgetModal';
import {
  thirdwebAppMetadata,
  thirdwebBaseChain,
  thirdwebClient,
  thirdwebConnectModal,
  thirdwebPaymentConnectOptions,
  thirdwebRecommendedWallets,
  thirdwebSupportedTokens,
  thirdwebTheme,
  thirdwebWallets
} from '../services/thirdwebWallet';

interface WalletButtonProps {
  wallet: WalletSession;
  onConnect: (connectorId?: string) => void;
  onDisconnect: () => void;
  onOpenFunding: (mode: FundingWidgetMode, rscAmount?: number) => void;
  credits: number;
}

const WalletButton: React.FC<WalletButtonProps> = ({
  wallet,
  onConnect,
  onDisconnect,
  onOpenFunding,
  credits
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shortAddress = wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '';

  if (thirdwebClient && wallet.address) {
    return (
      <div className="absolute right-3 top-3 z-50 font-mono text-white">
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="flex items-center gap-2 rounded-full border border-emerald-300/35 bg-black/72 px-2 py-1.5 shadow-[0_0_24px_rgba(16,185,129,0.2)] backdrop-blur-md transition hover:border-emerald-100"
          aria-expanded={isMenuOpen}
          aria-label="Open wallet profile"
        >
          <span className="h-8 w-8 rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,#ffe0c6_0,#50d1ff_42%,#083344_100%)]" />
          <span className="hidden text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100 min-[420px]:inline">
            {shortAddress}
          </span>
          <span className={`text-xs text-slate-300 transition ${isMenuOpen ? 'rotate-180' : ''}`}>v</span>
        </button>

        {isMenuOpen ? (
          <div className="absolute right-0 mt-2 w-[236px] overflow-hidden rounded-[22px] border border-white/15 bg-white text-slate-950 shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
            <div className="flex items-center gap-3 border-b border-slate-200 p-3">
              <span className="h-10 w-10 rounded-full bg-[radial-gradient(circle_at_30%_20%,#ffe0c6_0,#50d1ff_42%,#083344_100%)]" />
              <div className="min-w-0">
                <div className="truncate text-sm font-black">{shortAddress}</div>
                <div className="mt-0.5 text-xs text-slate-500">{wallet.connectorName || 'thirdweb wallet'}</div>
              </div>
            </div>

            <div className="divide-y divide-slate-200 text-sm font-bold">
              <ConnectButton
                client={thirdwebClient}
                chain={thirdwebBaseChain}
                appMetadata={thirdwebAppMetadata}
                connectButton={{ label: 'Connect' }}
                connectModal={thirdwebConnectModal}
                detailsButton={{
                  render: () => (
                    <div className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100">
                      <span className="text-xs font-black">ID</span>
                      <span>My account</span>
                    </div>
                  )
                }}
                detailsModal={{
                  showBalanceInFiat: 'USD',
                  assetTabs: ['token'],
                  manageWallet: { allowLinkingProfiles: true },
                  payOptions: {
                    mode: 'fund_wallet',
                    prefillBuy: {
                      chain: thirdwebBaseChain,
                      token: {
                        address: DONATION_CONFIG.USDC_CONTRACT_ADDRESS,
                        name: 'USD Coin',
                        symbol: 'USDC'
                      },
                      amount: '5',
                      allowEdits: { amount: true, token: false, chain: false },
                      presetOptions: [5, 10, 20]
                    },
                    buyWithCrypto: {
                      prefillSource: {
                        chain: thirdwebBaseChain,
                        token: {
                          address: DONATION_CONFIG.USDC_CONTRACT_ADDRESS,
                          name: 'USD Coin',
                          symbol: 'USDC'
                        },
                        allowEdits: { token: true, chain: false }
                      }
                    },
                    buyWithFiat: {
                      onrampChainId: DONATION_CONFIG.BASE_CHAIN_ID,
                      onrampTokenAddress: DONATION_CONFIG.USDC_CONTRACT_ADDRESS
                    },
                    metadata: {
                      name: 'Fund SciCon Shooter',
                      description: 'Buy Base USDC, then swap to RSC for mission credits.',
                      image: ASSETS.RSC_TOKEN
                    },
                    showThirdwebBranding: false
                  }
                }}
                recommendedWallets={thirdwebRecommendedWallets}
                supportedTokens={thirdwebSupportedTokens}
                theme={thirdwebTheme}
                wallets={thirdwebWallets}
              />

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFunding('checkout', DONATION_CONFIG.PRESET_RSC_AMOUNTS[0]);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <span className="text-lg">+</span>
                <span>Buy credits</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFunding('swap');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <span className="text-xs font-black">SW</span>
                <span>Swap to RSC</span>
              </button>

              <a
                href={ASSETS.REFERRAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-100"
              >
                <span className="text-lg">i</span>
                <span>Learn more</span>
              </a>

              <a
                href={DONATION_CONFIG.X_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-100"
              >
                <span className="text-lg">?</span>
                <span>Get help</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenFunding('buy', DONATION_CONFIG.PRESET_RSC_AMOUNTS[0]);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <span className="text-xs font-black">SET</span>
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDisconnect();
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left font-black text-red-600 transition hover:bg-red-50"
              >
                <span className="text-xs font-black">OFF</span>
                <span>Sign out</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {credits} credits
              </div>
              <div className="flex gap-2">
                <a href={DONATION_CONFIG.X_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-black">X</a>
                <a href={ASSETS.REFERRAL_LINK} target="_blank" rel="noopener noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-black">RH</a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return thirdwebClient ? (
    <div className="absolute right-3 top-3 z-50 font-mono">
      <ConnectButton
        client={thirdwebClient}
        chain={thirdwebBaseChain}
        appMetadata={thirdwebAppMetadata}
        connectButton={{
          label: 'Connect',
          className: 'scicon-wallet-connect',
          style: {
            borderRadius: '999px',
            border: '1px solid rgba(103, 232, 249, 0.38)',
            background: 'rgba(0, 0, 0, 0.74)',
            color: 'rgb(207, 250, 254)',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            minWidth: 'auto',
            height: '40px',
            padding: '0 14px',
            boxShadow: '0 0 24px rgba(34, 211, 238, 0.18)'
          }
        }}
        connectModal={thirdwebConnectModal}
        detailsModal={{
          showBalanceInFiat: 'USD',
          assetTabs: ['token'],
          manageWallet: { allowLinkingProfiles: true },
          payOptions: {
            mode: 'fund_wallet',
            prefillBuy: {
              chain: thirdwebBaseChain,
              token: {
                address: DONATION_CONFIG.USDC_CONTRACT_ADDRESS,
                name: 'USD Coin',
                symbol: 'USDC'
              },
              amount: '5',
              allowEdits: { amount: true, token: false, chain: false },
              presetOptions: [5, 10, 20]
            },
            buyWithFiat: {
              onrampChainId: DONATION_CONFIG.BASE_CHAIN_ID,
              onrampTokenAddress: DONATION_CONFIG.USDC_CONTRACT_ADDRESS
            },
            showThirdwebBranding: false
          }
        }}
        recommendedWallets={thirdwebRecommendedWallets}
        supportedTokens={thirdwebSupportedTokens}
        theme={thirdwebTheme}
        wallets={thirdwebWallets}
      />
    </div>
  ) : (
    <div className="absolute right-3 top-3 z-50 font-mono text-white">
      <button
        onClick={() => onConnect()}
        className="rounded-full border border-cyan-300/40 bg-black/75 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md transition hover:border-cyan-100"
      >
        Connect
      </button>
      {wallet.error ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-red-300/25 bg-black/90 p-3 text-[10px] leading-relaxed text-red-100 shadow-xl">
          {wallet.error}
        </div>
      ) : null}
    </div>
  );
};

export default WalletButton;
