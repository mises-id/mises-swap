
import "./index.less";
import { useContext, useEffect, useMemo, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { routeProps } from "@/routes";
import { allowance, getQuote, getSwapData, getTokens, transaction } from "@/api/swap";
import { formatAmount, nativeTokenAddress, parseAmount } from "@/utils";
import { useRequest } from "ahooks";
import { sendTransaction, watchNetwork, watchAccount } from '@wagmi/core'
import { SwapContext } from "@/context/swapContext";
// import { SetOutline } from "antd-mobile-icons";
import TokenInput from "@/components/tokenInput";
import SwapButton from "@/components/swapButton";
import { Button, CenterPopup, Skeleton } from "antd-mobile";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getBalance } from "@/api/ether";
import BigNumber from "bignumber.js";
import Quote from "@/components/Quote";
import StatusDialog from "@/components/StatusDialog";
type allowanceParams = Record<'tokenAddress' | 'walletAddress', string>
type transactionParams = Record<'tokenAddress', string>
const Home = (props: routeProps) => {
  // firebase
  const analytics = useAnalytics()
  useEffect(() => {
    logEvent(analytics, 'open_swap_page')
    props.getHealthcheck?.().then(()=>getTokenList())

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { chain } = useNetwork()
  const chainId = chain?.id || 1

  const [tokens, settokens] = useState<token | undefined>(undefined)
  const [toAmount, setToAmount] = useState('')
  const swapContext = useContext(SwapContext)
  const { address } = useAccount()
  const [quoteData, setquoteData] = useState<any>(undefined)

  const [showConfirmDialog, setshowConfirmDialog] = useState(false)
  
  const resetData = () => {
    setToAmount('')
    cancel()
    settokens(undefined)
    if(swapContext){
      swapContext.swapToData = {
        tokenAddress: '',
      }
      swapContext.setswapToData({
        ...swapContext.swapToData
      })
      swapContext.swapFromData = {
        tokenAddress: '',
      }
      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })
    }
    return new Promise<void>((resolve, reject) => {
      props.getHealthcheck?.().then((errr)=>{
        getTokenList()
        resolve()
      }).catch(reject)
    })
  }

  const { run: networkChangeRun, cancel: networkChangeCancel} = useRequest(resetData, {
    debounceWait: 350,
    manual: true,
  });

  watchNetwork((network) => {
    networkChangeCancel()
    networkChangeRun()
  })

  const getTokenList = async () => {
    const cacheTokens = sessionStorage.getItem(`${chainId}`)
    let tokenList = undefined
    if (cacheTokens) {
      tokenList = JSON.parse(cacheTokens)
    }else{
      const res = await getTokens<{
        "tokens": token
      }>(chainId)
      if(res){
        tokenList = res.data.tokens
        sessionStorage.setItem(`${chainId}`, JSON.stringify(tokenList))
      }else{
        tokenList = {}
      }
    }
    settokens({ ...tokenList })

    if (swapContext) {
      const token = tokenList[nativeTokenAddress]
      swapContext.swapFromData = {
        tokenAddress: nativeTokenAddress,
        ...token
      }

      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })
    }
  }

  // const [spenderAddress, setspenderAddress] = useState('')
  // const getSpender = () => {
  //   spender<{
  //     "address": string
  //   }>(chainId).then(res => {
  //     setspenderAddress(res.data.address)
  //   })
  // }
  const [approveLoading, setapproveLoading] = useState(false)
  const quote = async (fromTokenAddr = swapContext?.swapFromData.tokenAddress, toTokenAddr = swapContext?.swapToData.tokenAddress, amount = swapContext?.fromAmount) => {
    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !tokens?.[fromTokenAddr]) {
      return Promise.reject('')
    }
    const parseAmountStr = tokens?.[fromTokenAddr] ? parseAmount(amount, tokens[fromTokenAddr]?.decimals) : '0'
    if (parseAmountStr === '0') return Promise.reject('')

    const res = await getQuote<quoteData, quoteParams>(chainId, {
      fromTokenAddress: fromTokenAddr,
      toTokenAddress: toTokenAddr,
      amount: parseAmountStr,
      fee: 1
    })
    setquoteData(res.data)
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
    setshowConfirmDialog(true)
  }
  const confirmSwap = async () => {
    const tokenAddress = swapContext?.swapFromData.tokenAddress
    if (!tokenAddress) return

    try {
      /* 
      * 1. get allowance balance
      * 2. Generate data for calling the contract in order to allow the 1inch router to spend funds
      * 3. Using eth_sendTransaction and eth_getTransactionReceipt to retrieve authorization results.
      * 4. Using eth_signTypedData_v4
      */
      setshowConfirmDialog(false)
      const result = await getAllowance(tokenAddress)
      const comparedAllowance = BigNumber(formatAmount(result.allowance, swapContext.swapFromData?.decimals)).comparedTo(swapContext.fromAmount)

      if (comparedAllowance === -1) {
        const transactionResult = await getTransaction(tokenAddress)
        // eth_sendTransaction
        setapproveLoading(true)
        const sendTransactionResult = await sendTransaction({
          mode: 'prepared',
          request: {
            ...transactionResult,
            gasLimit: 50000
          },
        })
        // eth_getTransactionReceipt
        await sendTransactionResult.wait()
        setapproveLoading(false)
        await submitSwap()
        return
      }
      await submitSwap()
    } catch (error: any) {
      setapproveLoading(false)

      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: 'Unknown error'
      })
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

      if(swapContext) {
        swapContext.setGlobalDialogMessage({
          type: 'pending',
          description: `Waiting for confirmation Swapping ${swapContext?.fromAmount} ${swapContext?.swapFromData.symbol} for ${swapContext?.swapToData.decimals && BigNumber(toAmount).toFixed(swapContext?.swapToData.decimals / 2)} ${swapContext?.swapToData.symbol}`
        })
      }
      console.log({
        fromTokenAddress,
        toTokenAddress,
        fromAddress: address,
        amount: parseAmountStr,
        slippage: swapContext?.slippage ? Number(swapContext.slippage) / 100 : 1,
        referrerAddress: '0x971326424696d134b0EAEB37Aa1ED6Da18208211',
        destReceiver: swapContext?.receivingAddress || '',
        fee: 1
      }, 'params ====')

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
        slippage: swapContext?.slippage ? Number(swapContext.slippage) / 100 : 1,
        referrerAddress: '0x971326424696d134b0EAEB37Aa1ED6Da18208211',
        destReceiver: swapContext?.receivingAddress || '',
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
      console.log(sendTransactionResult, 'sendTransactionResult')
      // eth_getTransactionReceipt
      const transferRes = await sendTransactionResult.wait()
      console.log(transferRes)
      if(swapContext) {
        swapContext.setGlobalDialogMessage(undefined) // reset
      }
      
    } catch (error: any) {
      if(!swapContext) return 

      if(error.description){
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description :error.description
        })
        return
      }

      if(error.message && swapContext) {
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description: error.message
        })
        return
      }

      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: 'Unknown error'
      })
    }
  }
  const { run, cancel, loading } = useRequest(quote, {
    debounceWait: 350,
    manual: true,
    pollingInterval: 5000,
    pollingWhenHidden: false,
  });

  watchAccount(account => {
    cancel()
    run()
  })

  const swapLoading = useMemo(()=>{
    return loading || approveLoading
  },[loading, approveLoading])

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
      swapContext?.setStatus(1) // unconnect 
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
        {/* <SetOutline className="setting-icon" /> */}
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
          // readOnly
        />: <Skeleton animated className="custom-skeleton" />}
      </div>
      <Quote data={quoteData} loading={swapLoading}/>
      <SwapButton onClick={swap} loading={swapLoading} />
      <CenterPopup showCloseButton visible={showConfirmDialog} className="dialog-container" onClose={()=>setshowConfirmDialog(false)}>
        <div className="dialog-content p-20">
          <p className="confirm-title">Confirm Swap</p>
          <div>
            <TokenInput
              type="from"
              tokens={tokens}
              status="ready"
              tokenAddress={swapContext?.swapFromData.tokenAddress}
              placeholder='0'
              value={swapContext?.fromAmount} />

            <div className="switch-token flex items-center justify-center">
              <i className="iconfont icon-xiajiantou"></i>
            </div>

            <TokenInput
              type="to"
              status="ready"
              tokens={tokens}
              value={toAmount}
              tokenAddress={swapContext?.swapToData.tokenAddress}
            />
          </div>
          <Quote data={quoteData} loading={swapLoading} status="ready"/>
          <Button block color="primary" className="confirm-swap-btn" loading={approveLoading} onClick={confirmSwap}>Confirm Swap</Button>
        </div>
      </CenterPopup>
      <StatusDialog />
    </div >
};
export default Home;
