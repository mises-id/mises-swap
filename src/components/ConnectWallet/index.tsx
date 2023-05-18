import { AuthenticationStatus, AvatarComponent, Chain } from '@rainbow-me/rainbowkit';
import { Button, CenterPopup, Image, List, Loading } from 'antd-mobile'
import { CSSProperties, FC, useMemo, useRef, useState } from 'react'
import ChainList from '../ChainList';
import { formatAmount, networkFee, shortenAddress } from '@/utils';
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
import { useAccount, useDisconnect, useNetwork } from 'wagmi';
import { CloseOutline, LeftOutline } from 'antd-mobile-icons';
import { useInfiniteScroll } from 'ahooks';
import { getOrderList } from '@/api/swap';

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

interface historyItem {
  id: string,
  chain_id: number,
  from_address: string,
  dest_receiver: string,
  receipt_status: number,
  from_token: token,
  to_token: token,
  from_token_amount: string,
  to_token_amount: string,
  provider: {
    key: string,
    name: string,
    logo: string,
  },
  contract_address: string,
  block_at: string,
  tx: {
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

  const FromToTokenIcon = (props: {
    from_token: token,
    to_token: token
  }) => {
    return <div className='relative from-to-token-icon'>
      {props.from_token.logo_uri ? <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon' /> : <div className='from-from-icon'>{props.from_token.symbol.split('')[0]}</div>}
      {props.to_token.logo_uri ? <Image width={28} height={28} src={props.to_token.logo_uri} className='from-to-icon' /> : <div className='from-to-icon'>{props.to_token.symbol.split('')[0]}</div>}
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
    const item: historyItem = data?.list[index]
    // const swapData = swapContext?.swapFromData
    // console.log(swapData)
    return (
      <List.Item
        key={key}
        style={style}
        className='history-item'
        arrow={false}
        onClick={() => showDetail(item)}
        prefix={
          <FromToTokenIcon from_token={item.from_token} to_token={item.to_token} />
        }
        extra={
          <div className='pr-12 text-right'>
            <p className='from-amount'>-{formatAmount(item.from_token_amount, item.from_token.decimals)} {item.from_token.symbol}</p>
            <p className='to-amount'>+{formatAmount(item.to_token_amount, item.to_token.decimals)} {item.to_token.symbol}</p>
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

  const disconnectAccount = () => {
    disconnect()
    setisOpen(false)
  }

  const [detail, setdetail] = useState<historyItem | undefined>(undefined)
  const showDetail = (item: historyItem) => {
    setdetail(item)
  }
  const PAGE_SIZE = 10;

  const { chain } = useNetwork()
  const { address } = useAccount()

  const listRef = useRef<HTMLDivElement>(null)
  const getLoadMoreList = async (page: number, pageSize: number): Promise<{
    list: historyItem[]
    isNoMore: boolean
  }> => {
    try {
      if (address) {
        const res = await getOrderList(address, {
          chain_id: chain?.id,
          page_size: pageSize,
          page_num: page
        })

        const list = res.data.data

        return {
          list: list,
          isNoMore: true,
        }
      }
      return {
        list: [],
        isNoMore: false,
      }

    } catch (error) {
      return Promise.reject(error)
    }
  }
  const { data, reload, loading, loadingMore, noMore } = useInfiniteScroll(d => {
    const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
    return getLoadMoreList(page, PAGE_SIZE);
  }, {
    target: listRef,
    isNoMore: (d) => d?.isNoMore,
    manual: true
  });
  // const [pageNum, setpageNum] = useState(1)
  // const pageSize = 50;

  const chainInfo = useMemo(() => chain ? chain.blockExplorers?.default : undefined, [chain])

  const goToScan = () => {
    const url = `${chainInfo?.url}/tx/${detail?.tx.hash}`
    window.open(url, 'target=_blank')
  }
  return (
    <div>
      {props.account ? <div className='flex items-center gap-5'>
        <ChainList chains={props.chains} chain={props.chain} openChainModal={props.openChainModal} />

        <div className='flex items-center account-info' onClick={() => {
          setisOpen(true)
          reload()
        }}>
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

          {!loading && <p className='account-history-title'>History</p>}
          <List className='account-list-container' style={{
            '--prefix-padding-right': '0'
          }}>
            {/* {hisotryList.length === 0 && !isLoading && <div className='text-center pt-20'>No results found.</div>} */}
            {loading && <div className='loading flex items-center py-20 justify-center'>
              <Loading />
            </div>}

            <AutoSizer disableHeight 
                  ref={listRef}>
              {({ width }: { width: number }) => (
                <VirtualizedList
                  rowCount={data?.list.length || 0}
                  rowRenderer={rowRenderer}
                  width={width}
                  height={window.innerHeight / 2}
                  rowHeight={76}
                  overscanRowCount={9}
                />
              )}
            </AutoSizer>
          </List>

          {!noMore && !loading && loadingMore && <div className='text-center py-20 flex items-center justify-center'><Loading /></div>}

          {noMore && data?.list && data.list.length > PAGE_SIZE && <p className='text-center py-20 flex items-center justify-center no-more-data'>No more data</p>}

          {detail && <div className='history-detail absolute p-16'>
            <div className='flex items-center justify-between'>
              <LeftOutline fontSize={20} className='cursor-pointer' onClick={() => {
                setdetail(undefined)
              }} />
              <p className='detail-dialog-title text-xl'>Transaction details</p>
              <CloseOutline fontSize={20} className='cursor-pointer' onClick={() => {
                setisOpen(false)
                setdetail(undefined)
              }} />
            </div>
            <div className='swap-token-item'>
              <p className='token-item-title'>You sold</p>
              <div className='flex justify-between items-center'>
                <div className='token-info flex items-center gap-2 justify-center cursor-pointer'>
                  <Image
                      width={24}
                      height={24}
                      src={detail.from_token.logo_uri}
                  />
                  <span className='swap-token-item-name'>{detail.from_token.symbol}</span>
                </div>
                <div className='from-token-amount'>-{formatAmount(detail.from_token_amount, detail.from_token.decimals)}</div>
              </div>
            </div>
            <div className='swap-token-item'>
              <p className='token-item-title'>You bought</p>
              <div className='flex justify-between items-center'>
                <div className='token-info flex items-center gap-2 justify-center cursor-pointer'>
                  <Image
                      width={24}
                      height={24}
                      src={detail.to_token.logo_uri}
                  />
                  <span className='swap-token-item-name'>{detail.to_token.symbol}</span>
                </div>
                <div className='from-token-amount'>{formatAmount(detail.to_token_amount, detail.to_token.decimals)}</div>
              </div>
            </div>
            <div className='detail-info'>
              <p className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Time</span>
                <span>{detail.block_at}</span>
              </p>
              <div className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Hash</span>
                <div className='flex items-center gap-2'>
                  <span>{shortenAddress(detail.tx.hash)}</span>
                  <Image
                      width={12}
                      height={12}
                      src='/images/copy.svg'
                  />
                </div>
              </div>
              <div className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Receiver</span>
                <div className='flex items-center gap-2'>
                  <span>{shortenAddress(detail.dest_receiver)}</span>
                  <Image
                      width={12}
                      height={12}
                      src='/images/copy.svg'
                  />
                </div>
              </div>
              <p className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Transaction cost</span>
                <span>{networkFee(detail.tx.gas_used, detail.tx.gas_price)} </span>
              </p>
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