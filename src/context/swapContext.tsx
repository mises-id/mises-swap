import { Timeout } from "ahooks/lib/useRequest/src/types";
import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from "react";
// type swapType = 'to' | 'from'
interface swapTokenData {
  tokenAddress: string,
  symbol?: string
  decimals?: number
  balance?: string
};
interface globalDialogMessageData {
  type: 'error' | 'pending' | 'success' | 'cannotEstimate',
  description: string,
  info?: swapTokenData & {
    blockExplorer: string | undefined,
    txHash: string
  }
}
export interface notificationData {
  type: 'reverted' | 'success',
  text: string,
  toToken?: token,
  fromToken?: token,
  hash: string,
  toTokenAmount?: string,
  fromTokenAmount?: string,
  noticeType?: 'token' | 'normal',
  description?: string | undefined,
  icon?: () => JSX.Element,
}
export type SwapContextType = {
  swapToData: swapTokenData,
  setswapToData: Dispatch<SetStateAction<swapTokenData>>
  swapFromData: swapTokenData,
  setswapFromData: Dispatch<SetStateAction<swapTokenData>>
  fromAmount: string,
  setFromAmount: Dispatch<SetStateAction<string>>
  toAmount: string,
  setToAmount: Dispatch<SetStateAction<string>>
  status: number | string,
  setStatus: Dispatch<SetStateAction<number | string>>
  slippage: string,
  setSlippage: Dispatch<SetStateAction<string>>
  receivingAddress: `0x${string}` | undefined,
  setReceivingAddress: Dispatch<SetStateAction<`0x${string}` | undefined>>
  globalDialogMessage: globalDialogMessageData | undefined,
  setGlobalDialogMessage: Dispatch<SetStateAction<globalDialogMessageData | undefined>>,
  notification: notificationData[], 
  setNotification: Dispatch<SetStateAction<notificationData[]>>,
  pushNotificationData: (params: notificationData)=>void,
  removeNotificationData: (index: number) => void,
  chainId: number, 
  setChainId: Dispatch<SetStateAction<number>>,
  quoteData: swapData | undefined, 
  setquoteData: Dispatch<SetStateAction<swapData | undefined>>,
  pageStatus: 'default' | 'reset', 
  setPageStatus: Dispatch<SetStateAction<'default' | 'reset'>>,
};
interface Iprops {
  children?: ReactNode
}
export const SwapContext = createContext<SwapContextType | null>(null);
export const defaultSlippageValue = '0.5'
const swapDataDefaults = {
  tokenAddress: ''
}
const SwapProvider: FC<Iprops> = ({ children }) => {
  const [swapToData, setswapToData] = useState<swapTokenData>(swapDataDefaults)

  const [swapFromData, setswapFromData] = useState<swapTokenData>(swapDataDefaults)

  const [fromAmount, setFromAmount] = useState('')

  const [toAmount, setToAmount] = useState('')

  const [status, setStatus] = useState<number | string>(1)

  const [slippage, setSlippage] = useState('')

  // const { address } = useAccount()

  const [receivingAddress, setReceivingAddress] = useState<`0x${string}` | undefined>(undefined)

  const [globalDialogMessage, setGlobalDialogMessage] = useState<globalDialogMessageData>()

  const [chainId, setChainId] = useState<number>(1)
  
  const [notification, setNotification] = useState<notificationData[]>([])

  const [quoteData, setquoteData] = useState<swapData | undefined>(undefined)

  const [pageStatus, setPageStatus] = useState<'default' | 'reset'>('default')

  const [timeout, settimeout] = useState<Timeout | undefined>()
  const createRemoveTask = (hash: string) =>{
    const timeoutFn = setTimeout(() => {
      const findItemIndex = notification.findIndex(val=>val.hash === hash)

      if(findItemIndex > -1){
        removeNotificationData(findItemIndex)
      }
    }, 4000);
    settimeout(timeoutFn)
  }

  const pushNotificationData = (params: notificationData) => {
    notification.push(params)
    setNotification([...notification])
    createRemoveTask(params.hash)
  }

  const removeNotificationData = (index: number) => {
    notification.splice(index, 1)
    setNotification([...notification])
    if(timeout) {
      clearTimeout(timeout)
      settimeout(undefined)
    }
  }
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
    setGlobalDialogMessage,
    notification, 
    setNotification,
    pushNotificationData,
    removeNotificationData,
    chainId, 
    setChainId,
    toAmount, 
    setToAmount,
    quoteData, 
    setquoteData,
    pageStatus, 
    setPageStatus
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;