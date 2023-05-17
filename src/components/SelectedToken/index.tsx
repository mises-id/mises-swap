import { Image } from "antd-mobile";
import { DownOutline } from "antd-mobile-icons";
import { memo, useMemo } from "react";
interface Iprops {tokenAddress: string, tokens: token | undefined, status: 'ready' | undefined}
const SelectedToken = memo((props: Iprops) => {
  const findToken = useMemo(
    () => {
      if (props.tokenAddress && props.tokens) {
        return props.tokens && props.tokens[props.tokenAddress]
      }
    },
    [props.tokenAddress, props.tokens],
  )
  return <div className='token-item flex'>
    <div className="flex items-center">
      <Image
        width={24}
        height={24}
        src={findToken?.logoURI}
      />
      <span className='symbol'>{findToken?.symbol}</span>
    </div>
    {props.status !== 'ready' && <DownOutline className='downOutline' />}
  </div>
}, (prevProps: Readonly<Iprops>, nextProps: Readonly<Iprops>)=>{
  return prevProps.tokenAddress === nextProps.tokenAddress && JSON.stringify(prevProps.tokens) === JSON.stringify(nextProps.tokens)
})
export default SelectedToken