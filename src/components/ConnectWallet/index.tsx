import { AuthenticationStatus, Chain } from '@rainbow-me/rainbowkit';
import { Button } from 'antd-mobile'
import { FC, useState } from 'react'
import ChainList from '../ChainList';
import { shortenAddress } from '@/utils';
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
import { useAccount } from 'wagmi';
import { getWalletClient } from '@wagmi/core' 
import { useAsyncEffect } from 'ahooks';
import { useDisconnect } from 'wagmi';

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
  const { address} = useAccount()
  console.log(address)
  const { disconnect } = useDisconnect()

  useAsyncEffect(async () => {
    setTimeout(async () => {
      const provider = await getWalletClient()
      if(!provider && address){
        disconnect()
        // window.location.reload()
      }
    }, 300);
  }, [])

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
        {!address && <Button size='small' onClick={props.openConnectModal} shape='rounded' color='primary' className='connect-btn'>Connect</Button>}
      </div>
    </div>
  )
}
export default ConnectWallet