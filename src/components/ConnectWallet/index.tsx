import { AuthenticationStatus, Chain } from '@rainbow-me/rainbowkit';
import { Button } from 'antd-mobile'
import { FC, useContext, useEffect, useState } from 'react'
import ChainList from '../ChainList';
import { isIOS, shortenAddress } from '@/utils';
import './index.less'

import {
  AutoSizer as _AutoSizer,
  List as _List,
  InfiniteLoader as _InfiniteLoader,
  ListProps,
  AutoSizerProps,
  InfiniteLoaderProps,
} from 'react-virtualized';
import HistoryList from '../HistoryList';
import CustomAvatar from '../CustomAvatar';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';
import detectEthereumProvider from '@metamask/detect-provider';
import { useRequest } from 'ahooks';
import { SwapContext } from '@/context/swapContext';
export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;
interface IProps {
  account?: {
    address: string;
    balanceDecimals?: number;
    balanceFormatted?: string;
    balanceSymbol?: string;
    displayBalance?: string;
    displayName: string;
    ensAvatar?: string;
    ensName?: string;
    hasPendingTransactions: boolean;
  };
  chain?: {
    hasIcon: boolean;
    iconUrl?: string;
    iconBackground?: string;
    id: number;
    name?: string;
    unsupported?: boolean;
  };
  mounted: boolean;
  authenticationStatus?: AuthenticationStatus;
  openAccountModal: () => void;
  openChainModal: () => void;
  openConnectModal: () => void;
  accountModalOpen: boolean;
  chainModalOpen: boolean;
  connectModalOpen: boolean;
  chains: Chain[]
}
const ConnectWallet: FC<IProps> = (props) => {

  const [isOpen, setisOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const walletClient = useWalletClient()

  const swapContext = useContext(SwapContext)

  useEffect(() => {
    if(isConnected && walletClient.isIdle){
      disconnect()
      console.log('disconnect')
    }
    // eslint-disable-next-line
  }, [])
  const reloadPage = async () => {
    // setMaxTrue()
    reloadPageCancel()
    if(window.nabox) {
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: 'Please unlock the wallet first'
      })
      return 
    }
    swapContext?.setGlobalDialogMessage({
      type: 'error',
      description: 'Failed to connect to the wallet, please refresh the page'
    })
    
    console.log('reloadPage-getEthereum', window.ethereum)
    console.log('reloadPage')
  }
  const { cancel: reloadPageCancel, run: runReload } = useRequest(reloadPage, {
    manual: true,
    pollingWhenHidden: false,
    debounceWait: 300,
  });

  const connect = async () => {
    try {
      const provider: any = await detectEthereumProvider({
        mustBeMetaMask: false,
        silent: false,
        timeout: 100
      })
      reloadPageCancel()
      runReload()
      console.log('test connnect')
      if(!window.befi && !window.nabox && provider.name !== "ezdefi" && !isIOS()) {
        await provider?.request({ method: 'eth_chainId', params: [] })
      }
      console.log('test connnect success>>>>>>')
      reloadPageCancel()
      props.openConnectModal()
    } catch (error: any) {
      console.log(error)
      reloadPageCancel()
      if(error && error.code === 4001) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: 'Please unlock the wallet first'
        })
      }else {
        props.openConnectModal()
      }
      
    }
    // props.openConnectModal()
  }
  return (
    <div className='flex items-center'>
      <ChainList chains={props.chains} chain={props.chain} openChainModal={props.openChainModal} />
      <div className='ml-10'>
        {address && props.chain?.iconUrl && <div className='flex items-center gap-2'>
          <div className='flex items-center account-info' onClick={() => {
            setisOpen(true)
          }}>
            {address && <CustomAvatar address={address} size={24} />}
            <span className='ml-10 account-address'>{shortenAddress(address)}</span>
          </div>
          <HistoryList visible={isOpen} onClose={()=>setisOpen(false)}/>
        </div>}
        {!address && <Button size='small' onClick={connect} shape='rounded' color='primary' className='connect-btn'>Connect</Button>}
      </div>
    </div>
  )
}
export default ConnectWallet