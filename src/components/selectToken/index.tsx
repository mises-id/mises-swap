import { ButtonProps, CenterPopup, DotLoading, Image, Input, List } from 'antd-mobile'
import { CSSProperties, Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react'
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

export const VirtualizedList = _List as unknown as FC<ListProps> & _List;
// You need this one if you'd want to get the list ref to operate it outside React 👍 
export type VirtualizedListType = typeof VirtualizedList;

export const AutoSizer = _AutoSizer as unknown as FC<AutoSizerProps> & _AutoSizer;
export const InfiniteLoader = _InfiniteLoader as unknown as FC<InfiniteLoaderProps> & _InfiniteLoader;

interface Iprops extends ButtonProps {
  tokens?: token,
  selectTokenAddress?: string,
  setTokenAddress?: Dispatch<SetStateAction<string | undefined>>
}

const SelectTokens: FC<Iprops> = (props) => {
  const [searchName, setsearchName] = useState('')
  const swapContext = useContext(SwapContext)
  const tokenList = useCallback(
    () => {
      if (props.tokens) {
        const getTokenList = Object.keys(props.tokens)
          .map(key => props.tokens && props.tokens[key])
          .filter(val => {
            if (searchName && val) {
              const regex = new RegExp(searchName.split('').join('|'))
              return regex.test(val.symbol.toLocaleLowerCase())
            }
            return val
          })
        const findAllNameList = getTokenList.filter(val=>val?.symbol.toLocaleLowerCase() === searchName)
        return findAllNameList.length > 0 ? findAllNameList : getTokenList
      }
      return []
    },
    [props.tokens, searchName],
  )

  const findToken = useCallback(
    () => {
      if (props.selectTokenAddress && props.tokens) {
        return props.tokens && props.tokens[props.selectTokenAddress]
      }
    },
    [props.selectTokenAddress, props.tokens],
  )

  const SelectedToken = () => {
    const token = findToken()
    return <div className='token-item flex'>
      <div className="flex items-center">
        <Image
          width={24}
          height={24}
          src={token?.logoURI}
        />
        <span className='symbol'>{token?.symbol}</span>
      </div>
      <DownOutline className='downOutline' />
    </div>
  }

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

  // const isSelected = (item?: token[number])=>{
  //   return item && (swapContext?.swapData.from.tokenAddress === item?.address || swapContext?.swapData.from.tokenAddress === item?.address)
  // }
  const rowRenderer = ({
    index,
    key,
    style,
  }: {
    index: number
    key: string
    style: CSSProperties
  }) => {
    const item = tokenList()[index]
    return (
      <List.Item
        key={key}
        style={style}
        className={swapContext?.swapData.from.tokenAddress === item?.address || swapContext?.swapData.to.tokenAddress === item?.address ? 'selected-item' : ''}
        arrow={false}
        onClick={()=>selectToken(item)}
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
            {props.selectTokenAddress === item?.address && <CheckOutline className='selected-icon'/>}
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
    if(swapContext && token && token.address !== swapContext?.swapData.to.tokenAddress && token.address !== swapContext?.swapData.from.tokenAddress){
      props.setTokenAddress?.(token.address)
      setopen(false)
    }
  }
  return <div>
    <div>
      <div onClick={showTokenList}>
        {props.selectTokenAddress ? <SelectedToken /> : <UnSelectedToken />}
      </div>

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
          {/* eslint-disable-next-line react-hooks/exhaustive-deps */}
          <AutoSizer disableHeight>
            {({ width }: { width: number }) => (
              <VirtualizedList
                rowCount={tokenList().length}
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
  </div>
}
export default SelectTokens