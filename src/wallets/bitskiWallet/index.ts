import type { InjectedConnectorOptions } from '@wagmi/core/dist/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Chain, Wallet, getWalletConnectConnector } from '@rainbow-me/rainbowkit';
import { isAndroid, isIOS } from '@/utils';
import { WindowProvider } from 'wagmi';

export interface BitskiWalletOptions {
  chains: Chain[];
}

export const bitskiWallet = ({
  chains,
  ...options
}: BitskiWalletOptions & InjectedConnectorOptions): Wallet => {
  const ethereum = window.ethereum as WindowProvider || {}

  const isInjected =
    typeof window !== 'undefined' && typeof ethereum.isBitski !== 'undefined';

  const shouldUseWalletConnect = !isInjected;
  const chromeUrl = 'https://chrome.google.com/webstore/detail/bitski/feejiigddaafeojfddjjlmfkabimkell'
  
  const config = {
    id: 'bitski',
    name: 'Bitski',
    iconUrl: async () => (await import('./bitskiWallet.svg')).default,
    iconBackground: '#fff',
    installed: !isIOS(),
    downloadUrls: {
      chrome: chromeUrl,
      browserExtension: 'https://bitski.com',
    },
    createConnector: () => {  
      const connector = shouldUseWalletConnect
        ? getWalletConnectConnector({ chains })
        : new InjectedConnector({
            chains,
            options: {
              getProvider: ()=> ethereum,
              ...options,
            },
          });
  
      return {
        connector,
        mobile: {
          getUri: shouldUseWalletConnect ? (async () => isAndroid() ? chromeUrl : '') : undefined,
        },
      };
    },
  }

  return config
};