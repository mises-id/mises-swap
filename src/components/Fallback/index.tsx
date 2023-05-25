import { ImageProps } from 'antd-mobile'
import React, { FC } from 'react'
import './index.less'
interface IProps extends ImageProps{
  symbol: string
}

const FallBackImage:FC<IProps> = (props)=> {
  return (
    <div style={{width: props.width || 22, height: props.height || 22,borderRadius: '50%', fontSize: (Number(props.width) || 22) / 2}} className='flex items-center justify-center icon-bg'>
      {props.symbol.substring(0,1)}
    </div>
  )
}
export default FallBackImage
