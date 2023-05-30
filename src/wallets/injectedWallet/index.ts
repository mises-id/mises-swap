import { Chain, Wallet } from '@rainbow-me/rainbowkit';
import type { InjectedConnectorOptions } from '@wagmi/core/dist/connectors/injected';
import { InjectedConnector } from 'wagmi/connectors/injected';

export interface InjectedWalletOptions {
  chains: Chain[];
}

export const injectedWallet = ({
  chains,
  ...options
}: InjectedWalletOptions & InjectedConnectorOptions): Wallet => ({
  id: 'injected',
  name: 'Injected Wallet',
  iconUrl: async () => (await import('./injectedWallet.svg')).default,
  iconBackground: '#fff',
  createConnector: () => ({
    connector: new InjectedConnector({
      chains,
      options: {
        ...options,
      },
    }),
  }),
});
