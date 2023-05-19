import { Input, InputProps } from 'antd-mobile'
import { FC, RefObject, useContext, useEffect, useImperativeHandle, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { useAccount, usePublicClient } from 'wagmi'
import { SwapContext } from '@/context/swapContext'
import { getBalance } from '@/api/ether'
import { fetchFeeData } from '@wagmi/core'
import { nativeTokenAddress } from '@/utils'
import BigNumber from 'bignumber.js'
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
  status?: 'ready' | undefined,
  ref?: RefObject<tokenInputRef>
}

const TokenInput: FC<Iprops> = (props) => {
  const { address } = useAccount()
  const [tokenBalance, settokenBalance] = useState('0')
  const swapContext = useContext(SwapContext)
  const publicClient = usePublicClient()

  const getBalanceFn = () =>{
    if(props.tokenAddress && address){
      getBalance(props.tokenAddress as address, address).then(res => {
        if (res) {
          const num = Number(res.formatted) === 0 ? '0' : res.formatted.substring(0,7)
          settokenBalance(num)
        }
      })
    }
  }

  useEffect(() => {
    // get native token balance
    if (address && props.tokenAddress) {
      getBalanceFn()
    }
    if(props.tokenAddress) {
      // getUSDTPrice()
      // formatUSD({
      //   chainShortName: 'bsc',
      //   tokenContractAddress: props.tokenAddress
      // }).then(res=>{
      //   console.log(res)
      // })
    }
    // eslint-disable-next-line
  }, [props.tokenAddress, address])
  const {ref, ...inputProps} = props

  useImperativeHandle(
    ref,
    () => ({
      getBalanceFn
    })
  )
  const toMax = async () => {
    if(props.tokenAddress === nativeTokenAddress){
      const feeData = await fetchFeeData({
        formatUnits: 'wei'
      })

      if(feeData.gasPrice && feeData.formatted.gasPrice && address) {
        const data = await publicClient.estimateContractGas({
          address: props.tokenAddress,
          functionName: 'mint',
          args: [69],
          abi: [
            {
              name: 'mint',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [{ internalType: 'uint32', name: 'tokenId', type: 'uint32' }],
              outputs: [],
            },
          ],
          account: address,
          gasPrice: feeData.gasPrice 
        })

        const gasFee = BigNumber(data.toString()).multipliedBy(10).multipliedBy(feeData.formatted.gasPrice).dividedBy(BigNumber(10).pow(18)).toNumber()
        
        const fromAmount = BigNumber(tokenBalance).minus(gasFee).toString()
        if(BigNumber(fromAmount).comparedTo(0)> -1) {
          swapContext?.setFromAmount(fromAmount)
          props.setInputChange?.(fromAmount)
        }
      }
      return 
    }
    swapContext?.setFromAmount(tokenBalance)
    props.setInputChange?.(tokenBalance)
  }

  // const formatUsd = useMemo(() => {
  //   if(props.tokenAddress){
  //     formatUSD({
  //       chainShortName: 'bsc',
  //       tokenContractAddress: props.tokenAddress
  //     })
  //   }
  //   return 0
  // }, [props.tokenAddress])
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
    {props.status !== 'ready'&& <div className='flex justify-between'>
      <div>
        {/* $ {formatUsd} */}
      </div>
      <div>
        { props.tokenAddress && address && <>
          Balance: {tokenBalance}
          {props.type === 'from' && tokenBalance !== '0' && <span onClick={toMax} className='max'>Max</span>}
        </>}
      </div>
    </div>}
  </div>
}
export default TokenInput