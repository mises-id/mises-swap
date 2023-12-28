import { Button, CenterPopup, DotLoading, Image, Input, List } from 'antd-mobile'
import { CSSProperties, FC, useContext, useEffect, useState } from 'react'
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
import { useBoolean, useRequest } from 'ahooks';
import { SwapContext } from '@/context/swapContext';
import SelectedBridgeToken from '../SelectedBridgeToken';
import { substringAmount } from '@/utils';
import FallBackImage from '../Fallback';

export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;

interface Iprops {
  tokens?: token[],
  selectTokenSymbol?: string,
  onChange?: (value: string) => void,
  type: 'from' | 'to',
  status: 'ready' | undefined,
}

const BridgeSelectTokens: FC<Iprops> = (props) => {
  const swapContext = useContext(SwapContext)
  const [tokenSymbol, setTokenSymbol] = useState(props.selectTokenSymbol)

  useEffect(() => {
    // sort
    tokenListRun()
    // eslint-disable-next-line
  }, [props.tokens])
  
  useEffect(() => {
    setTokenSymbol(props.selectTokenSymbol)
  }, [props.selectTokenSymbol])

  const [toTokenSymbol, setToTokenSymbol] = useState(swapContext?.bridgeToData.symbol)

  useEffect(() => {
    setToTokenSymbol(swapContext?.bridgeToData.symbol)
  }, [swapContext?.bridgeToData.symbol])

  const [fromTokenSymbol, setFromTokenSymbol] = useState(swapContext?.bridgeFromData.symbol)

  useEffect(() => {
    setFromTokenSymbol(swapContext?.bridgeFromData.symbol)
  }, [swapContext?.bridgeFromData.symbol])
  
  const filterTokenList= async (searchValue?: string): Promise<token[]>  => {
    const searchQuery = searchValue?.toLowerCase()
    if (props.tokens) {
      const getTokenList = props.tokens.filter(val => {
        if (searchQuery && val) {
          const isSymbol = val.symbol?.toLowerCase().indexOf(searchQuery) > -1
          const isName = val.name?.toLowerCase().indexOf(searchQuery) > -1
          return isSymbol || isName
        }
        return val
      })
      if(searchQuery){
        getTokenList
        .sort((a, b) => (a.symbol || b.symbol).toLowerCase().indexOf(searchQuery) > -1 ? -1 : 1)
        .sort((a, b) => (a.symbol || b.symbol).toLowerCase() === searchQuery ? -1 : 1)
      }

      return getTokenList
      .sort((a, b) => a.name > b.name ? 1 : -1)
      .sort((a, b) => Number(a.balance) > Number(b.balance) ? -1 : 1)
    }
    return []
  }
  
  const {data: tokenList, run: tokenListRun } = useRequest(filterTokenList)

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
  }

  const [importLoading, { setTrue }] = useBoolean(false)

  const rowRenderer = ({
    index,
    key,
    style,
  }: {
    index: number
    key: string
    style: CSSProperties
  }) => {
    const item = tokenList && tokenList[index]

    if(!item) return null

    return (
      <List.Item
        key={key}
        style={style}
        className={toTokenSymbol === item?.symbol || fromTokenSymbol === item?.symbol ? 'selected-item' : ''}
        arrow={false}
        onClick={() => {
          if(!item.isImport) selectToken(item)
        }}
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
          item.isImport ? <Button className='import-token' size='mini'
          loading={importLoading}
           color='primary' onClick={(e)=>{
            e.stopPropagation()
            setTrue()
          }}>Import</Button> : <div className='token-balance'>
          <span>{substringAmount(item.balance) || 0}</span>
          {tokenSymbol === item?.symbol && <CheckOutline className='selected-icon' />}
        </div>
        }
      >
        <span className='token-name truncate' style={{maxWidth: 200}}>{item?.name}</span>
      </List.Item>
    )
  }

  //let searchVal = ""

  const search = async (val: string) => {
    tokenListRun(val)
    setSearchDefaultVal(val)
  }

  const { run } = useRequest(search, {
    debounceWait: 550,
    manual: true,
  });

  const selectToken = (token?: token) => {
    if (swapContext && token && token.symbol !== toTokenSymbol && token.symbol !== fromTokenSymbol) {
      props.onChange?.(token.symbol)
      setopen(false)
      setTokenSymbol(token.symbol)
    }
  }

  const [searchDefaultVal, setSearchDefaultVal] = useState("")

  return <div onClick={showTokenList}>
    {tokenSymbol && props.tokens?.length ? <SelectedBridgeToken tokenSymbol={tokenSymbol} status={props.status} tokens={props.tokens}/> : <UnSelectedToken />}
    <CenterPopup
      visible={open}
      closeOnMaskClick
      destroyOnClose
      showCloseButton
      onClose={() => {
        
        setopen(false)
      }}
      className="dialog-container down-dialog-style">
      <div className='dialog-header-container'>
        <p className='dialog-title'>Select a token</p>
        <div className='search-input-container'>
          <SearchOutline className='search-icon' />
          <Input defaultValue={searchDefaultVal} className='search-input' placeholder='Search the name ..' onChange={run}></Input>
        </div>
      </div>
      {!props.tokens && <div className='flex justify-center py-10' style={{height: window.innerHeight / 2}}><DotLoading color='primary' /></div>}
      <List className='token-list-container'
        style={{
          '--border-inner': 'none',
        }}>
        {tokenList?.length === 0 && <div className='text-center pt-20'>No results found.</div>}
        <AutoSizer disableHeight>
          {({ width }: { width: number }) => (
            <VirtualizedList
              rowCount={tokenList!.length}
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
export default BridgeSelectTokens