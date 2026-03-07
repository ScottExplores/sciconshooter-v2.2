import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import '@coinbase/onchainkit/styles.css';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { Attribution } from 'ox/erc8021';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';
import { DONATION_CONFIG } from './constants';

const queryClient = new QueryClient();

const appLogoUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/icon.png`
    : 'https://sciconshooter.xyz/icon.png';

const builderDataSuffix = Attribution.toDataSuffix({
  codes: [DONATION_CONFIG.BUILDER_CODE]
});

export const onchainKitApiKey = import.meta.env.VITE_ONCHAINKIT_API_KEY as string | undefined;

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
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
      <OnchainKitProvider
        apiKey={onchainKitApiKey}
        chain={base}
        config={{
          appearance: {
            mode: 'auto',
            name: 'SciCon Shooter'
          }
        }}
        rpcUrl={DONATION_CONFIG.BASE_RPC_URL}
      >
        {children}
      </OnchainKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
