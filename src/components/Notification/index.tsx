import { SwapContext, notificationData } from '@/context/swapContext'
// import { useInterval } from 'ahooks'
import React, { FC, useContext, useMemo } from 'react'
import './index.less'
import { Image } from 'antd-mobile'
import { CloseOutline } from 'antd-mobile-icons'
import { substringAmount } from '@/utils'
import FallBackImage from '../Fallback'
interface IProps {
}
const Notification:FC<IProps> = ()=> {
  const swapContext = useContext(SwapContext)
  
  const list = useMemo(() => {
    return swapContext?.notification || []
  }, [swapContext?.notification])

  // const swapText = (val: notificationData) =>{
  //   const {toToken,fromToken,toTokenAmount,fromTokenAmount} = val
  //   if(!toTokenAmount || !fromTokenAmount || !toToken) return fromToken?.symbol
  //   return `${fromTokenAmount} ${fromToken?.symbol} for ${substringAmount(toTokenAmount)} ${toToken.symbol}`
  // }

  const FromToTokenIcon = (props: {
    from_token: token,
    to_token?: token
  }) => {
    if(!props.to_token) {
      return <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon' 
      fallback={props.from_token?.symbol ? <FallBackImage width={28} height={28} symbol={props.from_token?.symbol} /> : ''}/>
    }
    return <div className='relative notification-from-to-token-icon'>
      <Image width={28} height={28} src={props.from_token.logo_uri} className='from-token-icon' fallback={props.from_token?.symbol ? <FallBackImage width={28} height={28} symbol={props.from_token?.symbol} /> : ''} />
      <Image width={28} height={28} src={props.to_token.logo_uri} className='from-to-icon' fallback={props.to_token?.symbol ? <FallBackImage width={28} height={28} symbol={props.to_token?.symbol} /> : ''} />
    </div>
  }
  return (
    <>
    {list?.map((val: notificationData, index: number) => {
      return <div className='absolute right-3 notification flex justify-between shadow-lg' style={{top: index * 100}} key={index}>
        <div className='flex gap-4 items-center'>
          {val.noticeType !== 'normal' && val.fromToken ? <>
          <FromToTokenIcon to_token={val.toToken} from_token={val.fromToken}/>
          <div>
            <p className='notification-title'>{val.text}</p>
            {/* {val.fromTokenAmount &&<p className='notification-desc'>
              {swapText(val)}
            </p>} */}
          </div></> : <>
          <div style={{width: 50}}>{val?.icon?.()}</div>
          <div>
            <p className='notification-title'>{val.text}</p>
            <p className='notification-desc'>
              {val.description}
            </p>
          </div>
          </>}
          
        </div>
        <CloseOutline className="cursor-pointer icon-color text-24" onClick={()=>{
          swapContext?.removeNotificationData(index)
        }}/>
      </div>
    })}
    </>
  )
}

export default Notification