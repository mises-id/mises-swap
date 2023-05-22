import { Input, InputProps, Skeleton } from 'antd-mobile'
import { Ref, forwardRef, useContext, useImperativeHandle } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { useAccount , useNetwork } from 'wagmi'
import { SwapContext } from '@/context/swapContext'
import { getBalance } from '@/api/ether'
import { nativeTokenAddress, parseAmount } from '@/utils'
import { getQuote } from '@/api/swap'
import BigNumber from 'bignumber.js'
import { fetchFeeData } from '@wagmi/core'
import { useRequest } from 'ahooks'
export interface tokenInputRef {
  getBalanceFn: () => void
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
    if (tokenAddress && address && chain?.id) {
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

  const toMax = async () => {
    const findToken = props.tokens?.find(val=>val.address!==nativeTokenAddress)
    if (props.tokenAddress === nativeTokenAddress && chain?.id && findToken) {
      const res = await getQuote<{ data: swapData[] }, quoteParams>({
        chain_id: chain?.id,
        from_token_address: nativeTokenAddress,
        to_token_address: findToken?.address,
        amount: parseAmount('1', 18)
      })

      const feeData = await fetchFeeData({
        formatUnits: 'wei'
      })

      const [firstTrade] = res.data.data

      if (firstTrade && !firstTrade.error && firstTrade.estimate_gas_fee && feeData.formatted.gasPrice) {
        const gasFee = BigNumber(firstTrade.estimate_gas_fee).multipliedBy(feeData.formatted.gasPrice).dividedBy(BigNumber(10).pow(18)).toNumber()

        const fromAmount = BigNumber(tokenBalance || 0).minus(gasFee).toString()

        if (BigNumber(fromAmount).comparedTo(0) > -1) {
          swapContext?.setFromAmount(fromAmount)
          props.setInputChange?.(fromAmount)
        }
      }

      return
    }
    swapContext?.setFromAmount(tokenBalance || '0')
    props.setInputChange?.(tokenBalance || '0')
  }

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
    {props.status !== 'ready' && !loading && <div className='flex justify-between'>
      <div>
        {/* $ {formatUsd} */}
      </div>
      <div>
        {props.tokenAddress && address && <>
          Balance: {tokenBalance}
          {props.type === 'from' && tokenBalance !== '0' && <span onClick={toMax} className='max'>Max</span>}
        </>}
      </div>
    </div>}
    {props.tokenAddress && address && loading && <div className='flex justify-end'><Skeleton animated className="custom-token-skeleton" /></div>}
  </div>
}
export default forwardRef(TokenInput)