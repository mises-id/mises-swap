
import "./index.less";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { allowance, getQuote, getTokens, trade, transaction } from "@/api/swap";
import { findToken, formatAmount, formatErrorMessage, nativeTokenAddress, parseAmount, substringAmount, retryRequest } from "@/utils";
import { useBoolean, useCookieState, useLockFn, useRequest, useUpdateEffect } from "ahooks";
import { sendTransaction, waitForTransaction, getWalletClient } from '@wagmi/core'
import { SwapContext, defaultSlippageValue } from "@/context/swapContext";
// import { SetOutline } from "antd-mobile-icons";
import TokenInput, { tokenInputRef } from "@/components/tokenInput";
import SwapButton from "@/components/swapButton";
import { Button, CenterPopup, FloatingBubble, Skeleton } from "antd-mobile";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import BigNumber from "bignumber.js";
import Quote from "@/components/Quote";
import StatusDialog from "@/components/StatusDialog";
import { MessageFill, SetOutline } from "antd-mobile-icons";
import Setting from "@/components/Setting";
import { fetchUSD, fetchUSDList, getBalance, getBalancesInSingleCall } from "@/api/ether";
import Notification from "@/components/Notification";
import ConnectWallet from "@/components/ConnectWallet";
import { chainList } from "@/App";
import { useNavigate } from "react-router-dom";
import PriceImpact from "@/components/PriceImpact";
import Bonuses from "@/components/Bonuses";
type allowanceParams = Record<'token_address' | 'wallet_address', string>
type transactionParams = Record<'token_address', string>
// Obtain token balance separately for the following chains
// The chain list does not support batch retrieval of token balances
const connotUseChainId = [100, 8217, 1313161554, 324, 10001, 1030, 66];
const Home = () => {
  // firebase
  const analytics = useAnalytics()

  useEffect(() => {
    init()
    // eslint-disable-next-line
  }, []);

  const init = async () =>{
    logEvent(analytics, 'open_swap_page')
    const getTokens = await getTokenList()
    if (getTokens?.length) {
      accountChangeRun(getTokens)
      console.log('run init')
    }
    const isPageReLoad = sessionStorage.getItem('isPageReLoad')
    if(isPageReLoad) {
      logEvent(analytics, 'swap_page_reload')
      sessionStorage.removeItem('isPageReLoad')
      console.log('isPageReLoad analytics')
    }
  }


  const swapContext = useContext(SwapContext)

  const { chain } = useNetwork()

  const chainId = chain?.id || swapContext?.chainId || 1
  
  const { address, isConnected } = useAccount()

  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const [isTokenLoading, { setTrue, setFalse }] = useBoolean(true);

  const getBalancesInSingleCallWithRetry = retryRequest(getBalancesInSingleCall)

  const getTokenListBalance = async (tokenList: token[]) => {

    tokenList = tokenList.map(val => {
      val.balance = '0'
      return val
    })

    if (address && chain) {
      console.log('call balances')
      setTrue()
      /* 
       * The chain does not support batch retrieval of token balances
       * So, by using `connotUseChainId` to filter the chain list, we only obtain the matching ID
      */
      if(connotUseChainId.includes(chain.id)) {
        if(swapContext?.swapFromData.tokenAddress) {
          const balance = await getBalance(swapContext?.swapFromData.tokenAddress as address, address, chain)
          if(balance?.value.toString() !== '0'){
            const tokenIndex = tokenList.findIndex(val => val.address.toLowerCase() === swapContext?.swapFromData.tokenAddress.toLowerCase())
            tokenList[tokenIndex].balance = formatAmount(balance?.value.toString(), tokenList[tokenIndex].decimals)
          }
        }

        if(swapContext?.swapToData.tokenAddress) {
          const balance = await getBalance(swapContext?.swapToData.tokenAddress as address, address, chain)
          if(balance?.value.toString() !== '0'){
            const tokenIndex = tokenList.findIndex(val => val.address.toLowerCase() === swapContext?.swapToData.tokenAddress.toLowerCase())
            console.log(balance?.value.toString())
            tokenList[tokenIndex].balance = formatAmount(balance?.value.toString(), tokenList[tokenIndex].decimals)
          }
        }
        setFalse()

        return tokenList
      }

      const nativeTokenOtherAddress = '0x0000000000000000000000000000000000000000'

      const tokensToDetect = tokenList.map((val: token) => {
        const tokenAddress = val.address.toLowerCase() === nativeTokenAddress.toLowerCase() ? nativeTokenOtherAddress : val.address
        return tokenAddress.toLowerCase()
      })

      try {
        const data = await getBalancesInSingleCallWithRetry(address, tokensToDetect, chain)
        for (const key in data) {
          const balance = data[key];
          const tokenAddress = key.toLowerCase() === nativeTokenOtherAddress.toLowerCase() ? nativeTokenAddress : `${key}`;
          const tokenIndex = tokenList.findIndex(val => val.address.toLowerCase() === tokenAddress.toLowerCase())
          if (tokenIndex > -1) {
            tokenList[tokenIndex].balance = formatAmount(balance, tokenList[tokenIndex].decimals)
            // console.log(tokenList[tokenIndex], tokenAddress, key)
          }
        }
        setFalse()
        return tokenList

      } catch (error: any) {
        console.log('getBalancesInSingleCall error', error)
        logEvent(analytics, 'swap_error', {
          error_message: `Failed to get balance of token list=>${chainId}-${swapContext?.swapFromData.tokenAddress}-${swapContext?.swapToData.tokenAddress || ''}`
        })
        setFalse()
        return tokenList
      }
    }
    return tokenList
  }

  const getTokensWithRetry = retryRequest(getTokens,{retryCount: 5})

  const getTokenList = async () => {
    try {
      const cacheTokens = sessionStorage.getItem('tokenList')
      const importTokensStr = localStorage.getItem('importTokenList')
      let tokenList: token[] = []
      if (cacheTokens && cacheTokens!=='undefined') {
        tokenList = JSON.parse(cacheTokens)
        const hasChainTokenList = tokenList?.filter(val=>val.chain_id === chainId) || []
        const isCheckChainId = chainList.some(val=>val.id === chainId)
        if(hasChainTokenList.length === 0 && isCheckChainId) tokenList = []
      }
      if(tokenList.length===0) {
        const res = await getTokensWithRetry<{ "data": token[] }>()
        if (res) {
          tokenList = res.data.data || []
          sessionStorage.setItem('tokenList', JSON.stringify(tokenList))
        } else {
          tokenList = []
        }
      }

      if(importTokensStr) {
        const importTokens: token[] = JSON.parse(importTokensStr)
        tokenList = [...tokenList, ...importTokens]
      }
      

      const chainTokenList = tokenList?.filter(val=>val.chain_id === chainId) || []
      // const now = new Date().getTime()
      // const cacheList = JSON.parse(sessionStorage.getItem(`${chainId}`) || '[]')
      // let getTokenList = chainTokenList
      
      // if(now - cacheList.time < staleTime) {
      //   getTokenList = cacheList.data
      //   console.log('getCache',  cacheList.data)
      // }else{
      //   await getTokenListToUSDPriceRun(chainTokenList)
      //   console.log('getTokenListToUSDPriceRun')
      // }
      
      swapContext!.settokens([...chainTokenList])
      getTokenToUSDPrice(nativeTokenAddress, chainTokenList)

      if (swapContext) {
        const token = findToken(chainTokenList, nativeTokenAddress) || {}

        swapContext.swapFromData = {
          tokenAddress: nativeTokenAddress,
          ...token
        }
        swapContext.setswapFromData({
          ...swapContext.swapFromData
        })
      }
      return chainTokenList

    } catch (error: any) {
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: error.message === 'timeout of 30000ms exceeded' ? 'Timeout getting token list,please try again' : (error.message || "Unknown error")
      })

      return []
    }
  }

  const [approveLoading, setapproveLoading] = useState(false)
  const cacheTime = 10000
  const renderTokenPrice = (fromTokenAddr: string, toTokenAddr: string) =>{
    if(!swapContext!.tokens) return
    const tokens = swapContext!.tokens
    const fromToken = tokens.find(val=>val.address.toLowerCase() === fromTokenAddr.toLowerCase())
    const toToken = tokens.find(val=>val.address.toLowerCase() === toTokenAddr.toLowerCase())
    const contract_addresses = []
    const now = new Date().getTime()

    if(!fromToken?.price || (fromToken?.price && fromToken?.cacheTime && now - fromToken.cacheTime > cacheTime)) contract_addresses.push(fromTokenAddr)
    if(!toToken?.price || (toToken?.price && toToken?.cacheTime && now - toToken.cacheTime > cacheTime)) contract_addresses.push(toTokenAddr)

    if(contract_addresses.length === 0) return 
    fetchUSDList(chainId, contract_addresses.join(',')).then(res=>{
      const formTokenToUsd = res[fromTokenAddr.toLowerCase()]
      const toTokenToUsd = res[toTokenAddr.toLowerCase()]
      if(formTokenToUsd) {
        const fromTokenIndex = tokens.findIndex(val=>val.address.toLowerCase() === fromTokenAddr.toLowerCase())
        const last_updated_at = formTokenToUsd.last_updated_at
        if(fromTokenIndex > -1 && now - last_updated_at * 1000 < 24 * 60 * 60 * 1000) {
          tokens[fromTokenIndex].price = formTokenToUsd.usd
          tokens[fromTokenIndex].cacheTime = new Date().getTime()
        }
      }

      if(toTokenToUsd) {
        const toTokenIndex = tokens.findIndex(val=>val.address.toLowerCase() === toTokenAddr.toLowerCase())
        const last_updated_at = toTokenToUsd.last_updated_at
        if(toTokenIndex > -1 && now - last_updated_at * 1000 < 24 * 60 * 60 * 1000) {
          tokens[toTokenIndex].price = toTokenToUsd.usd
          tokens[toTokenIndex].cacheTime = new Date().getTime()
        }
      }
      
      swapContext!.settokens([...tokens])
    })
  }

  const getQuotesWithRetry = retryRequest(getQuote)

  const quote = async (fromTokenAddr = swapContext?.swapFromData.tokenAddress, toTokenAddr = swapContext?.swapToData.tokenAddress, amount = swapContext?.fromAmount, quoteType: 'from' | 'to' = 'from') => {
    const tokens = swapContext!.tokens
    const fromToken = tokens?.length && fromTokenAddr && findToken(tokens, fromTokenAddr)
    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !fromToken || approveLoading) {
      return
    }

    const parseAmountStr = fromToken ? parseAmount(amount, fromToken?.decimals) : '0'
    if (parseAmountStr === '0') return Promise.reject('')

    try {
      renderTokenPrice(fromTokenAddr, toTokenAddr)
      const res = await getQuotesWithRetry<{ data: {
        all_quote: swapData[],
        error: string,
        best_quote: swapData
      } }, quoteParams>({
        chain_id: chainId,
        from_token_address: fromTokenAddr,
        to_token_address: toTokenAddr,
        amount: parseAmountStr
      })
      const result = res.data.data
      if(result.error) {
        swapContext?.setStatus(result.error)
        swapContext?.setquoteData(undefined)
        return
      }
      const firstTrade = result.best_quote
      if (firstTrade) {
        if (firstTrade.error) {
          swapContext?.setStatus(firstTrade.error)
          swapContext?.setquoteData(undefined)
          return
        }
        swapContext?.setquoteData({
          bestQuote: firstTrade,
          allQuotes: result.all_quote
        })

        const toToken = findToken(tokens, firstTrade.to_token_address)
        const toTokenAmount = formatAmount(firstTrade.to_token_amount, toToken?.decimals)
        if (swapContext?.fromAmount && quoteType === 'from') swapContext.setToAmount(toTokenAmount)
        if (quoteType === 'to') {
          swapContext?.setFromAmount(toTokenAmount)
        }

        // get balance
        if (address) {
          const fromToken = findToken(tokens, firstTrade.from_token_address)
          const token = quoteType === 'from' ? fromToken : toToken;
          const getBalanceAddress = (quoteType === 'from' ? fromTokenAddr : toTokenAddr) as address
          // const balance = await getBalance(getBalanceAddress, address, chain as Chain)

          // if (!token?.balance) {
          //   return res
          // }

          const compared = BigNumber(token?.balance || '0').comparedTo(quoteType === 'from' ? amount : toTokenAmount)

          if (compared === -1) {
            // Insufficient token balance	
            swapContext?.setStatus(4)
            return res
          }

          if (getBalanceAddress.toLowerCase() !== nativeTokenAddress.toLowerCase()) {
            // allowance
            const allowance = await getAllowance(getBalanceAddress, firstTrade.aggregator.contract_address)
            if(allowance.data.allowance && BigNumber(allowance.data.allowance).comparedTo(BigNumber(10).pow(20))>-1) {
              swapContext?.setStatus(99999)
              return 
            }
            const comparedAllowance = BigNumber(formatAmount(allowance.data.allowance, fromToken?.decimals)).comparedTo(quoteType === 'from' ? amount : toTokenAmount)

            swapContext?.setStatus(comparedAllowance === -1 ? 9 : 99999)

          } else {
            swapContext?.setStatus(99999)
          }
        }
        return
      }else {
        swapContext?.setStatus('No payment channel found')
        swapContext?.setquoteData(undefined)
      }
    } catch (error: any) {
      if (error.message && error.message === "timeout of 5000ms exceeded") {
        swapContext?.setStatus(12)
      } else {
        swapContext?.setStatus(11)
      }

      swapContext?.setquoteData(undefined)
    }
  }

  const getAllowance = async (tokenAddress: string, aggregatorAddress: string) => {
    if (!address) return Promise.reject('Not found address')

    try {
      const allowanceData: allowanceParams & { chain_id: number, aggregator_address: string } = {
        token_address: tokenAddress,
        wallet_address: address,
        chain_id: chainId,
        aggregator_address: aggregatorAddress
      }

      const result = await allowance<{
        data: { allowance: string }
      }, allowanceParams>(allowanceData)
      return result.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const getTransaction = async (tokenAddress: string, contract_address: string) => {
    try {
      const result = await transaction<{
        data: trade
      }, transactionParams & { chain_id: number, aggregator_address: string }>({
        chain_id: chainId,
        token_address: tokenAddress,
        aggregator_address: contract_address
      })

      return result.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const { openConnectModal } = useConnectModal()

  const onClickSwap = async () => {
    if (!address) {
      openConnectModal?.()
      return
    }
    if (swapContext?.status === 9) {
      approve()
    }
    if (swapContext?.status === 99999) {
      setshowConfirmDialog(true)
    }
  }

  const approve = async () => {
    const tokenAddress = swapContext?.swapFromData.tokenAddress
    if (!tokenAddress || tokenAddress.toLowerCase() === nativeTokenAddress.toLowerCase()) return
    let beforeStatus = swapContext?.status // 记录当前status, 失败恢复此status
    try {
      
      const contract_address = swapContext?.quoteData?.bestQuote.aggregator?.contract_address
      if (contract_address) {
        const result = await getAllowance(tokenAddress, contract_address)
        const maximumAllowance = result.data.allowance === '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        console.log(maximumAllowance, 'maximumAllowance')
        const comparedAllowance = maximumAllowance ? 1 : swapContext?.fromAmount && BigNumber(formatAmount(result.data.allowance, swapContext?.swapFromData?.decimals)).comparedTo(swapContext?.fromAmount)

        if (comparedAllowance === -1) {
          swapContext?.setStatus(10) // 修改status为: approve pending 
          setapproveLoading(true)
          const transactionResult = await getTransaction(tokenAddress, contract_address)
           // show pending transaction
           swapContext.setGlobalDialogMessage({
            type: 'pending',
            description: `Waiting for confirmation Approve`
          })
          // eth_sendTransaction
          const { gas_limit, ...params } = transactionResult.data

          const { hash } = await sendTransaction({
            ...params,
            gas: gas_limit as any
          })

          // eth_getTransactionReceipt
          const data = await waitForTransaction({
            hash: hash,
            confirmations: 4,
            timeout: 8000
          })
          swapContext.setGlobalDialogMessage(undefined) // close approve pending
          
          swapContext?.pushNotificationData({
            type: 'success',
            fromToken: swapContext?.swapFromData as unknown as token,
            hash: hash,
            text: 'Approved',
          })
          console.log(data)

          setapproveLoading(false)
          swapContext?.setStatus(99999)
          beforeStatus = 99999
          await submitSwap()
        }else {
          swapContext?.setStatus(99999)
        }
      }
    } catch (error: any) {
      console.log("approve error: ",error)
      if (beforeStatus) {
        swapContext?.setStatus(beforeStatus) // 恢复之前状态
      }
      setapproveLoading(false)
      cancel()
       // Network error
       if (isNetworkError(error)) {
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description: "Network error, please try again later."
        })
        return
      }

      // 用户拒绝请求不提示
      if (isUserRejectedRequestError(error)) {
        swapContext.setGlobalDialogMessage(undefined)
        run()
        return
      }
      
      // Send Transition error

      if (isSendTransactionError(error)) {
        swapContext.setGlobalDialogMessage(formatErrorMessage(error, 'Swap failed'))
        return
      }

      // Wait For Transaction 不提示
      if (isWaitForTransactionError(error)) {
        swapContext.setGlobalDialogMessage(undefined)
        // 直接提交swap
        setapproveLoading(false)
        swapContext?.setStatus(99999)
        await submitSwap()
        return
      }

      let errorDesc = error.description || error.reason || error.message || 'Unknown error'
      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: errorDesc
      })
    }
  }

  const isNetworkError = (error: any) => {
    return error.code && error.code === "ERR_NETWORK" 
  }

  const isUserRejectedRequestError = (error: any) => {
    if(error.details?.indexOf(`User denied transaction signature.`) > -1 || error.details?.indexOf(`The user rejected the request.`) > -1) {
      return true
    }
    if(error.shortMessage?.indexOf(`User rejected the request.`) > -1) {
      return true
    }
    if(error.details?.indexOf(`User rejected the provision of an Identity`) > -1) {
      return true
    }
    return false
  }

  const isSendTransactionError = (error: any) =>  {
    return error.name && error.name === "TransactionExecutionError"
  }

  const isWaitForTransactionError = (error: any) =>  {
    return error.name && (error.name === "TransactionNotFoundError" || error.name === "TransactionReceiptNotFoundError" || error.name === "WaitForTransactionReceiptTimeoutError")
  }

  const confirmSwap = async () => {
    const tokenAddress = swapContext?.swapFromData.tokenAddress
    if (!tokenAddress) return

    if (!address) {
      swapContext?.setStatus(1)
    }

    try {
      /* 
      * 1. get allowance balance
      * 2. Generate data for calling the contract in order to allow the 1inch router to spend funds
      * 3. Using eth_sendTransaction and eth_getTransactionReceipt to retrieve authorization results.
      */
      setshowConfirmDialog(false)

      await approve()

      await submitSwap()

    } catch (error: any) {
      setapproveLoading(false)

      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: 'Unknown error'
      })
    }
  }

  const [token] = useCookieState('_ga_20B48Y5GN1');
  const getSwapTradeWithRetry = retryRequest(async (params) =>{
    console.log(token)
    return await trade(params, token ? {
      Authorization: `Bearer ${token}`
    } : {})
  },{retryCount:5})

  const submitSwap = async () => {
    const walletClient = await getWalletClient({ chainId })
    console.log(walletClient, 'not found walletClient ')
    if (!walletClient) {
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: 'Internal error, please try again'
      })
      return
    }
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress
    if (!address) return
    swapContext?.setStatus(99999)
    const beforeStatus = swapContext?.status // 记录当前status, 失败恢复此status
    try {

      const fromToken = swapContext!.tokens?.length && fromTokenAddress && findToken(swapContext!.tokens, fromTokenAddress)

      const parseAmountStr = fromToken && swapContext?.fromAmount ? parseAmount(swapContext.fromAmount, fromToken?.decimals) : '0'

      const aggregatorAddress = swapContext?.quoteData?.bestQuote.aggregator.contract_address

      if (!aggregatorAddress) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: 'Not found aggregator address'
        })
        return
      }

      if (swapContext) {
        swapContext?.setStatus(21) // 修改status为: swap pending
        setapproveLoading(true)
        const fromTokenAmount = `${swapContext?.fromAmount} ${swapContext?.swapFromData.symbol}`
        const toTokenAmount = `${swapContext?.swapToData.decimals && swapContext?.toAmount} ${swapContext?.swapToData.symbol}`
        swapContext.setGlobalDialogMessage({
          type: 'pending',
          description: `Waiting for confirmation Swapping ${fromTokenAmount} for ${toTokenAmount}`
        })
      }

      const tradeParams = {
        chain_id: chainId,
        from_token_address: fromTokenAddress,
        to_token_address: toTokenAddress,
        from_address: address,
        amount: parseAmountStr,
        slippage: (swapContext?.slippage && Number(swapContext?.slippage) <= 50) ? Number(swapContext.slippage) / 100 : Number(defaultSlippageValue) / 100,
        dest_receiver: swapContext?.receivingAddress,
        aggregator_address: aggregatorAddress
      }

      const result = await getSwapTradeWithRetry(tradeParams)

      const firstTrade = result.data.data

      if (!firstTrade || !firstTrade?.trade) {
        if(firstTrade.error === 'cannot estimate') {
          swapContext?.setGlobalDialogMessage({
            type: 'cannotEstimate',
            description: ''
          })
          if (beforeStatus) {
            swapContext?.setStatus(beforeStatus)
          }
          setapproveLoading(false)
          return
        }

        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: firstTrade.error || 'Unknown error'
        })
        if (beforeStatus) {
          swapContext?.setStatus(beforeStatus)
        }
        setapproveLoading(false)
        return
      }
      const { gas_limit, ...params } = firstTrade.trade

      if (tradeParams.from_token_address !== firstTrade.from_token_address || tradeParams.to_token_address !== firstTrade.to_token_address || tradeParams.amount !== firstTrade.from_token_amount.toString()) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: 'Internal error, please try again'
        })
        if (beforeStatus) {
          swapContext?.setStatus(beforeStatus)
        }
        return
      }

      const { hash } = await sendTransaction({
        ...params,
        gas: gas_limit as any,
        chainId,
      })
      if (beforeStatus) {
        swapContext?.setStatus(beforeStatus)
      }
      swapContext?.setGlobalDialogMessage({
        type: 'success',
        description: 'Transaction submitted',
        info: {
          txHash: hash,
          blockExplorer: chain?.blockExplorers?.default.url,
          chainId: chain?.id,
          ...swapContext!.swapToData
        }
      })

      // eth_getTransactionReceipt
      console.log(hash)
      const data = await waitForTransaction({
        hash: hash,
        confirmations: 4,
        //timeout: 20000
      })

      swapContext?.pushNotificationData({
        type: data.status,
        fromToken: swapContext!.swapFromData as unknown as token,
        toToken: swapContext!.swapToData as unknown as token,
        hash: hash,
        fromTokenAmount: swapContext?.fromAmount,
        toTokenAmount: substringAmount(swapContext?.toAmount),
        text: data.status === 'success' ? 'Swapped' : 'Error Swap',
      })
      setapproveLoading(false)
      cancel()
      resetInputData()
      updateTokenBalance(fromTokenAddress)
      updateTokenBalance(toTokenAddress)

    } catch (error: any) {
      swapContext?.setStatus(99999) // 恢复此状态
      setapproveLoading(false)
      if (!swapContext) return
      
      // Network error
      if (isNetworkError(error)) {
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description: "Network error, please try again later."
        })
        return
      }

      // 用户拒绝请求不提示
      if (isUserRejectedRequestError(error)) {
        swapContext.setGlobalDialogMessage(undefined)
        return
      }
      
      // Send Transition error

      if (isSendTransactionError(error)) {
        swapContext.setGlobalDialogMessage(formatErrorMessage(error, 'Swap failed'))
        return
      }

      // Wait For Transaction 不提示
      if (isWaitForTransactionError(error)) {
        //swapContext.setGlobalDialogMessage(undefined)
        return
      }

      let errorDesc = error.description || error.reason || error.message || 'Unknown error'
      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: errorDesc
      })
    }
  }

  const resetData = async () => {
    swapContext?.setToAmount('')
    cancel()
    swapContext!.settokens(undefined)

    if (swapContext) {
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

    const getTokens = await getTokenList()
    console.log('getTokenList')
    accountChangeRun(getTokens)
  }

  const { run: networkChangeRun, cancel: networkChangeCancel } = useRequest(resetData, {
    debounceWait: 550,
    manual: true,
  });

  const { run, cancel, loading } = useRequest(quote, {
    debounceWait: 550,
    manual: true,
    pollingInterval: 10000,
    pollingWhenHidden: false,
  });

  const resetInputData = useLockFn(async (paramTokens?: token[]) => {
    swapContext?.setFromAmount('')
    swapContext?.setToAmount('')
    cancel()
    swapContext?.setquoteData(undefined)
    const tokenList = paramTokens || swapContext!.tokens
    if (tokenList?.length) {
      updateTokenBalance(swapContext!.swapFromData.tokenAddress, tokenList)
      const tokenBalanceList = await getTokenListBalance(tokenList)
      swapContext!.settokens([...tokenBalanceList])
    }
  })

  const { run: accountChangeRun, cancel: accountChangeCancel } = useRequest(resetInputData, {
    debounceWait: 1000,
    manual: true,
  });



  useUpdateEffect(() => {
    networkChangeCancel()
    networkChangeRun()

    console.log("watchNetwork", isConnected, chain?.id, address)

  }, [chainId])

  // useEffect(() => {
  //   chain && address && testpublicKey(chain, address)
  // }, [chain, address])
  

  useUpdateEffect(() => {
    // const isNotFirstConnected = sessionStorage.getItem('isFirstConnected')
    // if (isNotFirstConnected) {
    //   cancel()
    //   // run()
    //   accountChangeCancel()
    //   accountChangeRun()
    //   console.log("watchAccount", isConnected, chain?.id, address)
    // } else {
    //   console.log(address)
    //   resetInputData()
    //   sessionStorage.setItem('isFirstConnected', '1')
    // }
    // if(!address) {
    //   sessionStorage.removeItem('isFirstConnected')
    // }

    cancel()
    accountChangeCancel()
    accountChangeRun()
    console.log("watchAccount", isConnected, chain?.id, address)
  }, [address])

  const replaceValue = (val: string, decimals: number = 18) => {
    const valueRegex = new RegExp( `^\\d*[.]?\\d{0,${decimals}}`,'g')
    return val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(valueRegex)?.[0] || ""
  }

  const swapLoading = useMemo(() => loading || approveLoading, [loading, approveLoading])

  const getFromInputChange = (val: string) => {
    cancel()
    if (val) {
      const value = replaceValue(val,swapContext?.swapFromData.decimals)
      setFromInputChange(value)
    } else {
      swapContext?.setFromAmount('')
      swapContext?.setToAmount('')
      swapContext?.setquoteData(undefined)
      setapproveLoading(false)
    }
  }
  const getToInputChange = (val: string) => {
    cancel()
    if (val) {
      const value = replaceValue(val,swapContext?.swapToData.decimals)
      swapContext?.setToAmount(value)
      setToInputChange(value)
    } else {
      swapContext?.setFromAmount('')
      swapContext?.setToAmount('')
      swapContext?.setquoteData(undefined)
      setapproveLoading(false)
    }
  }
  const setToInputChange = (value: string) => {
    // swapContext?.setFromAmount(value)
    // setToAmount('')
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress

    if (toTokenAddress && fromTokenAddress) {
      run(toTokenAddress, fromTokenAddress, value, 'to')
      swapContext?.setcurrentSwitchType('to')
    }
  }

  const setFromInputChange = (value: string) => {
    swapContext?.setFromAmount(value)
    swapContext?.setToAmount('')
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress
    if (toTokenAddress && fromTokenAddress) {
      swapContext?.setcurrentSwitchType('from')
      run(fromTokenAddress, toTokenAddress, value, 'from')
    }
  }
  const getTokenToUSDPrice = async (tokenAddress: string, paramsTokenList?: token[]) => {
    const tokens = swapContext!.tokens
    if (tokens?.length || paramsTokenList?.length) {
      const tokenList = paramsTokenList || tokens || []
      const tokenIndex = tokenList.findIndex(val => val.address.toLowerCase() === tokenAddress.toLowerCase())
      if (tokenIndex > -1 && !tokenList[tokenIndex].price) {
        try {
          const price = await fetchUSD(tokenList[tokenIndex].symbol)
          tokenList[tokenIndex].price = price
          swapContext!.settokens([...tokenList])
        } catch (error) {
          console.log(error, 'getTokenToUSDPrice-error')
        }
      }
    }
  }

  const updateTokenBalance = async (tokenAddress: string, tokenList?: token[]) => {
    const tokens = swapContext!.tokens || tokenList
    if (chain && address && tokens ) { 
      
      const balance = await getBalance(tokenAddress as address, address, chain);
      if(balance){
        const tokenIndex = tokens.findIndex(val => val.address.toLowerCase() === tokenAddress.toLowerCase())
        if(tokens[tokenIndex]) {
          tokens[tokenIndex].balance = formatAmount(balance?.value.toString(), tokens[tokenIndex].decimals)
          swapContext!.settokens([...tokens])
        }
      }
    }
  }

  const getFromTokenChange = async (val: string) => {
    const tokens = swapContext!.tokens
    if (swapContext) {
      
      const token = tokens?.length && val && findToken(tokens, val)

      swapContext.swapFromData = {
        tokenAddress: val,
        ...token
      }

      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })
    }
    const toTokenAddress = swapContext!.swapToData.tokenAddress

    if (swapContext?.fromAmount && toTokenAddress) {
      run(val, toTokenAddress, swapContext.fromAmount, 'from')
    }

    updateTokenBalance(val) // update from token balance

    // getTokenToUSDPrice(val)
  }

  const getToTokenChange = async (val: string) => {
    const tokens = swapContext!.tokens
    if (swapContext) {
      const token = tokens?.length && val && findToken(tokens, val)

      swapContext.swapToData = {
        tokenAddress: val,
        ...token
      }

      swapContext.setswapToData({
        ...swapContext.swapToData
      })
    }

    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    if (swapContext?.fromAmount && fromTokenAddress) {
      swapContext.setToAmount('')
      run(fromTokenAddress, val, swapContext.fromAmount, 'from')
    }
    updateTokenBalance(val) // update to token balance

  }

  const switchToken = () => {
    if (swapLoading) {
      return
    }
    const tokens = swapContext!.tokens
    if (swapContext) {
      const swapToData = swapContext.swapToData
      const swapFromData = swapContext.swapFromData
      const fromToken = tokens?.length && findToken(tokens, swapFromData.tokenAddress)
      const toToken = tokens?.length && findToken(tokens, swapToData.tokenAddress)
      const toAmount = swapContext.toAmount
      cancel()

      swapContext.currentSwitchType === 'from' ?
        run(swapFromData.tokenAddress, swapToData.tokenAddress, swapContext.fromAmount, 'to') :
        run(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount, 'from')
      if (swapContext.currentSwitchType === 'from') {
        console.log(swapFromData.tokenAddress, swapToData.tokenAddress, swapContext.fromAmount, swapContext.currentSwitchType)
      } else {
        console.log(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount, swapContext.currentSwitchType)
      }


      swapContext.setcurrentSwitchType(swapContext.currentSwitchType === 'from' ? 'to' : 'from')

      swapContext.setToAmount(swapContext.fromAmount)
      swapContext?.setFromAmount(toAmount)

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
      // console.log(swapContext.fromAmount, 'toAmounttoAmounttoAmount===')
      // console.log(swapFromData.tokenAddress, swapToData.tokenAddress, swapContext.fromAmount, 'to')
      if (swapContext.fromAmount) {

      }
    }
  }

  useEffect(() => {
    if (!address) {
      swapContext?.setStatus(1) // unconnect 
      // setquoteData(undefined)
      // cancel()
      return
    }

    if (!swapContext?.swapToData.tokenAddress || !swapContext?.swapFromData.tokenAddress) {
      swapContext?.setStatus(2) // un select token
      swapContext?.setquoteData(undefined)
      cancel()
      return
    }

    if (!swapContext?.fromAmount) {
      swapContext?.setStatus(3) // unset amount
      // setquoteData(undefined)
      // cancel()
      return
    }

    // eslint-disable-next-line
  }, [address, swapContext?.swapToData.tokenAddress, swapContext?.fromAmount])

  const [openSetting, setopenSetting] = useState(false)

  const fromInputRef = useRef<tokenInputRef>(null)
  const toInputRef = useRef<tokenInputRef>(null)

  const dismissClose = () => {
    setapproveLoading(false)
  }

  useEffect(() => {
    if (swapContext?.pageStatus === 'reset') {
      cancel()
      swapContext.setPageStatus('default')
    }
    // eslint-disable-next-line
  }, [swapContext?.pageStatus])
  const Logo = memo(() =>{
    const swapContext = useContext(SwapContext)
    const resetData = () => {
      swapContext?.setFromAmount('')
      swapContext?.setToAmount('')
      swapContext?.setquoteData(undefined)
      swapContext?.setPageStatus('reset')
    }
    return <div className="relative flex" onClick={resetData}>
       <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
      {/* <Image width={47} height={30} placeholder="" onClick={resetData} src='/Mises_symbol.png' />*/}
      <div><span className="beta-tag">BETA</span></div> 
      
    </div>
  }, ()=>false)


  const navigate = useNavigate()

  return <div className="flex flex-col flex-1">
    <div className='flex justify-between items-center px-10 py-10'  style={{height: 40}}>
      {/* <Image width={80} src='/logo192.png' /> */}
      <Logo />
      <ConnectButton.Custom>
        {(props) => {
          const ready = props.mounted;
          if (!ready) return
          return <ConnectWallet chains={chainList}  {...props} />
        }}
      </ConnectButton.Custom>
      {/* <ConnectButton /> */}
    </div>
    <div className='flex-1 flex flex-col overflow-hidden relative'>
      <div className="swap-container">
        <div className="flex justify-between items-center swap-header">
          <p className="title">Swap</p>
          <div className={`flex items-center ${swapContext?.slippage ? 'show-slippage' : ''}`}>
            {swapContext?.slippage && <p className="mr-10">{swapContext.slippage}% slippage</p>}
            <SetOutline className="setting-icon" onClick={() => setopenSetting(true)} />
          </div>
        </div>
        <div>
          {swapContext!.tokens ? <TokenInput
            type="from"
            onChange={getFromInputChange}
            onTokenChange={getFromTokenChange}
            setInputChange={setFromInputChange}
            tokens={swapContext!.tokens}
            tokenAddress={swapContext?.swapFromData.tokenAddress}
            placeholder='0'
            isTokenLoading={isTokenLoading}
            //maxLength={swapContext?.swapFromData.decimals}
            ref={fromInputRef}
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={swapContext?.fromAmount} /> : <Skeleton animated className="custom-skeleton" />}

          <div className="switch-token flex items-center justify-center cursor-pointer" onClick={switchToken}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>

          {swapContext!.tokens ? <TokenInput
            type="to"
            tokens={swapContext!.tokens}
            value={swapContext?.toAmount}
            ref={toInputRef}
            //maxLength={swapContext?.swapToData.decimals}
            onChange={getToInputChange}
            onTokenChange={getToTokenChange}
            placeholder='0'
            tokenAddress={swapContext?.swapToData.tokenAddress}
          // readOnly
          /> : <Skeleton animated className="custom-skeleton" />}
        </div>

        <Quote tokens={swapContext!.tokens} data={swapContext?.quoteData} loading={swapLoading} />

        <PriceImpact tokens={swapContext!.tokens} verifyShow />


        <SwapButton onClick={onClickSwap} loading={swapLoading} />


        <Setting visible={openSetting} onClose={() => setopenSetting(false)} />
        {/* <Button onClick={()=>{
          resetInputData()
              }}>reset</Button> */}

        <FloatingBubble
          style={{
            '--initial-position-bottom': '24px',
            '--initial-position-right': '24px',
            '--edge-distance': '24px',
          }}
          axis="lock"
          onClick={()=>{
            navigate('/helpcenter')
            resetInputData()
            swapContext?.setswapToData({
              tokenAddress: ''
            })
          }}
        >
          <MessageFill fontSize={32} />
        </FloatingBubble>
      </div >
      <div className="swap-container" style={{zIndex: -1}}>
        <Bonuses />
      </div>
    </div>
    <Notification />
    <StatusDialog successClose={resetInputData} dismissClose={dismissClose} />
    <CenterPopup showCloseButton visible={showConfirmDialog} className="dialog-container down-dialog-style" onClose={() => setshowConfirmDialog(false)}>
      <div className="dialog-content p-20">
        <p className="confirm-title">Confirm Swap</p>
        <div>
          <TokenInput
            type="from"
            tokens={swapContext!.tokens}
            status="ready"
            tokenAddress={swapContext?.swapFromData.tokenAddress}
            placeholder='0'
            value={swapContext?.fromAmount} />

          <div className="switch-token flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>

          <TokenInput
            type="to"
            status="ready"
            tokens={swapContext!.tokens}
            value={swapContext?.toAmount}
            tokenAddress={swapContext?.swapToData.tokenAddress}
          />
        </div>
        <Quote data={swapContext?.quoteData} tokens={swapContext!.tokens} loading={swapLoading} status="ready" />
        <Button block color="primary" className="confirm-swap-btn" loading={approveLoading} onClick={confirmSwap}>Confirm Swap</Button>
      </div>
    </CenterPopup>
  </div>
};
export default Home;
