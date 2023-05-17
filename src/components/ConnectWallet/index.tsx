import { AuthenticationStatus, AvatarComponent, Chain } from '@rainbow-me/rainbowkit';
import { Button, CenterPopup, Image, InfiniteScroll, List } from 'antd-mobile'
import { CSSProperties, FC, useMemo, useState } from 'react'
import ChainList from '../ChainList';
import { shortenAddress } from '@/utils';
import jazzicon from '@metamask/jazzicon'
import './index.less'

import {
  AutoSizer as _AutoSizer,
  List as _List,
  InfiniteLoader as _InfiniteLoader,
  ListProps,
  AutoSizerProps,
  InfiniteLoaderProps,
} from 'react-virtualized';
import { useConnect, useDisconnect, useNetwork } from 'wagmi';
import { CloseOutline, LeftOutline } from 'antd-mobile-icons';

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

interface historyItemToken {
  address: string,
  decimals: number,
  logo_uri: string,
  name: string,
  symbol: string
}
interface historyItem {
  id: string,
  chainID: 1,
  from_address: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
  dest_receiver: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
  receipt_status: 1,
  from_token: historyItemToken,
  to_token: historyItemToken,
  fromTokenAmount: string,
  toTokenAmount: string,
  provider: {
    key: string,
    name: string,
    logo: string,
  },
  contract_address: string,
  block_at: string,
  tx:{
    hash: string,
    gas: string,
    gas_used: string,
    gas_price: string,
    block_number: string,
  },
  fee: string,
}
const ConnectWallet: FC<IProps> = (props) => {
  const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
    var el = jazzicon(size, address)
    const div = document.createElement('div')
    div.appendChild(el)
    return <div dangerouslySetInnerHTML={{ __html: div.innerHTML }}></div>
  };

  const [isOpen, setisOpen] = useState(false)

  const [hisotryList, sethisotryList] = useState<historyItem[]>([{
    id: '1',
    chainID: 1,
    from_address: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
    dest_receiver: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
    receipt_status: 1,
    from_token: {
      address: '0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153',
      decimals: 18,
      logo_uri: 'https://tokens.1inch.io/0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153.png',
      name: 'Filecoin',
      symbol: 'FIL'
    },
    to_token: {
      address: '0x0d9319565be7f53cefe84ad201be3f40feae2740',
      decimals: 18,
      logo_uri: 'https://tokens.1inch.io/0x0d9319565be7f53cefe84ad201be3f40feae2740.png',
      name: 'bDollar Share',
      symbol: 'sBDO'
    },
    fromTokenAmount: '1234',
    toTokenAmount: '5678',
    provider: {
      key: '',
      name: '',
      logo: '',
    },
    contract_address: '',
    block_at: '',
    tx:{
      hash: '0x4835099f7470f9aca3424a18e9ff7cb102ae1df38cb3a0786045d472368690f9',
      gas: '',
      gas_used: '',
      gas_price: '',
      block_number: '',
    },
    fee: ''
  },{
    id: '1',
    chainID: 1,
    from_address: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
    dest_receiver: '0xa30792E3218b73200B5d610FE0aAC619d032B267',
    receipt_status: 1,
    from_token: {
      address: '0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153',
      decimals: 18,
      logo_uri: 'https://tokens.1inch.io/0x0d8ce2a99bb6e3b7db580ed848240e4a0f9ae153.png',
      name: 'Filecoin',
      symbol: 'FIL'
    },
    to_token: {
      address: '0x0d9319565be7f53cefe84ad201be3f40feae2740',
      decimals: 18,
      logo_uri: 'https://tokens.1inch.io/0x0d9319565be7f53cefe84ad201be3f40feae2740.png',
      name: 'bDollar Share',
      symbol: 'sBDO'
    },
    fromTokenAmount: '1234',
    toTokenAmount: '5678',
    provider: {
      key: '',
      name: '',
      logo: '',
    },
    contract_address: '',
    block_at: '',
    tx:{
      hash: '0x4835099f7470f9aca3424a18e9ff7cb102ae1df38cb3a0786045d472368690f9',
      gas: '',
      gas_used: '',
      gas_price: '',
      block_number: '',
    },
    fee: ''
  }])

  const FromToTokenIcon = (props: {
    from_token: historyItemToken,
    to_token: historyItemToken
  }) => {
    return <div className='relative from-to-token-icon'>
      {props.from_token.logo_uri ? <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon'/>: <div className='from-from-icon'>{props.from_token.symbol.split('')[0]}</div>}
      {props.to_token.logo_uri ? <Image width={28} height={28} src={props.to_token.logo_uri} className='from-to-icon'/>: <div className='from-to-icon'>{props.to_token.symbol.split('')[0]}</div>}
    </div>
  }
  const rowRenderer = ({
    index,
    key,
    style,
  }: {
    index: number
    key: string
    style: CSSProperties
  }) => {
    const item = hisotryList[index]
    // const swapData = swapContext?.swapFromData
    // console.log(swapData)
    return (
      <List.Item
        key={key}
        style={style}
        className='history-item'
        arrow={false}
        onClick={()=>showDetail(item)}
        prefix={
          <FromToTokenIcon from_token={item.from_token} to_token={item.to_token}/>
        }
        extra={
          <div className='pr-12 text-right'>
            <p className='from-amount'>-{item.fromTokenAmount} {item.from_token.symbol}</p>
            <p className='to-amount'>+{item.toTokenAmount} {item.to_token.symbol}</p>
          </div>
        }
      >
        <div className='token-content'>
          {item.from_token.symbol} → {item.to_token.symbol}
        </div>
      </List.Item>
    )
  }
  const { disconnect } = useDisconnect()

  const disconnectAccount = () =>{
    disconnect()
    setisOpen(false)
  }

  const [detail, setdetail] = useState<historyItem | undefined>(undefined)
  const showDetail = (item: historyItem) =>{
    setdetail(item)
  }

  const [hasMore, sethasMore] = useState(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // const [pageNum, setpageNum] = useState(1)
  // const pageSize = 50;
  const loadMore = async ()=>{
    if (isLoading) return;
    setIsLoading(true)
    // return getData({
    //   chainID: chainId,
    //   page_size: pageSize,
    //   page_num: pageNum
    // }).then((res: any) => {
    //   const hasMore = Array.isArray(res) ? !(res?.length < pageSize) : false;
    //   currentCategary.hasMore = hasMore;
    //   if (hasMore) currentCategary.pageNum = currentCategary.pageNum + 1;
    //   if (!hasMore && !id) {
    //     // get next category
    //     const index = currentCategary.currentKeyIndex + 1;
    //     const nextCategoryItem = category[index];
    //     if (!nextCategoryItem) setHasMore(false);
    //     if (nextCategoryItem) {
    //       setactiveRequestKey(nextCategoryItem.id);
    //       const hasActiveCategory = categoryListParams.some(val => val.id === nextCategoryItem.id)
    //       if (!hasActiveCategory) {
    //         categoryListParams.push({
    //           ...nextCategoryItem,
    //           ...defalutParams,
    //           currentKeyIndex: index
    //         })
    //       }
    //     }
    //   }
    //   renderList(res, currentCategaryIndex)
    //   setIsLoading(false)
    // }).catch(() => {
    //   setIsLoading(false)
    //   throw new Error('mock request failed')
    // })
  }
  const {chain} = useNetwork()
  const chainInfo = useMemo(()=>{
    if(chain){
      return chain.blockExplorers?.default
    }
    return undefined
  }, [chain])

  const goToScan = () =>{
    const url = `${chainInfo?.url}/tx/${detail?.tx.hash}`
    window.open(url, 'target=_blank')
  }
  return (
    <div>
      {props.account ? <div className='flex items-center gap-5'>
        <ChainList chains={props.chains} chain={props.chain} openChainModal={props.openChainModal} />
        
        <div className='flex items-center account-info' onClick={() => setisOpen(true)}>
          <CustomAvatar address={props.account.address} size={24} />
          <span className='ml-10 account-address'>{shortenAddress(props.account.address)}</span>
        </div>

        <CenterPopup visible={isOpen} closeOnMaskClick showCloseButton className='dialog-container' onClose={() => {
          setisOpen(false)
          setdetail(undefined)
        }}>
          <p className='connect-dialog-title'>Account</p>

          <div className='flex justify-between items-center px-12'>
            <div className='flex items-center' onClick={() => setisOpen(true)}>
              <CustomAvatar address={props.account.address} size={40} />
              <span className='ml-10 text-16 account-address'>{shortenAddress(props.account.address)}</span>
            </div>

            <div className='connect-dialog-close-icon' onClick={disconnectAccount}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            </div>
          </div>

          <p className='account-history-title'>History</p>
          <List className='account-list-container' style={{
            '--prefix-padding-right': '0'
          }}>
            {hisotryList.length === 0 && !isLoading && <div className='text-center pt-20'>No results found.</div>}
            <AutoSizer disableHeight>
              {({ width }: { width: number }) =>  (
                <VirtualizedList
                  rowCount={hisotryList.length}
                  rowRenderer={rowRenderer}
                  width={width}
                  height={hisotryList.length > 0 ? window.innerHeight / 2 : 0}
                  rowHeight={76}
                  overscanRowCount={9}
                />
              )}
            </AutoSizer>
          </List>
          
          {hasMore && <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />}

          {detail && <div className='history-detail absolute p-16'>
            <div className='flex items-center justify-between'>
              <LeftOutline fontSize={20} className='cursor-pointer' onClick={()=>{
                setdetail(undefined)
              }}/>
              <p className='detail-dialog-title text-xl'>Transaction details</p>
              <CloseOutline fontSize={20} className='cursor-pointer' onClick={()=>{
                setisOpen(false)
                setdetail(undefined)
              }}/>
            </div>
            <Button shape='rounded' block color='primary' className='view-btn' onClick={goToScan}>View on {chainInfo?.name}</Button>
          </div>}
        </CenterPopup>
      </div> :
        <Button size='small' onClick={props.openConnectModal} shape='rounded' color='primary' className='connect-btn'>Connect Wallet</Button>}
    </div>
  )
}
export default ConnectWallet