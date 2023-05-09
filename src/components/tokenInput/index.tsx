import { Input, InputProps } from 'antd-mobile'
import { FC, useContext, useEffect, useState } from 'react'
import './index.less'
import SelectTokens from '../selectToken'
import { SwapContext } from '@/context/swapContext'
interface Iprops extends InputProps {
  tokens?: token,
  type: 'from' | 'to',
  defaultTokenAddress?: string
}

const TokenInput: FC<Iprops> = (props) => {
  const [tokenAddress, setTokenAddress] = useState(props.defaultTokenAddress)
  const swapContext = useContext(SwapContext)
  useEffect(() => {
    if(swapContext && tokenAddress){
      swapContext.swapData[props.type] = {
        tokenAddress: tokenAddress
      }
      swapContext?.setswapData({
        ...swapContext.swapData
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress])
  
  return <div className='token-container'>
    <div className='flex items-center'>
      <Input
        className='token-input flex-1'
        {...props} />
        <SelectTokens 
        tokens={props.tokens} 
        selectTokenAddress={tokenAddress} 
        setTokenAddress={setTokenAddress}/>
    </div>
  </div>
}
export default TokenInput