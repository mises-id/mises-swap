import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from "react";

// type swapType = 'to' | 'from'
interface swapData{
  tokenAddress: string,
  symbol?: string
  decimals?: number
};
export type SwapContextType = {
  swapToData: swapData, 
  setswapToData: Dispatch<SetStateAction<swapData>>
  swapFromData: swapData, 
  setswapFromData: Dispatch<SetStateAction<swapData>>
  fromAmount: string, 
  setFromAmount: Dispatch<SetStateAction<string>>
  status: number, 
  setStatus: Dispatch<SetStateAction<number>>
};
interface Iprops {
  children?: ReactNode
}
export const SwapContext = createContext<SwapContextType | null>(null);

const swapDataDefaults = {
  tokenAddress: ''
}
const SwapProvider: FC<Iprops> = ({ children }) => {
  const [swapToData, setswapToData] = useState<swapData>(swapDataDefaults)

  const [swapFromData, setswapFromData] = useState<swapData>(swapDataDefaults)

  const [fromAmount, setFromAmount] = useState('')

  const [status, setStatus] = useState(1)
  
  return <SwapContext.Provider value={{
    swapToData, setswapToData, swapFromData, setswapFromData, fromAmount, setFromAmount, status, setStatus
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;