import { sdk } from '@farcaster/miniapp-sdk';
import { MiniAppState } from '../types';

const defaultMiniAppState: MiniAppState = {
  isMiniApp: false,
  clientFid: null,
  added: false,
  userFid: null,
  platformType: null
};

export const miniAppService = {
  async getState(): Promise<MiniAppState> {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      return defaultMiniAppState;
    }

    const context = await sdk.context;
    return {
      isMiniApp: true,
      clientFid: context.client.clientFid,
      added: context.client.added,
      userFid: context.user.fid,
      platformType: context.client.platformType ?? null
    };
  },

  async ready() {
    if (!(await sdk.isInMiniApp())) {
      return;
    }

    await sdk.actions.ready();
  },

  async openUrl(url: string) {
    if (await sdk.isInMiniApp()) {
      await sdk.actions.openUrl(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  },

  async getEthereumProvider() {
    if (await sdk.isInMiniApp()) {
      return await sdk.wallet.getEthereumProvider();
    }

    return (window as any).ethereum ?? null;
  }
};
