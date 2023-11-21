import './index.less'
import { Input, InputProps } from 'antd-mobile'
import { Ref, forwardRef, useContext} from 'react'
import BridgeSelectTokens from '../bridgeSelectToken'
import { SwapContext } from '@/context/swapContext'

export interface BridgeTokenInputRef {
  // getBalanceFn: () => void
}

interface Iprops extends InputProps {
  tokens?: token[],
  type: 'from' | 'to',
  tokenAddress?: string,
  onTokenChange?: (val: string) => void
  onInputChange?: (val: string) => void
  status?: 'ready' | undefined,
  isTokenLoading?: boolean
}

const BridgeTokenInput = (props: Iprops, ref: Ref<BridgeTokenInputRef>) => {
  const swapContext = useContext(SwapContext)
  const { ...inputProps } = props

  return <div className='token-container'>
    <div className='flex items-center'>
      <Input
        className='token-input flex-1'
        readOnly={props.type === 'to'}
        onChange={props.onInputChange}
        {...inputProps} />
      <BridgeSelectTokens
        onChange={props.onTokenChange}
        type={props.type}
        tokens={props.tokens}
        status={props.status}
        selectTokenAddress={props.tokenAddress} />
    </div>
    {props.type == "from" && <div>{swapContext!.bridgeAmountCheckMsg}</div>}
  </div>
}
export default forwardRef(BridgeTokenInput)
