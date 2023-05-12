
import "./index.less";
import { useContext, useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { routeProps } from "@/routes";
import { allowance, getQuote, getSwapData, getTokens, transaction } from "@/api/swap";
import { formatAmount, nativeTokenAddress, parseAmount } from "@/utils";
import { useRequest } from "ahooks";
import { sendTransaction } from '@wagmi/core'
import { SwapContext } from "@/context/swapContext";
import { SetOutline } from "antd-mobile-icons";
import TokenInput from "@/components/tokenInput";
import SwapButton from "@/components/swapButton";
import { Skeleton } from "antd-mobile";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getBalance } from "@/api/ether";
import BigNumber from "bignumber.js";
type allowanceParams = Record<'tokenAddress' | 'walletAddress', string>
type transactionParams = Record<'tokenAddress', string>
const Home = (props: routeProps) => {
  // firebase
  const analytics = useAnalytics()
  useEffect(() => {
    logEvent(analytics, 'open_swap_page')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { chain } = useNetwork()
  const chainId = chain?.id || 1
  useEffect(() => {
    props.getHealthcheck?.().then(res => init())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  const init = () => {
    getTokenList()
    // getSpender()
  }

  const [tokens, settokens] = useState<token | undefined>(undefined)
  const [toAmount, setToAmount] = useState('')
  const swapContext = useContext(SwapContext)
  const { address } = useAccount()


  const getTokenList = () => {
    getTokens<{
      "tokens": token
    }>(chainId).then(res => {
      settokens({ ...res.data.tokens })
      if (swapContext) {
        const token = res.data.tokens[nativeTokenAddress]
        swapContext.swapFromData = {
          tokenAddress: nativeTokenAddress,
          ...token
        }
        swapContext.setswapFromData({
          ...swapContext.swapFromData
        })
      }
    })
  }

  // const [spenderAddress, setspenderAddress] = useState('')
  // const getSpender = () => {
  //   spender<{
  //     "address": string
  //   }>(chainId).then(res => {
  //     setspenderAddress(res.data.address)
  //   })
  // }

  const quote = async (fromTokenAddr = swapContext?.swapFromData.tokenAddress, toTokenAddr = swapContext?.swapToData.tokenAddress, amount = swapContext?.fromAmount) => {
    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !tokens?.[fromTokenAddr]) {
      return Promise.reject('error')
    }
    const parseAmountStr = tokens?.[fromTokenAddr] ? parseAmount(amount, tokens[fromTokenAddr]?.decimals) : '0'
    if (parseAmountStr === '0') return Promise.reject('error')

    const res = await getQuote<quoteData, quoteParams>(chainId, {
      fromTokenAddress: fromTokenAddr,
      toTokenAddress: toTokenAddr,
      amount: parseAmountStr,
      fee: 1
    })
    const toTokenAmount = formatAmount(res.data.toTokenAmount, res.data.toToken.decimals)
    if (swapContext?.fromAmount) setToAmount(toTokenAmount)
    
    // get balance
    if(address){
      const balance = await getBalance(fromTokenAddr as address, address)
      if(!balance?.formatted){
        return res
      }

      const compared = BigNumber(balance?.formatted).comparedTo(amount)
      console.log(compared, 'compared')
      if(compared === -1) {
        // Insufficient token balance	
        swapContext?.setStatus(4)
        return res
      }
      // allowance
      const allowance = await getAllowance(fromTokenAddr)
      const comparedAllowance = BigNumber(formatAmount(allowance.allowance, tokens[fromTokenAddr]?.decimals)).comparedTo(amount)

      if(comparedAllowance === -1){
        swapContext?.setStatus(9)
      }else{
        swapContext?.setStatus(99999)
      }
    }
      
    return res
  }

  const getAllowance = async (tokenAddress: string) => {
    if (!address) return Promise.reject('Not found address')
    try {
      const allowanceData: allowanceParams = {
        tokenAddress,
        walletAddress: address
      }
      const result = await allowance<{
        allowance: string
      }, allowanceParams>(chainId, allowanceData)
      return result.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const getTransaction = async (tokenAddress: string) => {
    try {
      const result = await transaction<Record<'data' | 'gasPrice' | 'value', string> & {
        to: `0x${string}`
      }, transactionParams>(chainId, {
        tokenAddress,
      })
      return result.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const { openConnectModal } = useConnectModal()
  const swap = async () => {
    if(!address){
      openConnectModal?.()
      return
    }

    const tokenAddress = swapContext?.swapFromData.tokenAddress
    if (!tokenAddress) return

    try {
      /* 
      * 1. get allowance balance
      * 2. Generate data for calling the contract in order to allow the 1inch router to spend funds
      * 3. Using eth_sendTransaction and eth_getTransactionReceipt to retrieve authorization results.
      * 4. Using eth_signTypedData_v4
      */
      const result = await getAllowance(tokenAddress)
      const comparedAllowance = BigNumber(formatAmount(result.allowance, swapContext.swapFromData?.decimals)).comparedTo(swapContext.fromAmount)

      if (comparedAllowance === -1) {
        const transactionResult = await getTransaction(tokenAddress)
        // eth_sendTransaction
        const sendTransactionResult = await sendTransaction({
          mode: 'prepared',
          request: {
            ...transactionResult,
            gasLimit: 50000
          },
        })
        // eth_getTransactionReceipt
        await sendTransactionResult.wait()
        submitSwap()
        return
      }
      submitSwap()
    } catch (error) {
      console.log(error)
    }
  }

  const submitSwap = async () => {
    // eth_signTypedData_v4
    // const sign = await signTypedData()
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress
    if (!address) return
    try {
      const parseAmountStr = tokens?.[fromTokenAddress]&&swapContext?.fromAmount ? parseAmount(swapContext.fromAmount, tokens[fromTokenAddress]?.decimals) : '0'
      const result = await getSwapData<quoteData & {
        tx: {
          data: string,
          from: string,
          gas: number,
          gasPrice: string,
          to: `0x${string}`,
          value: string
        }
      }, quoteParams & { slippage: number, fromAddress: `0x${string}`, referrerAddress: `0x${string}` }>(chainId, {
        fromTokenAddress,
        toTokenAddress,
        fromAddress: address,
        amount: parseAmountStr,
        slippage: 1,
        referrerAddress: '0x971326424696d134b0EAEB37Aa1ED6Da18208211',
        fee: 1
      })

      const { gas, ...tx } = result.data.tx
      const sendTransactionResult = await sendTransaction({
        mode: 'prepared',
        request: {
          ...tx,
          gasLimit: gas
        },
      })
      // eth_getTransactionReceipt
      await sendTransactionResult.wait()
    } catch (error) {
      console.log(error, 'errorerrorerror')
    }
  }

  const { run, cancel, loading } = useRequest(quote, {
    debounceWait: 350,
    manual: true,
  });

  const getFromInputChange = (val: string) => {
    cancel()
    if (val) {
      const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,2})/g)?.[0] || ""
      setInputChange(value)
    } else {
      swapContext?.setFromAmount('')
      setToAmount('')
    }
  }

  const setInputChange = (value: string)=>{
    swapContext?.setFromAmount(value)
    setToAmount('')
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress
    
    if(toTokenAddress && toTokenAddress){
      run(fromTokenAddress, toTokenAddress, value)
      // if(Number(value)!==0) swapContext?.setStatus(99999)
    }
  }


  const getFromTokenChange = async (val: string) => {
    // run(toTokenAddress, fromTokenAddress, val, )
    if (swapContext) {
      const token = tokens?.[val]
      swapContext.swapFromData = {
        tokenAddress: val,
        ...token
      }
      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })
    }

    const toTokenAddress = swapContext!.swapToData.tokenAddress
    if(swapContext?.fromAmount && toTokenAddress){
      run(val, toTokenAddress, swapContext.fromAmount)
    }
  }

  const getToTokenChange = (val: string) => {
    if (swapContext) {
      const token = tokens?.[val]
      swapContext.swapToData = {
        tokenAddress: val,
        ...token
      }
      swapContext.setswapToData({
        ...swapContext.swapToData
      })
    }

    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    if(swapContext?.fromAmount && fromTokenAddress){
      run(fromTokenAddress, val, swapContext.fromAmount)
      // swapContext?.setStatus(99999)
    }
  }
  
  const switchToken = ()=>{
    setToAmount('')
    swapContext?.setFromAmount(toAmount)

    if (swapContext) {
      const swapToData = swapContext.swapToData
      const swapFromData = swapContext.swapFromData
      const fromToken = tokens?.[swapFromData.tokenAddress]
      const toToken = tokens?.[swapToData.tokenAddress]

      swapContext.swapToData = {
        tokenAddress: swapFromData.tokenAddress,
        ...fromToken
      }
      swapContext.setswapToData({
        ...swapContext.swapToData
      })

      swapContext.swapFromData = {
        tokenAddress: swapToData.tokenAddress,
        ...toToken
      }
      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })

      if(toAmount) run(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount)
    }
  }

  // const canSwap = useMemo(()=>{
  //   return address && swapContext?.swapToData.tokenAddress && swapContext?.swapFromData.tokenAddress
  // },[address, swapContext?.swapToData.tokenAddress, swapContext?.swapFromData.tokenAddress])
  

  useEffect(()=>{
    if(!address){
      swapContext?.setStatus(1) // unconnnect 
      return
    }

    if(!swapContext?.swapToData.tokenAddress || !swapContext?.swapFromData.tokenAddress){
      swapContext?.setStatus(2) // un select token
      return
    }

    if(!swapContext?.fromAmount){
      swapContext?.setStatus(3) // unset amount
      return
    }
    
    // eslint-disable-next-line
  },[address, swapContext?.swapToData.tokenAddress, swapContext?.fromAmount])
  return <div className="swap-container">
      <div className="flex justify-between items-center swap-header">
        <p className="title">Swap</p>
        <SetOutline className="setting-icon" />
      </div>
      <div>
        {tokens ? <TokenInput
          type="from"
          onChange={getFromInputChange}
          onTokenChange={getFromTokenChange}
          setInputChange={setInputChange}
          tokens={tokens}
          tokenAddress={swapContext?.swapFromData.tokenAddress}
          placeholder='0'
          pattern='^[0-9]*[.,]?[0-9]*$'
          inputMode='decimal'
          value={swapContext?.fromAmount} /> : <Skeleton animated className="custom-skeleton" />}

        <div className="switch-token flex items-center justify-center" onClick={switchToken}>
          <i className="iconfont icon-xiajiantou"></i>
        </div>

        {tokens ? <TokenInput
          type="to"
          tokens={tokens}
          value={toAmount}
          onTokenChange={getToTokenChange}
          placeholder='0'
          tokenAddress={swapContext?.swapToData.tokenAddress}
          readOnly
        />: <Skeleton animated className="custom-skeleton" />}
      </div>
      <SwapButton onClick={swap} loading={loading} />
    </div >
};
export default Home;
