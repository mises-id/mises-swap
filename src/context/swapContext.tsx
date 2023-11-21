import { Timeout } from "ahooks/lib/useRequest/src/types";
import { Dispatch, FC, ReactNode, SetStateAction, createContext, useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
// type swapType = 'to' | 'from'
interface swapTokenData {
  tokenAddress: string,
  symbol?: string
  decimals?: number
  balance?: string
};

interface bridgeTokenData {
  tokenAddress?: string,
  symbol: string
  decimals?: number
  balance?: string
}

interface globalDialogMessageData {
  type: 'error' | 'pending' | 'success' | 'cannotEstimate',
  description: string,
  info?: swapTokenData & {
    blockExplorer: string | undefined,
    txHash: string,
    chainId: number | undefined
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
export interface quoteData {
  allQuotes: swapData[],
  bestQuote: swapData,
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
  quoteData: quoteData | undefined, 
  setquoteData: Dispatch<SetStateAction<quoteData | undefined>>,
  pageStatus: 'default' | 'reset', 
  setPageStatus: Dispatch<SetStateAction<'default' | 'reset'>>,
  currentSwitchType: 'from' | 'to', 
  setcurrentSwitchType: Dispatch<SetStateAction<'from' | 'to'>>,
  tokens: token[] | undefined, 
  settokens: Dispatch<SetStateAction<token[] | undefined>>,
  gasPrice: string,

  // bridge
  bridgeTokens: token[] | undefined,
  setBridgeTokens: Dispatch<SetStateAction<token[] | undefined>>,
  bridgeFromData: bridgeTokenData,
  setBridgeFromData: Dispatch<SetStateAction<bridgeTokenData>>,
  bridgeToData: bridgeTokenData,
  setBridgeToData: Dispatch<SetStateAction<bridgeTokenData>>,
  bridgeFromAmount: string,
  setBridgeFromAmount: Dispatch<SetStateAction<string>>
  bridgeToAmount: string,
  setBridgeToAmount: Dispatch<SetStateAction<string>>,
  bridgeAmountCheckMsg: string,
  setBridgeAmountCheckMsg: Dispatch<SetStateAction<string>>,
  bridgeFloatMode: boolean,
  setBridgeFloatMode: Dispatch<SetStateAction<boolean>>,
  bridgeFloatAvailable: boolean,
  setBridgeFloatAvailable: Dispatch<SetStateAction<boolean>>,
  bridgeFixedAvailable: boolean,
  setBridgeFixedAvailable: Dispatch<SetStateAction<boolean>>,
  bridgeFloatNotAvailableMsg: string,
  setBridgeFloatNotAvailableMsg: Dispatch<SetStateAction<string>>,
  bridgeFixedNotAvailableMsg: string,
  setBridgeFixedNotAvailableMsg: Dispatch<SetStateAction<string>>,
};
interface Iprops {
  children?: ReactNode
}
export const SwapContext = createContext<SwapContextType | null>(null);
export const defaultSlippageValue = '0.5'
const swapDataDefaults = {
  tokenAddress: ''
}
const bridgeDataDefaults = {
  tokenAddress: '',
  symbol: ''
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

  const [quoteData, setquoteData] = useState<quoteData | undefined>(undefined)

  const [pageStatus, setPageStatus] = useState<'default' | 'reset'>('default')

  const [timeout, settimeout] = useState<Timeout | undefined>()

  const [currentSwitchType, setcurrentSwitchType] = useState<'from' | 'to'>('from')

  const [tokens, settokens] = useState<token[] | undefined>(undefined)

  const [gasPrice, setgasPrice] = useState('0')

  // bridge
  const [bridgeTokens, setBridgeTokens] = useState<token[] | undefined>(undefined)
  const [bridgeToData, setBridgeToData] = useState<bridgeTokenData>(bridgeDataDefaults)
  const [bridgeFromData, setBridgeFromData] = useState<bridgeTokenData>(bridgeDataDefaults)
  const [bridgeFromAmount, setBridgeFromAmount] = useState('')
  const [bridgeToAmount, setBridgeToAmount] = useState('')
  const [bridgeAmountCheckMsg, setBridgeAmountCheckMsg] = useState('')
  const [bridgeFloatMode, setBridgeFloatMode] = useState(true)
  const [bridgeFloatAvailable, setBridgeFloatAvailable] = useState(true)
  const [bridgeFixedAvailable, setBridgeFixedAvailable] = useState(true)
  const [bridgeFloatNotAvailableMsg, setBridgeFloatNotAvailableMsg] = useState('')
  const [bridgeFixedNotAvailableMsg, setBridgeFixedNotAvailableMsg] = useState('')

  const createRemoveTask = () =>{
    const timeoutFn = setTimeout(removeNotificationData, 4000);
    settimeout(timeoutFn)
  }

  const pushNotificationData = (params: notificationData) => {
    // notification.push(params)
    setNotification([params])
    createRemoveTask()
  }

  const removeNotificationData = () => {
    // notification.splice(index, 1)
    setNotification([])
    if(timeout) {
      clearTimeout(timeout)
      settimeout(undefined)
    }
  }

  const walletClient = useWalletClient()

  useEffect(() => {
    if (quoteData && document.visibilityState === 'visible') {
      walletClient.data?.request({
        method: 'eth_gasPrice',
        params: [] as never
      }).then(res => {
        const gasPriceNumber = parseInt(res)
        setgasPrice(gasPriceNumber.toString())
      })
    }
    // eslint-disable-next-line 
  }, [quoteData])

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
    setPageStatus,
    currentSwitchType, 
    setcurrentSwitchType,
    tokens, 
    settokens,
    gasPrice,
    bridgeTokens,
    setBridgeTokens,
    bridgeToData,
    setBridgeToData,
    bridgeFromData,
    setBridgeFromData,
    bridgeFromAmount,
    setBridgeFromAmount,
    bridgeToAmount,
    setBridgeToAmount,
    bridgeAmountCheckMsg,
    setBridgeAmountCheckMsg,
    bridgeFloatMode,
    setBridgeFloatMode,
    bridgeFloatAvailable,
    setBridgeFloatAvailable,
    bridgeFixedAvailable,
    setBridgeFixedAvailable,
    bridgeFloatNotAvailableMsg,
    setBridgeFloatNotAvailableMsg,
    bridgeFixedNotAvailableMsg,
    setBridgeFixedNotAvailableMsg
  }}>{children}</SwapContext.Provider>;
};

export default SwapProvider;