import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from "react";
import { useAccount } from "wagmi";

// type swapType = 'to' | 'from'
interface swapData {
  tokenAddress: string,
  symbol?: string
  decimals?: number
};
interface globalDialogMessageData {
  type: 'error' | 'pending',
  description: string
}
export type SwapContextType = {
  swapToData: swapData,
  setswapToData: Dispatch<SetStateAction<swapData>>
  swapFromData: swapData,
  setswapFromData: Dispatch<SetStateAction<swapData>>
  fromAmount: string,
  setFromAmount: Dispatch<SetStateAction<string>>
  status: number,
  setStatus: Dispatch<SetStateAction<number>>
  slippage: string,
  setSlippage: Dispatch<SetStateAction<string>>
  receivingAddress: `0x${string}` | undefined,
  setReceivingAddress: Dispatch<SetStateAction<`0x${string}` | undefined>>
  globalDialogMessage: globalDialogMessageData | undefined,
  setGlobalDialogMessage: Dispatch<SetStateAction<globalDialogMessageData | undefined>>
};
interface Iprops {
  children?: ReactNode
}
export const SwapContext = createContext<SwapContextType | null>(null);
export const defaultSlippageValue = '0.1'
const swapDataDefaults = {
  tokenAddress: ''
}
const SwapProvider: FC<Iprops> = ({ children }) => {
  const [swapToData, setswapToData] = useState<swapData>(swapDataDefaults)

  const [swapFromData, setswapFromData] = useState<swapData>(swapDataDefaults)

  const [fromAmount, setFromAmount] = useState('')

  const [status, setStatus] = useState(1)

  const [slippage, setSlippage] = useState('')

  const { address } = useAccount()

  const [receivingAddress, setReceivingAddress] = useState(address)

  const [globalDialogMessage, setGlobalDialogMessage] = useState<globalDialogMessageData>()
  
  return <SwapContext.Provider value={{
    swapToData,
    setswapToData,
    swapFromData,
    setswapFromData,
    fromAmount,
    setFromAmount,
    status,
    setStatus,
    slippage,
    setSlippage,
    receivingAddress, 
    setReceivingAddress,
    globalDialogMessage, 
    setGlobalDialogMessage
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;