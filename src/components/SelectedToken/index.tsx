import { findToken } from "@/utils";
import { Image } from "antd-mobile";
import { DownOutline } from "antd-mobile-icons";
import { memo, useMemo } from "react";
import FallBackImage from "../Fallback";
interface Iprops {tokenAddress: string, tokens: token[] | undefined, status: 'ready' | undefined}
const SelectedToken = memo((props: Iprops) => {
  const currentToken = useMemo(
    () => {
      if (props.tokenAddress && props.tokens) {
        return props.tokens && findToken(props.tokens, props.tokenAddress)
      }
    },
    [props.tokenAddress, props.tokens],
  )
  return <div className='token-item flex'>
    <div className="flex items-center">
      <Image
        width={24}
        height={24}
        src={currentToken?.logo_uri}
        placeholder=""
        fallback={currentToken?.symbol ? <FallBackImage symbol={currentToken?.symbol} /> : ''}
      />
      <span className='symbol truncate' style={{maxWidth: 100}}>{currentToken?.symbol}</span>
    </div>
    {props.status !== 'ready' && <DownOutline className='downOutline' />}
  </div>
}, (prevProps: Readonly<Iprops>, nextProps: Readonly<Iprops>)=>{
  return prevProps.tokenAddress.toLowerCase() === nextProps.tokenAddress.toLowerCase() && JSON.stringify(prevProps.tokens) === JSON.stringify(nextProps.tokens)
})
export default SelectedToken