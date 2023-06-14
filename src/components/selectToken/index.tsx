import { CenterPopup, DotLoading, Image, Input, List } from 'antd-mobile'
import { CSSProperties, FC, useContext, useEffect, useMemo, useState } from 'react'
import './index.less'
import { CheckOutline, DownOutline, SearchOutline } from 'antd-mobile-icons'

import {
  AutoSizer as _AutoSizer,
  List as _List,
  InfiniteLoader as _InfiniteLoader,
  ListProps,
  AutoSizerProps,
  InfiniteLoaderProps,
} from 'react-virtualized';
import { useRequest } from 'ahooks';
import { SwapContext } from '@/context/swapContext';
import SelectedToken from '../SelectedToken';
import { substringAmount } from '@/utils';
import FallBackImage from '../Fallback';

export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;

interface Iprops {
  tokens?: token[],
  selectTokenAddress?: string,
  onChange?: (value: string) => void,
  type: 'from' | 'to',
  status: 'ready' | undefined,
}

const SelectTokens: FC<Iprops> = (props) => {
  const [searchName, setsearchName] = useState('')
  const swapContext = useContext(SwapContext)
  const [tokenAddress, setTokenAddress] = useState(props.selectTokenAddress)

  useEffect(() => {
    setTokenAddress(props.selectTokenAddress)
  }, [props.selectTokenAddress])

  const [toTokenAddress, setToTkenAddress] = useState(swapContext?.swapToData.tokenAddress)

  useEffect(() => {
    setToTkenAddress(swapContext?.swapToData.tokenAddress)
  }, [swapContext?.swapToData.tokenAddress])

  const [fromTokenAddress, setFromTokenAddress] = useState(swapContext?.swapFromData.tokenAddress)

  useEffect(() => {
    setFromTokenAddress(swapContext?.swapFromData.tokenAddress)
  }, [swapContext?.swapFromData.tokenAddress])

  const tokenList = useMemo(
    () => {
      if (props.tokens) {
        const searchQuery = searchName.toLocaleLowerCase()
        const getTokenList = props.tokens.filter(val => {
            if (searchName && val) {
              return val.symbol?.toLocaleLowerCase().indexOf(searchQuery) > -1 || val.name?.toLocaleLowerCase().indexOf(searchQuery) > -1
            }
            return val
          })
        if(searchQuery){
          return getTokenList
          .sort((a, b) => (a.symbol || b.symbol).toLocaleLowerCase().indexOf(searchQuery) > -1 ? -1 : 1)
          .sort((a, b) => (a.symbol || b.symbol).toLocaleLowerCase() === searchQuery ? -1 : 1)
          .sort((a, b) => a.name > b.name ? 1 : -1)
          .sort((a, b) => Number(a.balance) > Number(b.balance) ? -1 : 1)
        }else{
          return getTokenList
          .sort((a, b) => a.name > b.name ? 1 : -1)
          .sort((a, b) => Number(a.balance) > Number(b.balance) ? -1 : 1)
        }
      }
      return []
    },
    [props.tokens, searchName],
  )

  const UnSelectedToken = () => {
    return <div className={`un-select-token-item flex ${props.tokens?.length ? '' : 'disabled'}`}>
      <div>Select token</div>
      <DownOutline className='unselect-downOutline'/>
    </div>
  }

  const [open, setopen] = useState(false)
  const showTokenList = () => {
    if(props.status === 'ready' || props.tokens?.length === 0){
      return 
    }
    setopen(true)
    setsearchName('')
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
    const item = tokenList[index]
    return (
      <List.Item
        key={key}
        style={style}
        className={toTokenAddress?.toLowerCase() === item?.address.toLowerCase() || fromTokenAddress?.toLowerCase() === item?.address.toLowerCase() ? 'selected-item' : ''}
        arrow={false}
        onClick={() => selectToken(item)}
        prefix={
          <Image
            src={item?.logo_uri}
            style={{ borderRadius: 20 }}
            fit='cover'
            placeholder=""
            width={36}
            height={36}
            fallback={item?.symbol ? <FallBackImage width={36} height={36} symbol={item?.symbol} /> : ''}
          />
        }
        description={<div className='truncate' style={{maxWidth: 200}}>{item?.symbol}</div> }
        extra={
          <div className='token-balance'>
            <span>{substringAmount(item.balance) || 0}</span>
            {tokenAddress?.toLowerCase() === item?.address.toLowerCase() && <CheckOutline className='selected-icon' />}
          </div>
        }
      >
        <span className='token-name truncate' style={{maxWidth: 200}}>{item?.name}</span>
      </List.Item>
    )
  }

  const search = async (value: string) => {
    setsearchName(value)
  }

  const { run } = useRequest(search, {
    debounceWait: 550,
    manual: true,
  });

  const selectToken = (token?: token) => {
    if (swapContext && token && token.address !== toTokenAddress && token.address !== fromTokenAddress) {
      props.onChange?.(token.address)
      setopen(false)
      setTokenAddress(token.address)
    }
  }
  return <div onClick={showTokenList}>
    {tokenAddress && props.tokens?.length ? <SelectedToken tokenAddress={tokenAddress} status={props.status} tokens={props.tokens}/> : <UnSelectedToken />}
    <CenterPopup
      visible={open}
      closeOnMaskClick
      destroyOnClose
      showCloseButton
      onClose={() => {
        setopen(false)
        setsearchName('')
      }}
      className="dialog-container">
      <div className='dialog-header-container'>
        <p className='dialog-title'>Select a token</p>
        <div className='search-input-container'>
          <SearchOutline className='search-icon' />
          <Input className='search-input' placeholder='Search name' onChange={run}></Input>
        </div>
      </div>
      {!props.tokens && <DotLoading color='primary' />}
      <List className='token-list-container'
        style={{
          '--border-inner': 'none',
        }}>
        {tokenList.length === 0 && <div className='text-center pt-20'>No results found.</div>}
        <AutoSizer disableHeight>
          {({ width }: { width: number }) => (
            <VirtualizedList
              rowCount={tokenList.length}
              rowRenderer={rowRenderer}
              width={width}
              height={window.innerHeight / 2}
              rowHeight={56}
              overscanRowCount={9}
            />
          )}
        </AutoSizer>
      </List>
    </CenterPopup>
  </div>
}
export default SelectTokens