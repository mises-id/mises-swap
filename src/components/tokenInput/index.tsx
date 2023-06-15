import { Input, InputProps } from 'antd-mobile'
import { Ref, forwardRef, useContext, useEffect, useMemo, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { useAccount , useNetwork } from 'wagmi'
import { SwapContext } from '@/context/swapContext'
import { nativeTokenAddress, substringAmount } from '@/utils'
import BigNumber from 'bignumber.js'
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
interface Iprops extends InputProps {
  tokens?: token[],
  type: 'from' | 'to',
  tokenAddress?: string,
  onTokenChange?: (val: string) => void
  setInputChange?: (val: string) => void
  status?: 'ready' | undefined,
  isTokenLoading?: boolean
}

const TokenInput = (props: Iprops, ref: Ref<tokenInputRef>) => {
  const { address } = useAccount()
  const swapContext = useContext(SwapContext)
  const [isSetedMax, setIsSetedMax] = useState(false)

  const { chain } = useNetwork()
  
  const tokenBalance = useMemo(()=> {
    if (props.tokenAddress && address && chain?.id && props.tokens?.length) {
      // setIsSetedMax(false)
      const findToken = props.tokens.find(val=>val.address.toLowerCase() === props.tokenAddress?.toLowerCase())
      return findToken && findToken.balance ? substringAmount(findToken.balance) : '0'
    }
    return '0'
  }, [props.tokenAddress, props.tokens, address, chain])

  useEffect(() => {
    if(address) {
      setIsSetedMax(false)
    }
  }, [address, props.tokenAddress, chain?.id])
  
  const { ...inputProps } = props

  const toMax = async () => {
    if(chain?.id){
      setIsSetedMax(true)
      if (props.tokenAddress?.toLowerCase() === nativeTokenAddress.toLowerCase()){
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
    if(tokenBalance ==='0.00000...') return false;
    if(props.tokenAddress?.toLowerCase() !== nativeTokenAddress.toLowerCase()) {
      return true
    }
    const gasFee = networksFee[chain?.id] || '0.01'

    return props.tokenAddress && address && BigNumber(tokenBalance || 0).comparedTo(gasFee) > -1
  }, [props.tokenAddress, address, tokenBalance, chain?.id])
  
  const priceValue = useMemo(() => {
    const token = props.tokens?.find(val=>val.address.toLowerCase() === props.tokenAddress?.toLowerCase())
    if(inputProps.value && token?.price && !BigNumber(inputProps.value).isZero()) {
      const price =  BigNumber(inputProps.value).multipliedBy(token?.price);
      if(BigNumber(price).comparedTo('0.00000001') > -1) {
        const toStringPrice = price.toString()
        const decimalPrice = toStringPrice.split('.')[1]
        if(decimalPrice && decimalPrice.length > 8) return `$${price.toFixed(8)}`
        return `$${toStringPrice}`
      }
      return '<$0.00000001'
    }
    // eslint-disable-next-line
  }, [inputProps.value, props.tokenAddress])


  
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
    {props.status !== 'ready' &&<div className='flex justify-between h-14 my-8'>
      <div>
        {priceValue && <span>{priceValue}</span>}
      </div>
      <div>
        {props.tokenAddress && address && !props.isTokenLoading && <>
          Balance: {tokenBalance}
          {props.type === 'from' && tokenBalance !== '0' && showMax && !isSetedMax && <span onClick={toMax} className='max'>Max</span>}
        </>}
      </div>
    </div>}
  </div>
}
export default forwardRef(TokenInput)