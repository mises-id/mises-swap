import { Input, InputProps } from 'antd-mobile'
import { Ref, forwardRef, useContext, useEffect, useImperativeHandle, useState } from 'react'
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
  const [tokenBalance, settokenBalance] = useState('0')
  const swapContext = useContext(SwapContext)

  const { chain } = useNetwork()
  const getBalanceFn = async () => {
    if (props.tokenAddress && address && chain?.id) {
      console.log(props.tokenAddress, address)
      getBalance(props.tokenAddress as address, address, chain).then(res => {
        if (res) {
          const num = Number(res.formatted) === 0 ? '0' : res.formatted.substring(0, 7)
          settokenBalance(num)
        }else{
          settokenBalance('0')
        }
      }).catch(err=>{
        console.log(err)
        settokenBalance('0')
      })
    }
  }
  const { run, cancel } = useRequest(getBalanceFn,{
    debounceWait: 350,
    manual: true,
  })

  useEffect(() => {
    // get native token balance
    if (address && props.tokenAddress) {
      settokenBalance('0')
      cancel()
      run()
    }
    // if (props.tokenAddress) {
    //   // getUSDTPrice()
    //   // formatUSD({
    //   //   chainShortName: 'bsc',
    //   //   tokenContractAddress: props.tokenAddress
    //   // }).then(res=>{
    //   //   console.log(res)
    //   // })
    // }
    // eslint-disable-next-line
  }, [props.tokenAddress, address])

  const { ...inputProps } = props
  useImperativeHandle(
    ref,
    () => ({
      getBalanceFn
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

        const fromAmount = BigNumber(tokenBalance).minus(gasFee).toString()

        if (BigNumber(fromAmount).comparedTo(0) > -1) {
          swapContext?.setFromAmount(fromAmount)
          props.setInputChange?.(fromAmount)
        }
      }

      return
    }
    swapContext?.setFromAmount(tokenBalance)
    props.setInputChange?.(tokenBalance)
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
    {props.status !== 'ready' && <div className='flex justify-between'>
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
  </div>
}
export default forwardRef(TokenInput)