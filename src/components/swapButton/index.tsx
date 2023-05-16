import { Button, ButtonProps } from 'antd-mobile'
import { FC, useContext, useMemo } from 'react'
import './index.less'
import { SwapContext } from '@/context/swapContext'

const swapStatus = {
  99999: 'Swap',
  1: 'Connect wallet',
  2: 'Select token',
  3: 'Enter an amount',
  4: (token: string)=>`Insufficient ${token} balance`,
  5: 'Insufficient liquidity',
  6: 'Cannot estimate',
  7: 'Not enough balance',
  8: 'Not enough allowance',
  9: (token: string)=>`Approve use of ${token}`,
  10: 'Approval pending',
  11: 'No payment channel found'
}

export type status = keyof typeof swapStatus
interface Iprops extends ButtonProps {
  text?: string
}

const SwapButton: FC<Iprops> = (props) => {
  const swapContext = useContext(SwapContext)
  const status = swapContext?.status
  const text = useMemo((): string=>{
    let message = swapStatus[status as status]

    if(status && [4, 9].includes(status)){
      console.log(swapContext?.swapFromData, 'swapContext?.swapFromDataswapContext?.swapFromData===')
      const token = swapContext?.swapFromData
      const fn = swapStatus[status as status] as any
      message = fn(token?.symbol)
    }
    return message as string
  // eslint-disable-next-line
  }, [status, swapContext?.swapFromData.tokenAddress])

  const isDisabled = useMemo(()=>{
    return (status && ![99999, 1, 9].includes(status)) || false
  }, [status])

  return <Button
    onClick={props?.onClick}
    block
    {...props}
    color="primary"
    disabled={isDisabled}
    className='swap-button'>{text}</Button>
}
export default SwapButton