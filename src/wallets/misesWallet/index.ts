import { Chain, Wallet } from '@rainbow-me/rainbowkit';
import type { InjectedConnectorOptions } from '@wagmi/core/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';

export interface OKXWalletOptions {
  projectId?: string;
  chains: Chain[];
}

export const misesWallet = ({
  chains,
  projectId,
  ...options
}: OKXWalletOptions & InjectedConnectorOptions): Wallet => {
  // `isMisesWalletInjected` or `isMisesWalletInjected` needs to be added to the wagmi `misesEthereum` object
  // const isMisesWalletInjected =
  //   typeof window !== 'undefined' &&
  //   // @ts-expect-error
  //   typeof window.misesEthereum !== 'undefined';

  // const shouldUseWalletConnect = !isMisesWalletInjected;

  return {
    id: 'misesWallet',
    name: 'Mises Wallet',
    iconUrl: async () => (await import('./misesWallet.png')).default,
    iconAccent: '#000',
    iconBackground: '#000',
    downloadUrls: {
      android:
        'https://play.google.com/store/apps/details?id=com.okinc.okex.gp',
      ios: 'https://itunes.apple.com/app/id1327268470?mt=8',
      mobile: 'https://okx.com/download',
      qrCode: 'https://okx.com/download',
      chrome:
        'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/okx-wallet/pbpjkcldjiffchgbbndmhojiacbgflha',
      firefox: 'https://addons.mozilla.org/firefox/addon/okexwallet/',
      browserExtension: 'https://okx.com/download',
    },
    createConnector: () => {
      const connector = new InjectedConnector({
            chains,
            options: {
              //// @ts-expect-error
              getProvider: () => window.misesEthereum,
              ...options,
            },
          });

      return {
        connector,
        mobile: {
          getUri: undefined,
        },
        qrCode: undefined,
        extension: {
          instructions: {
            learnMoreUrl: 'https://okx.com/web3/',
            steps: [
              {
                description:
                  'We recommend pinning OKX Wallet to your taskbar for quicker access to your wallet.',
                step: 'install',
                title: 'Install the OKX Wallet extension',
              },
              {
                description:
                  'Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.',
                step: 'create',
                title: 'Create or Import a Wallet',
              },
              {
                description:
                  'Once you set up your wallet, click below to refresh the browser and load up the extension.',
                step: 'refresh',
                title: 'Refresh your browser',
              },
            ],
          },
        },
      };
    },
  };
};