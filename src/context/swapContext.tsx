import { Timeout } from "ahooks/lib/useRequest/src/types";
import { Dispatch, FC, ReactNode, SetStateAction, createContext, useState } from "react";
// type swapType = 'to' | 'from'
interface swapData {
  tokenAddress: string,
  symbol?: string
  decimals?: number
};
interface globalDialogMessageData {
  type: 'error' | 'pending' | 'success',
  description: string,
  info?: swapData & {
    blockExplorer: string | undefined,
    txHash: string
  }
}
export interface notificationData {
  type: 'reverted' | 'success',
  text: string,
  toToken?: token,
  fromToken: token,
  hash: string,
  toTokenAmount?: string,
  fromTokenAmount?: string
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
  setGlobalDialogMessage: Dispatch<SetStateAction<globalDialogMessageData | undefined>>,
  notification: notificationData[], 
  setNotification: Dispatch<SetStateAction<notificationData[]>>,
  pushNotificationData: (params: notificationData)=>void,
  removeNotificationData: (index: number) => void
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

  // const { address } = useAccount()

  const [receivingAddress, setReceivingAddress] = useState<`0x${string}` | undefined>(undefined)

  const [globalDialogMessage, setGlobalDialogMessage] = useState<globalDialogMessageData>()
  
  const [notification, setNotification] = useState<notificationData[]>([])

  // const [notificationTimeOut, setnotificationTimeOut] = useState([])
  const [timeout, settimeout] = useState<Timeout | undefined>()
  const createRemoveTask = (hash: string) =>{
    const timeoutFn = setTimeout(() => {
      const findItemIndex = notification.findIndex(val=>val.hash === hash)

      if(findItemIndex > -1){
        removeNotificationData(findItemIndex)
      }else{
        console.log('removeed')
      }
    }, 3000);
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
    console.log('remove')
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
    removeNotificationData
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;