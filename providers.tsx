import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { Attribution } from 'ox/erc8021';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseAccount, coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { DONATION_CONFIG } from './constants';

const queryClient = new QueryClient();

const appLogoUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/icon.png`
    : 'https://sciconshooter.xyz/icon.png';

const builderDataSuffix = Attribution.toDataSuffix({
  codes: [DONATION_CONFIG.BUILDER_CODE]
});

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined;

const browserWalletConnectors = [
  injected({ shimDisconnect: true }),
  coinbaseWallet({
    appName: 'SciCon Shooter',
    appLogoUrl,
    preference: 'all'
  }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: 'SciCon Shooter',
            description: 'Mobile-first science arcade game on Base',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://sciconshooter.xyz',
            icons: [appLogoUrl]
          },
          showQrModal: true
        })
      ]
    : [])
];

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    ...browserWalletConnectors,
    baseAccount({
      appName: 'SciCon Shooter',
      appLogoUrl,
      preference: {
        attribution: {
          dataSuffix: builderDataSuffix
        },
        telemetry: false
      }
    })
  ],
  transports: {
    [base.id]: http(DONATION_CONFIG.BASE_RPC_URL)
  },
  ssr: false
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  </WagmiProvider>
);
