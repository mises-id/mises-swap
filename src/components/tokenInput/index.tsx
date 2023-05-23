import { Input, InputProps, Skeleton } from 'antd-mobile'
import { Ref, forwardRef, useContext, useImperativeHandle, useMemo, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { useAccount , useNetwork } from 'wagmi'
import { SwapContext } from '@/context/swapContext'
import { getBalance } from '@/api/ether'
import { nativeTokenAddress } from '@/utils'
import BigNumber from 'bignumber.js'
import { useRequest } from 'ahooks'
export interface tokenInputRef {
  getBalanceFn: () => void
}

const networksFee: {
  [key: number]: string
} = {
  1: '0.01', // eth eth network
  137: '0.06', // matic polygon
  42161: '0.006', // eth arbitrum
  10:  '0.006', // eth optimism
  56: '0.01', //bnb bsc
}
// import { getUSDTPrice } from '@/hooks/usePrice'
interface Iprops extends InputProps {
  tokens?: token[],
  type: 'from' | 'to',
  tokenAddress?: string,
  onTokenChange?: (val: string) => void
  setInputChange?: (val: string) => void
  status?: 'ready' | undefined
}

const TokenInput = (props: Iprops, ref: Ref<tokenInputRef>) => {
  const { address } = useAccount()
  const swapContext = useContext(SwapContext)

  const { chain } = useNetwork()
  const getBalanceFn = async () => {
    const { tokenAddress } = props
    setIsSetedMax(false)
    if (tokenAddress && address && chain?.id && props.tokens?.length) {
      const res = await getBalance(tokenAddress as address, address, chain)
      if (res) {
        const num = Number(res.formatted) === 0 ? '0' : res.formatted?.substring(0, 7)
        return num
      }
    }
    return '0'
  }
  
  const { data: tokenBalance, loading, refresh } = useRequest(getBalanceFn,{
    manual: false,
    retryCount: 3,
    debounceWait: 350,
    refreshDeps: [address, props.tokenAddress, chain?.id]
  })

  // useEffect(() => {
  //   cancel()
  //   refresh()
  //   // eslint-disable-next-line
  // }, [address, props.tokenAddress, chain?.id])

  const { ...inputProps } = props

  useImperativeHandle(
    ref,
    () => ({
      getBalanceFn: refresh
    })
  )
  
  const [isSetedMax, setIsSetedMax] = useState(false)

  const toMax = async () => {
    if(chain?.id){
      setIsSetedMax(true)
      if (props.tokenAddress === nativeTokenAddress){
        const gasFee = networksFee[chain?.id] || '0.01'
        const fromAmount = BigNumber(tokenBalance || 0).minus(gasFee).toString()
        if (BigNumber(fromAmount).comparedTo(0) > -1) {
          swapContext?.setFromAmount(fromAmount)
          props.setInputChange?.(fromAmount)
          return 
        }
      }
      swapContext?.setFromAmount(tokenBalance || '0')
      props.setInputChange?.(tokenBalance || '0')
    }
  }

  const showMax = useMemo(() => {
    if(!chain?.id) return false;
    const gasFee = networksFee[chain?.id] || '0.01'

    return props.tokenAddress && address && BigNumber(tokenBalance || 0).comparedTo(gasFee) > -1
  }, [props.tokenAddress, address, tokenBalance, chain?.id])

  return <div className='token-container'>
    <div className='flex items-center'>
      <Input
        className='token-input flex-1'
        readOnly={props.status === 'ready'}
        {...inputProps} />

      <SelectTokens
        onChange={props.onTokenChange}
        type={props.type}
        tokens={props.tokens}
        status={props.status}
        selectTokenAddress={props.tokenAddress} />

    </div>
    {props.status !== 'ready' && !loading && !!props.tokens?.length && <div className='flex justify-between'>
      <div>
        {/* $ {formatUsd} */}
      </div>
      <div>
        {props.tokenAddress && address && <>
          Balance: {tokenBalance}
          {props.type === 'from' && tokenBalance !== '0' && showMax && !isSetedMax && <span onClick={toMax} className='max'>Max</span>}
        </>}
      </div>
    </div>}
    {props.status !== 'ready' && props.tokenAddress && address && loading && <div className='flex justify-end'><Skeleton animated className="custom-token-skeleton" /></div>}
  </div>
}
export default forwardRef(TokenInput)