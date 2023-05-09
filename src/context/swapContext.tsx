import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from "react";

type swapType = 'to' | 'from'
type swapData = {
  [key in swapType]: {
    tokenAddress: string
  };
};
export type SwapContextType = {
  swapData: swapData, 
  setswapData: Dispatch<SetStateAction<swapData>>
};
interface Iprops {
  children?: ReactNode
}
export const SwapContext = createContext<SwapContextType | null>(null);

const SwapProvider: FC<Iprops> = ({ children }) => {
  const [swapData, setswapData] = useState<swapData>({
    to: {
      tokenAddress: ''
    },
    from: {
      tokenAddress: ''
    }
  })
  
  return <SwapContext.Provider value={{
    swapData, setswapData
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;