import { SwapContext, notificationData } from '@/context/swapContext'
// import { useInterval } from 'ahooks'
import React, { FC, useContext, useMemo } from 'react'
import './index.less'
import { Image } from 'antd-mobile'
import { CloseOutline } from 'antd-mobile-icons'
interface IProps {

}
const Notification:FC<IProps> = ()=> {
  const swapContext = useContext(SwapContext)
  
  const list = useMemo(() => {
    return swapContext?.notification || []
  }, [swapContext?.notification])

  // const time = list.length > 0 ? 4000 : undefined
  // const clear = useInterval(()=>{

  // }, time)
  const swapText = (val: notificationData) =>{
    const {toToken,fromToken,toTokenAmount,fromTokenAmount} = val
    if(!toTokenAmount || !fromTokenAmount || !toToken) return fromToken.symbol
    return `${fromTokenAmount} ${fromToken.symbol} for ${toTokenAmount.substring(0, toToken.decimals)} ${toToken.symbol}`
  }

  const FromToTokenIcon = (props: {
    from_token: token,
    to_token?: token
  }) => {
    if(!props.to_token) {
      return props.from_token.logo_uri ? <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon' /> : <div className='from-from-icon'>{props.from_token.symbol.split('')[0]}</div>
    }
    return <div className='relative notification-from-to-token-icon'>
      {props.from_token.logo_uri ? <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon' /> : <div className='from-from-icon'>{props.from_token.symbol.split('')[0]}</div>}
      {props.to_token.logo_uri ? <Image width={28} height={28} src={props.to_token.logo_uri} className='from-to-icon' /> : <div className='from-to-icon'>{props.to_token.symbol.split('')[0]}</div>}
    </div>
  }
  return (
    <>
    {list?.map((val: notificationData, index: number) => {
      return <div className='absolute right-3 notification flex justify-between shadow-lg' style={{top: index * 100}} key={index}>
        <div className='flex gap-4 items-center'>
          <FromToTokenIcon to_token={val.toToken} from_token={val.fromToken}/>
          <div>
            <p className='notification-title'>{val.text}</p>
            {val.fromTokenAmount &&<p className='notification-desc'>
              {swapText(val)}
            </p>}
          </div>
        </div>
        <CloseOutline className="cursor-pointer icon-color" onClick={()=>{
          swapContext?.removeNotificationData(index)
        }}/>
      </div>
    })}
    </>
  )
}

export default Notification