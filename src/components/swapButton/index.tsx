import { Button, ButtonProps } from 'antd-mobile'
import { FC } from 'react'
import './index.less'
interface Iprops extends ButtonProps {
  text?: string
}

const SwapButton: FC<Iprops> = (props) => {
  return <Button
    onClick={props?.onClick}
    block
    color="primary"
    className='swap-button'>{props.text || 'Swap'}</Button>
}
export default SwapButton