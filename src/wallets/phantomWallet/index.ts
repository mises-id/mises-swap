import { isAndroid } from '@/utils';
import { Chain, Wallet, getWalletConnectConnector } from '@rainbow-me/rainbowkit';
import type { InjectedConnectorOptions } from '@wagmi/core/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';

export interface PhantomWalletOptions {
  chains: Chain[];
  projectId?: string;
}

export const phantomWallet = ({
  chains,
  projectId,
  ...options
}: PhantomWalletOptions & InjectedConnectorOptions): Wallet => {
  const isInjected =
    typeof window !== 'undefined' && !!((window as any).phantom as any)?.ethereum;
  const shouldUseWalletConnect = !isInjected;
  
  return {
    id: 'phantom',
    name: 'Phantom',
    iconUrl: async () => (await import('./phantomWallet.svg')).default,
    iconBackground: '#551BF9',
    iconAccent: '#551BF9',
    installed:
      (typeof window !== 'undefined' &&
        !!((window as any).phantom as any)?.ethereum) ||
      undefined,
    downloadUrls: {
      android: 'https://play.google.com/store/apps/details?id=app.phantom',
      ios: 'https://apps.apple.com/app/phantom-solana-wallet/1598432977',
      mobile: 'https://phantom.app/download',
      qrCode: 'https://phantom.app/download',
      chrome:
        'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
      firefox: 'https://addons.mozilla.org/firefox/addon/phantom-app/',
      browserExtension: 'https://phantom.app/download',
    },
    createConnector: () => {
      const connector = shouldUseWalletConnect
        ? getWalletConnectConnector({ projectId, chains })
        : new InjectedConnector({
            chains,
            options: {
              getProvider: () =>
              typeof window !== 'undefined'
                ? ((window as any).phantom as any)?.ethereum
                : undefined,
              ...options,
            },
          });

      return {
        connector,
        mobile: {
          getUri: shouldUseWalletConnect
            ? async () => {
              // @ts-expect-error
                const { uri } = (await connector.getProvider()).connector;
                if(isAndroid()) {
                  return 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa'
                }
                return isAndroid()
                  ? uri
                  : 'https://phantom.app/download';
              }
            : undefined,
        },
        extension: {
          instructions: {
            steps: [
              {
                description:
                  'We recommend pinning Phantom to your taskbar for easier access to your wallet.',
                step: 'install',
                title: 'Install the Phantom extension',
              },
              {
                description:
                  'Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone.',
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
            learnMoreUrl: 'https://help.phantom.app',
          },
        },
      };
    },
  };
};
