/*
 * @Author: lmk
 * @Date: 2022-06-13 14:30:44
 * @LastEditTime: 2022-08-17 17:55:51
 * @LastEditors: lmk
 * @Description: 
 */
import { ConfigProvider, ErrorBlock, Image } from 'antd-mobile';
import { BrowserRouter } from 'react-router-dom';
import Routes from './routes';
import enUS from 'antd-mobile/es/locales/en-US'
import { RecoilRoot } from "recoil"

import '@rainbow-me/rainbowkit/styles.css';
import { AvatarComponent, ConnectButton, getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Chain, configureChains, createClient, useNetwork, WagmiConfig } from 'wagmi';
import { arbitrum, aurora, avalanche, bsc, fantom, gnosis, mainnet, optimism, polygon, zkSync } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import jazzicon from '@metamask/jazzicon'
import { useState } from 'react';
import { healthcheck } from './api/swap';
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
  const { chains, provider, webSocketProvider } = configureChains(
    [
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
    ],
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

  const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
    var el = jazzicon(size, address)
    const div = document.createElement('div')
    div.appendChild(el)
    return <div dangerouslySetInnerHTML={{ __html: div.innerHTML }}></div>
  };
  const { chain } = useNetwork()
  const [error, seterror] = useState('')
  const getHealthcheck = () => {
    const chainId = chain?.id || 1
    return healthcheck<{
      status: 'OK'
    }>(chainId).then(res => {
      if (res.data.status === 'OK') {
        seterror('')
      }
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
        <RainbowKitProvider chains={chains} avatar={CustomAvatar}>
          <RecoilRoot>
            <ConfigProvider locale={enUS}>
              <div className='flex justify-between items-center px-10'>
                <Image width={80} src='/logo192.png' />
                <div>
                  <ConnectButton accountStatus="address" chainStatus="icon" />
                </div>
              </div>

              {!error ?
                <div className='flex-1'>
                  <BrowserRouter>
                    <Routes getHealthcheck={getHealthcheck}/>
                  </BrowserRouter>
                </div> :
                <div className='flex-1 flex items-center justify-center'>
                  <ErrorBlock status='empty' title={error} description="" />
                </div>
              }

            </ConfigProvider>
          </RecoilRoot>
        </RainbowKitProvider>
      </WagmiConfig>
    </div>
  );
}

export default App;
