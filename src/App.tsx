/*
 * @Author: lmk
 * @Date: 2022-06-13 14:30:44
 * @LastEditTime: 2022-08-17 17:55:51
 * @LastEditors: lmk
 * @Description: 
 */
import { ConfigProvider } from 'antd-mobile';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import enUS from 'antd-mobile/es/locales/en-US'
import { RecoilRoot } from "recoil"

import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton, RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, createConfig, WagmiConfig } from 'wagmi';
import { arbitrum, aurora, avalanche, bsc, fantom, gnosis, mainnet, optimism, polygon, zkSync } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import SwapProvider from './context/swapContext';
import ConnectWallet from './components/ConnectWallet';
import {
  injectedWallet,
  walletConnectWallet,
  ledgerWallet
} from '@rainbow-me/rainbowkit/wallets';
import { bitskiWallet } from './wallets/bitskiWallet';
import { bitkeepWallet } from './wallets/bitkeepWallet';
import { metaMaskWallet } from './wallets/metamask';
import { okxWallet } from './wallets/okxWallet';
import { phantomWallet } from './wallets/phantomWallet';
import { trustWallet } from './wallets/trustWallet';
// import { coinbaseWallet } from './wallets/coinbase';
const klaytnChain: Chain = {
  id: 8217,
  name: 'Klaytn Mainnet Cypress',
  network: 'Klaytn Mainnet Cypress',
  nativeCurrency: {
    decimals: 18,
    name: 'KLAY',
    symbol: 'KLAY',
  },
  rpcUrls: {
    public: {
      http: ['https://klaytn.blockpi.network/v1/rpc/public', 'https://public-node-api.klaytnapi.com/v1/cypress'],
    },
    default: {
      http: ['https://klaytn.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: { name: 'Klaytn', url: 'https://scope.klaytn.com' }
  },
  testnet: false,
};
export const chainList = [
  {
    ...mainnet,
    iconUrl: '/images/eth.svg'
  },
  {
    ...bsc,
    iconUrl: '/images/bsc.svg'
  },
  {
    ...polygon,
    iconUrl: '/images/polygon.svg'
  },
  {
    ...optimism,
    iconUrl: '/images/op.svg'
  },
  {
    ...arbitrum,
    iconUrl: '/images/arb.svg'
  },
  {
    ...gnosis,
    iconUrl: '/images/gnosis.svg'
  },
  {
    ...avalanche,
    iconUrl: '/images/ava.svg'
  },
  {
    ...fantom,
    iconUrl: '/images/fantom.svg'
  },
  {
    ...klaytnChain,
    iconUrl: '/images/klaytn.svg'
  },
  {
    ...aurora,
    iconUrl: '/images/aurora.svg'
  },
  {
    ...zkSync,
    iconUrl: '/images/zksync-era.svg'
  },
]

function App() {

  const { chains, publicClient, webSocketPublicClient } = configureChains(
    chainList,
    [publicProvider()]
  );
  const projectId = '86a06f8526c8d8b550b13c46a013cb91'
  // const { connectors } = getDefaultWallets({
  //   appName: 'Mises Swap',
  //   projectId: '86a06f8526c8d8b550b13c46a013cb91',
  //   chains,
  // });
  const connectors = connectorsForWallets([
    {
      groupName: 'Recommended',
      wallets: [
        injectedWallet({ chains }),
        metaMaskWallet({ projectId, chains }),
        // coinbaseWallet({ chains, appName: 'Mises Swap' }),
        bitskiWallet({ chains }),
        okxWallet({ projectId, chains }),
        // imTokenWallet({ projectId, chains }),
        phantomWallet({ chains }),
        // argentWallet({ chains }),
        bitkeepWallet({ chains }),
        trustWallet({ projectId, chains }),
        walletConnectWallet({ projectId, chains }),
        ledgerWallet({ projectId, chains }),
      ],
    }
  ]);

  const wagmiClient = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  return (
    <div className="App">
      <WagmiConfig config={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <RecoilRoot>
            <ConfigProvider locale={enUS}>
              <SwapProvider>
                <div className='flex justify-between items-center px-10 py-10'>
                  {/* <Image width={80} src='/logo192.png' /> */}
                  <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
                  <ConnectButton.Custom>
                    {(props) => {
                      const ready = props.mounted;
                      if (!ready) return
                      return <ConnectWallet chains={chains}  {...props} />
                    }}
                  </ConnectButton.Custom>
                </div>

                <div className='flex-1 flex flex-col'>
                  <BrowserRouter>
                    <Routes />
                  </BrowserRouter>
                </div>
              </SwapProvider>

            </ConfigProvider>
          </RecoilRoot>
        </RainbowKitProvider>
      </WagmiConfig>
    </div>
  );
}

export default App;
