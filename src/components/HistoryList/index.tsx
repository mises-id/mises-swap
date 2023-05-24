import { getOrderList } from '@/api/swap'
import { formatAmount, networkFee, shortenAddress, substringAmount } from '@/utils'
import { Button, CenterPopup, CenterPopupProps, ErrorBlock, Image, List, Loading, Toast } from 'antd-mobile'
import React, { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useDisconnect, useNetwork } from 'wagmi'
import {
  AutoSizer as _AutoSizer,
  List as _List,
  InfiniteLoader as _InfiniteLoader,
  ListProps,
  AutoSizerProps,
  InfiniteLoaderProps,
} from 'react-virtualized';
import { CloseOutline, LeftOutline } from 'antd-mobile-icons'
import { useInfiniteScroll } from 'ahooks'
import CustomAvatar from '../CustomAvatar'
import './index.less'
import dayjs from 'dayjs'
export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;

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

interface IProps extends CenterPopupProps {

}
const HistoryList: FC<IProps> = (props) => {
  const { visible: isOpen } = props
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
            <p className='to-amount'>+{substringAmount(formatAmount(item.to_token_amount, item.to_token.decimals))} {item.to_token.symbol}</p>
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
    props.onClose?.()
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
          isNoMore: res.data.data.length < pageSize,
        }
      }
      return {
        list: [],
        isNoMore: true,
      }

    } catch (error) {
      return Promise.reject(error)
    }
  }
  const { data, reload, loading, loadingMore, noMore, loadMore } = useInfiniteScroll(d => {
    const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
    return getLoadMoreList(page, PAGE_SIZE);
  }, {
    target: listRef,
    isNoMore: (d) => d?.isNoMore,
    manual: true
  });
  useEffect(() => {
    if(isOpen && address && chain?.id) reload()
    // eslint-disable-next-line
  }, [isOpen, address, chain])
  
  // const [pageNum, setpageNum] = useState(1)
  // const pageSize = 50;

  const chainInfo = useMemo(() => chain ? chain.blockExplorers?.default : undefined, [chain])

  const goToScan = () => {
    const url = `${chainInfo?.url}/tx/${detail?.tx.hash}`
    window.open(url, 'target=_blank')
  }
  
  const copy = (text: string) => {
    const input = document.createElement('input');
    input.setAttribute('readonly', 'readonly');
    input.setAttribute('value', text);
    document.body.appendChild(input);
    input.setSelectionRange(0, 9999);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    Toast.show('Copyed')
  }
  return (
    <CenterPopup visible={isOpen} closeOnMaskClick showCloseButton className='dialog-container' onClose={() => {
      props.onClose?.()
      setdetail(undefined)
    }}>
      <p className='connect-dialog-title'>Account</p>

      <div className='flex justify-between items-center px-12'>
        <div className='flex items-center'>
          {address && <CustomAvatar address={address} size={40} />}
          <span className='ml-10 text-lg history-account-address'>{shortenAddress(address)}</span>
        </div>

        <div className='connect-dialog-close-icon' onClick={disconnectAccount}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
        </div>
      </div>
      <p className='account-history-title'>History</p>
      <List className='account-list-container' style={{
        '--prefix-padding-right': '0',
        'height': window.innerHeight / 2
      }}>

        {!loading && !data?.list.length && <ErrorBlock status='empty' description=""/>}

        {/* {hisotryList.length === 0 && !isLoading && <div className='text-center pt-20'>No results found.</div>} */}
        {loading && <div className='loading flex items-center py-20 justify-center'>
          <Loading />
        </div>}

        {!loading && <AutoSizer disableHeight>
          {({ width }: { width: number }) => (
            <VirtualizedList
              ref={listRef}
              onScroll={(e)=>{
                if(e.scrollHeight - e.clientHeight === e.scrollTop){
                  loadMore()
                }
              }}
              rowCount={data?.list.length || 0}
              rowRenderer={rowRenderer}
              width={width}
              height={window.innerHeight / 2}
              rowHeight={76}
              overscanRowCount={9}
            />
          )}
        </AutoSizer>}
      </List>

      {!noMore && !loading && loadingMore && <div className='text-center py-20 flex items-center justify-center'><Loading /></div>}

      {noMore && data?.list && data.list.length > PAGE_SIZE && !loading && <p className='text-center py-20 flex items-center justify-center no-more-data'>No more data</p>}

      {detail && <div className='history-detail absolute p-16'>
        <div className='flex items-center justify-between'>
          <LeftOutline fontSize={20} className='cursor-pointer icon-color' onClick={() => {
            setdetail(undefined)
          }} />
          <p className='detail-dialog-title text-xl'>Transaction details</p>
          <CloseOutline fontSize={20} className='cursor-pointer icon-color' onClick={() => {
            props.onClose?.()
            setdetail(undefined)
          }} />
        </div>
        <div className='flex flex-col justify-between' style={{height: 'calc(100% - 40px)'}}>
          <div className='flex-none relative'>
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
                <div className='from-token-amount text-2xl'>-{formatAmount(detail.from_token_amount, detail.from_token.decimals)}</div>
              </div>
            </div>
            <div className="switch-history-token flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
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
                <div className='to-token-amount text-2xl'>{substringAmount(formatAmount(detail.to_token_amount, detail.to_token.decimals))}</div>
              </div>
            </div>
          </div>
          <div className='flex flex-col justify-between flex-grow'>
            <div className='detail-info'>
              <p className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Time</span>
                <span className='detail-info-value'>{dayjs(Number(detail.block_at) * 1000).format('DD.MM.YYYY HH:mm')}</span>
              </p>
              <div className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Hash</span>
                <div className='flex items-center gap-2 cursor-pointer' onClick={()=>copy(detail.tx.hash)}>
                  <span className='detail-info-value'>{shortenAddress(detail.tx.hash)}</span>
                  <Image
                    width={12}
                    height={12}
                    src='/images/copy.svg'
                  />
                </div>
              </div>
              <div className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Receiver</span>
                <div className='flex items-center gap-2 cursor-pointer'  onClick={()=>copy(detail.dest_receiver)}>
                  <span className='detail-info-value'>{shortenAddress(detail.dest_receiver)}</span>
                  <Image
                    width={12}
                    height={12}
                    src='/images/copy.svg'
                  />
                </div>
              </div>
              <p className='flex justify-between items-center pt-20'>
                <span className='detail-info-label'>Transaction cost</span>
                <span className='detail-info-value'>{networkFee(detail.tx.gas_used, detail.tx.gas_price)} {chain?.nativeCurrency.symbol} </span>
              </p>
            </div>

            <Button shape='rounded' block color='primary' className='view-btn' onClick={goToScan}>View on {chainInfo?.name}</Button>
          </div>
        </div>
      </div>}
    </CenterPopup>
  )
}

export default HistoryList