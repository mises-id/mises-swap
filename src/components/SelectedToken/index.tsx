import { Image } from "antd-mobile";
import { DownOutline } from "antd-mobile-icons";
import { memo, useMemo } from "react";

const SelectedToken = memo((props: {tokenAddress: string,tokens: token | undefined}) => {
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
    <DownOutline className='downOutline' />
  </div>
}, (prevProps: Readonly<{ tokenAddress: string; }>, nextProps: Readonly<{ tokenAddress: string; }>)=>{
  return prevProps.tokenAddress === nextProps.tokenAddress
})
export default SelectedToken