import { ImageProps } from 'antd-mobile'
import React, { FC } from 'react'
import './index.less'
interface IProps extends ImageProps{
  symbol: string
}

const FallBackImage:FC<IProps> = (props)=> {
  return (
    <div style={{width: props.width, height: props.height,borderRadius: '50%'}} className='flex items-center justify-center icon-bg'>
      {props.symbol.substring(0,1)}
    </div>
  )
}
export default FallBackImage
