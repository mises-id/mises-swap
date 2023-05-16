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

export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;

interface Iprops {
  tokens?: token,
  selectTokenAddress?: string,
  onChange?: (value: string) => void,
  type: 'from' | 'to',
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
        const getTokenList = Object.keys(props.tokens)
          .map(key => props.tokens && props.tokens[key]).filter(val => {
            if (searchName && val) {
              return val.symbol?.toLocaleLowerCase().indexOf(searchQuery) > -1 || val.name?.toLocaleLowerCase().indexOf(searchQuery) > -1
            }
            return val
          })
        const findAllNameList = getTokenList.filter(val => val?.symbol?.toLocaleLowerCase() === `searchQuery`)
        return findAllNameList.length > 0 ? findAllNameList : getTokenList
      }
      return []
    },
    [props.tokens, searchName],
  )

  const UnSelectedToken = () => {
    return <div className='un-select-token-item flex'>
      <div>Select token</div>
      <DownOutline className='downOutline' />
    </div>
  }

  const [open, setopen] = useState(false)
  const showTokenList = () => {
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
    // const swapData = swapContext?.swapFromData
    // console.log(swapData)
    return (
      <List.Item
        key={key}
        style={style}
        className={toTokenAddress === item?.address || fromTokenAddress === item?.address ? 'selected-item' : ''}
        arrow={false}
        onClick={() => selectToken(item)}
        prefix={
          <Image
            src={item?.logoURI}
            style={{ borderRadius: 20 }}
            fit='cover'
            width={36}
            height={36}
          />
        }
        description={item?.symbol}
        extra={
          <div className='token-balance'>
            <span>0</span>
            {tokenAddress === item?.address && <CheckOutline className='selected-icon' />}
          </div>
        }
      >
        <span className='token-name'>{item?.name}</span>
      </List.Item>
    )
  }

  const search = async (value: string) => {
    setsearchName(value)
  }

  const { run } = useRequest(search, {
    debounceWait: 350,
    manual: true,
  });

  const selectToken = (token?: token[number]) => {
    if (swapContext && token && token.address !== toTokenAddress && token.address !== fromTokenAddress) {
      props.onChange?.(token.address)
      setopen(false)
      setTokenAddress(token.address)
    }
  }
  return <div onClick={showTokenList}>
    {tokenAddress ? <SelectedToken tokenAddress={tokenAddress} tokens={props.tokens}/> : <UnSelectedToken />}
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
    {/* <div>1222</div> */}
  </div>
}
export default SelectTokens