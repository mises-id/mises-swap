/*
 * @Author: lmk
 * @Date: 2022-06-13 14:30:44
 * @LastEditTime: 2022-08-17 17:55:51
 * @LastEditors: lmk
 * @Description: 
 */
import { ConfigProvider, ErrorBlock } from 'antd-mobile';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import enUS from 'antd-mobile/es/locales/en-US'
import { RecoilRoot } from "recoil"

import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton, getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, createClient, useNetwork, WagmiConfig } from 'wagmi';
import { arbitrum, aurora, avalanche, bsc, fantom, gnosis, mainnet, optimism, polygon, zkSync } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { useState } from 'react';
import { healthcheck } from './api/swap';
import SwapProvider from './context/swapContext';
import ConnectWallet from './components/ConnectWallet';
function App() {
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
  const chainList = [
    mainnet,
    bsc,
    polygon,
    optimism,
    arbitrum,
    {
      ...gnosis,
      iconUrl: '/images/gnosis.svg'
    },
    avalanche,
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
  const { chains, provider, webSocketProvider } = configureChains(
    chainList,
    [publicProvider()]
  );

  const { connectors } = getDefaultWallets({
    appName: 'Mises Swap',
    projectId: '86a06f8526c8d8b550b13c46a013cb91',
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
  });

  const { chain } = useNetwork()
  const [error, seterror] = useState('')

  const getHealthcheck = () => {
    const chainId = chain?.id || 1;
    const isChain = chains.some(val => `${val.id}` === `${chainId}`)

    if (!isChain) {
      seterror('Wrong network, please switch network')
      return Promise.reject('Wrong network, please switch network')
    }

    return healthcheck<{
      status: 'OK'
    }>(chainId).then(res => {
      if (res.data.status === 'OK') seterror('')
    }).catch(err => {
      if (err.statusCode === 404) {
        seterror('Wrong network, please switch network')
        return
      }
      seterror(err.message)
    })
  }

  return (
    <div className="App">
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <RecoilRoot>
            <ConfigProvider locale={enUS}>
              <div className='flex justify-between items-center px-10 py-10'>
                {/* <Image width={80} src='/logo192.png' /> */}
                <p className='swap-title'>Mises <span>Swap</span></p>
                <ConnectButton.Custom>
                  {(props) => {
                    const ready = props.mounted;
                    if(!ready) return 
                    return <ConnectWallet chains={chains} {...props} />
                  }}
                </ConnectButton.Custom>
              </div>
              <SwapProvider>
                {!error ?
                  <div className='flex-1'>
                    <BrowserRouter>
                      <Routes getHealthcheck={getHealthcheck} />
                    </BrowserRouter>
                  </div> :
                  <div className='flex-1 flex items-center justify-center'>
                    <ErrorBlock status='empty' title={error} description="" />
                  </div>
                }
              </SwapProvider>

            </ConfigProvider>
          </RecoilRoot>
        </RainbowKitProvider>
      </WagmiConfig>
    </div>
  );
}

export default App;
