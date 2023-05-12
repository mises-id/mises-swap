import { Input, InputProps } from 'antd-mobile'
import { FC, useContext, useEffect, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { useAccount, useNetwork } from 'wagmi'
import { SwapContext } from '@/context/swapContext'
import { getBalance } from '@/api/ether'
import { fetchFeeData } from '@wagmi/core'
interface Iprops extends InputProps {
  tokens?: token,
  type: 'from' | 'to',
  tokenAddress?: string,
  onTokenChange?: (val: string) => void
  setInputChange?: (val: string) => void
}

const TokenInput: FC<Iprops> = (props) => {
  const { address } = useAccount()
  const [tokenBalance, settokenBalance] = useState('0')
  const swapContext = useContext(SwapContext)
  const { chain } = useNetwork()

  useEffect(() => {
    // get native token balance
    if(address && props.tokenAddress){
      getBalance(props.tokenAddress as address, address).then(res=>{
        if(res){
          const num = Number(res.formatted) === 0 ? '0' :  Number(res.formatted).toFixed(3)
          settokenBalance(num)
        }
      })
    }
  }, [props.tokenAddress, address])

  const toMax = async()=>{
    const feeData = await fetchFeeData({
      chainId: chain?.id
    })
    console.log(feeData.formatted.gasPrice)
    swapContext?.setFromAmount(tokenBalance)
    props.setInputChange?.(tokenBalance)
  }
  
  return <div className='token-container'>
    <div className='flex items-center'>
      <Input
        className='token-input flex-1'
        {...props} />
        <SelectTokens 
        onChange={props.onTokenChange}
        type={props.type}
        tokens={props.tokens} 
        selectTokenAddress={props.tokenAddress}/>
    </div>
    {props.tokenAddress && address && <div className='flex justify-end'>
      Balance: {tokenBalance}
      {props.type === 'from' && <span onClick={toMax} className='max'>Max</span>}
    </div>}
  </div>
}
export default TokenInput