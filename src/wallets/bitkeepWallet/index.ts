import type { InjectedConnectorOptions } from '@wagmi/core/dist/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Chain, Wallet, getWalletConnectConnector } from '@rainbow-me/rainbowkit';
import { isAndroid, isIOS } from '@/utils';
import { WindowProvider } from 'wagmi';

export interface BitkeepWalletOptions {
  chains: Chain[];
}

export const bitkeepWallet = ({
  chains,
  ...options
}: BitkeepWalletOptions & InjectedConnectorOptions): Wallet => {
  const ethereum = window.bitkeep ? window.bitkeep.ethereum as WindowProvider : undefined

  const isInjected =
    typeof window !== 'undefined' && typeof ethereum !== 'undefined';

  const shouldUseWalletConnect = !isInjected;
  const chromeUrl = 'https://chrome.google.com/webstore/detail/bitkeep-crypto-nft-wallet/jiidiaalihmmhddjgbnbgdfflelocpak'
  
  const config = {
    id: 'bitkeep',
    name: 'BitKeep',
    iconUrl: async () => (await import('./bitkeep.png')).default,
    iconBackground: '#693cf0',
    installed: !isIOS(),
    downloadUrls: {
      chrome: chromeUrl,
      browserExtension: 'https://bitkeep.com/en/download?type=2',
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