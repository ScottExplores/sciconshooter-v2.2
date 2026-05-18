import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';
import { Attribution } from 'ox/erc8021';
import { createAppKit, type AppKit } from '@reown/appkit/react';
import { base as appKitBase } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { WagmiProvider, createConfig, http, type Config } from 'wagmi';
import { base as wagmiBase } from 'wagmi/chains';
import { baseAccount, coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { DONATION_CONFIG } from './constants';

const queryClient = new QueryClient();

const appLogoUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/icon.png`
    : 'https://sciconshooter.xyz/icon.png';

const appUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://sciconshooter.xyz';

const builderDataSuffix = Attribution.toDataSuffix({
  codes: [DONATION_CONFIG.BUILDER_CODE]
});

const reownProjectId = (
  (import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined)
  || (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined)
  || (import.meta.env.DEV ? 'b56e18d47c72ab683b10814fe9495694' : undefined)
);

const appMetadata = {
  name: 'SciCon Shooter',
  description: 'Mobile-first science arcade game on Base',
  url: appUrl,
  icons: [appLogoUrl]
};

const baseAccountConnector = baseAccount({
  appName: 'SciCon Shooter',
  appLogoUrl,
  preference: {
    attribution: {
      dataSuffix: builderDataSuffix
    },
    telemetry: false
  }
});

const miniAppConnector = farcasterMiniApp();

const rpcTransport = http(DONATION_CONFIG.BASE_RPC_URL);
const appKitNetworks = [appKitBase] as [typeof appKitBase];
let appKitModal: AppKit | undefined;
let activeWagmiConfig: Config;

if (reownProjectId) {
  const wagmiAdapter = new WagmiAdapter({
    projectId: reownProjectId,
    networks: appKitNetworks,
    connectors: [
      miniAppConnector,
      baseAccountConnector
    ],
    transports: {
      [DONATION_CONFIG.BASE_CHAIN_ID]: rpcTransport
    },
    ssr: false
  });

  activeWagmiConfig = wagmiAdapter.wagmiConfig;
  appKitModal = createAppKit({
    adapters: [wagmiAdapter],
    networks: appKitNetworks,
    defaultNetwork: appKitBase,
    metadata: appMetadata,
    projectId: reownProjectId,
    themeMode: 'dark',
    defaultAccountTypes: { eip155: 'eoa' },
    enableMobileFullScreen: true,
    features: {
      analytics: false,
      email: false,
      socials: false,
      swaps: false,
      onramp: false
    },
    connectorTypeOrder: ['injected', 'featured', 'external', 'recommended', 'walletConnect', 'recent']
  });
} else {
  activeWagmiConfig = createConfig({
    chains: [wagmiBase],
    connectors: [
      miniAppConnector,
      injected({ shimDisconnect: true }),
      coinbaseWallet({
        appName: 'SciCon Shooter',
        appLogoUrl,
        preference: 'all'
      }),
      ...(reownProjectId
        ? [
            walletConnect({
              projectId: reownProjectId,
              metadata: appMetadata,
              showQrModal: true
            })
          ]
        : []),
      baseAccountConnector
    ],
    transports: {
      [wagmiBase.id]: rpcTransport
    },
    ssr: false
  });
}

export const wagmiConfig = activeWagmiConfig;

export const openReownConnectModal = async () => {
  if (!appKitModal) {
    return false;
  }

  await appKitModal.open({ view: 'Connect', namespace: 'eip155' });
  return true;
};

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
