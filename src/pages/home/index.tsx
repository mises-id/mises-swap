
import "./index.less";
import { memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { allowance, getQuote, getTokens, trade, transaction } from "@/api/swap";
import { findToken, formatAmount, formatErrorMessage, nativeTokenAddress, parseAmount, substringAmount } from "@/utils";
import { useBoolean, useRequest, useUpdateEffect } from "ahooks";
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
type allowanceParams = Record<'token_address' | 'wallet_address', string>
type transactionParams = Record<'token_address', string>
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
      // const tokenList = await getTokenListBalance(getTokens)

      // settokens([...tokenList])
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
  const [tokens, settokens] = useState<token[] | undefined>(undefined)
  // const [toAmount, setToAmount] = useState('')
  const { address, isConnected } = useAccount()
  // const [quoteData, setquoteData] = useState<swapData | undefined>(undefined)
  const [currentSwitchType, setcurrentSwitchType] = useState<'from' | 'to'>('from')
  // const latestCurrentSwitchTypeRef = useLatest(currentSwitchType);

  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const [isTokenLoading, { setTrue, setFalse }] = useBoolean(true);

  const getTokenListBalance = async (tokenList: token[]) => {

    tokenList = tokenList.map(val => {
      val.balance = '0'
      return val
    })

    if (address && chain) {
      console.log('call balances')
      setTrue()

      if([100, 8217, 1313161554, 324].includes(chain.id)) {
        if(swapContext?.swapFromData.tokenAddress) {
          const balance = await getBalance(swapContext?.swapFromData.tokenAddress as address, address, chain)
          if(balance?.value.toString() !== '0'){
            const tokenIndex = tokenList.findIndex(val => val.address === swapContext?.swapFromData.tokenAddress)
            tokenList[tokenIndex].balance = formatAmount(balance?.value.toString(), tokenList[tokenIndex].decimals)
          }
        }

        if(swapContext?.swapToData.tokenAddress) {
          const balance = await getBalance(swapContext?.swapToData.tokenAddress as address, address, chain)
          if(balance?.value.toString() !== '0'){
            const tokenIndex = tokenList.findIndex(val => val.address === swapContext?.swapToData.tokenAddress)
            console.log(balance?.value.toString())
            tokenList[tokenIndex].balance = formatAmount(balance?.value.toString(), tokenList[tokenIndex].decimals)
          }
        }
        setFalse()

        return tokenList
      }

      const nativeTokenOtherAddress = '0x0000000000000000000000000000000000000000'
      const tokensToDetect = tokenList.map((val: token) => {
        const tokenAddress = val.address === nativeTokenAddress ? nativeTokenOtherAddress : val.address
        return tokenAddress.toLocaleLowerCase()
      })

      try {
        const data = await getBalancesInSingleCall(address, tokensToDetect, chain)
        for (const key in data) {
          const balance = data[key];
          const tokenAddress = key.toLocaleLowerCase() === nativeTokenOtherAddress ? nativeTokenAddress : `${key}`;
          const tokenIndex = tokenList.findIndex(val => val.address === tokenAddress)
          if (tokenIndex > -1) {
            tokenList[tokenIndex].balance = formatAmount(balance, tokenList[tokenIndex].decimals)
            // console.log(tokenList[tokenIndex], tokenAddress, key)
          }
        }
        console.log(tokenList, 'getBalancesInSingleCall')
        setFalse()
        return tokenList

      } catch (error: any) {
        logEvent(analytics, `swap_error`, {
          error_message: error.reason || error.message || 'Unknown error'
        })
        setFalse()
        return tokenList
      }
    }
    return tokenList
  }

  // const chunk = (arr: string[], counts: number) => {
  //   const cloneArr = [...arr];
  //   const result = [];
  //   while(cloneArr.length) {
  //     result.push(cloneArr.splice(0, counts));
  //   }
  //   return result;
  // }

  // const getTokenListToUSDPrice = async (tokenList: token[]) =>{
  //   const ids = tokenList.map(val=>val.address)
  //   const idsList = chunk(ids, 180);
  //   const promiseAllIds = idsList.map((ids: string[]) => fetchUSDList(chainId, ids.join(',')))
  //   const idsUSD = await Promise.all(promiseAllIds)

  //   idsUSD.forEach(item =>{
  //     for (const key in item) {
  //       const element = item[key];
  //       const findIndex = tokenList.findIndex(val=>val.address === key);
  //       if(findIndex > -1 && element.usd) {
  //         tokenList[findIndex].price = element.usd
  //       }
  //     }
  //   })
  //   return tokenList
  // }

  // const staleTime = 1000 * 60 * 6
  // const { run: getTokenListToUSDPriceRun } = useRequest(getTokenListToUSDPrice, {
  //   cacheKey: `${chainId}`,
  //   staleTime,
  //   manual: true,
  //   setCache: (data) => sessionStorage.setItem(`${chainId}`, JSON.stringify(data)),
  //   getCache: () => JSON.parse(sessionStorage.getItem(`${chainId}`) || '[]'),
  // });

  const getTokenList = async () => {
    try {
      const cacheTokens = sessionStorage.getItem('tokenList')
      let tokenList: token[] = []
      if (cacheTokens) {
        tokenList = JSON.parse(cacheTokens)
      } else {
        const res = await getTokens<{ "data": token[] }>()
        if (res) {
          tokenList = res.data.data
          sessionStorage.setItem('tokenList', JSON.stringify(tokenList))
        } else {
          tokenList = []
        }
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
      
      settokens([...chainTokenList])
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
    if(!tokens) return
    const fromToken = tokens.find(val=>val.address === fromTokenAddr)
    const toToken = tokens.find(val=>val.address === toTokenAddr)
    const contract_addresses = []
    const now = new Date().getTime()

    if(!fromToken?.price || (fromToken?.price && fromToken?.cacheTime && now - fromToken.cacheTime > cacheTime)) contract_addresses.push(fromTokenAddr)
    if(!toToken?.price || (toToken?.price && toToken?.cacheTime && now - toToken.cacheTime > cacheTime)) contract_addresses.push(toTokenAddr)

    if(contract_addresses.length === 0) return 
    fetchUSDList(chainId, contract_addresses.join(',')).then(res=>{
      const formTokenToUsd = res[fromTokenAddr]
      const toTokenToUsd = res[toTokenAddr]

      if(formTokenToUsd) {
        const fromTokenIndex = tokens.findIndex(val=>val.address === fromTokenAddr)
        const last_updated_at = formTokenToUsd.last_updated_at
        if(fromTokenIndex > -1 && now - last_updated_at * 1000 < 24 * 60 * 60 * 1000) {
          tokens[fromTokenIndex].price = formTokenToUsd.usd
          tokens[fromTokenIndex].cacheTime = new Date().getTime()
        }
      }

      if(toTokenToUsd) {
        const toTokenIndex = tokens.findIndex(val=>val.address === toTokenAddr)
        const last_updated_at = toTokenToUsd.last_updated_at
        if(toTokenIndex > -1 && now - last_updated_at * 1000 < 24 * 60 * 60 * 1000) {
          tokens[toTokenIndex].price = toTokenToUsd.usd
          tokens[toTokenIndex].cacheTime = new Date().getTime()
        }
      }
      
      settokens([...tokens])
    })
  }

  const quote = async (fromTokenAddr = swapContext?.swapFromData.tokenAddress, toTokenAddr = swapContext?.swapToData.tokenAddress, amount = swapContext?.fromAmount, quoteType: 'from' | 'to' = 'from') => {
    const fromToken = tokens?.length && fromTokenAddr && findToken(tokens, fromTokenAddr)
    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !fromToken || approveLoading) {
      return
    }

    const parseAmountStr = fromToken ? parseAmount(amount, fromToken?.decimals) : '0'
    if (parseAmountStr === '0') return Promise.reject('')

    try {
      renderTokenPrice(fromTokenAddr, toTokenAddr)
      const res = await getQuote<{ data: swapData[] }, quoteParams>({
        chain_id: chainId,
        from_token_address: fromTokenAddr,
        to_token_address: toTokenAddr,
        amount: parseAmountStr
      })
      if (res.data.data.length) {
        const [firstTrade] = res.data.data
        if (firstTrade.error) {
          swapContext?.setStatus(firstTrade.error)
          swapContext?.setquoteData(undefined)
          return
        }
        swapContext?.setquoteData(firstTrade)

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

          if (getBalanceAddress !== nativeTokenAddress) {
            // allowance
            const allowance = await getAllowance(getBalanceAddress, firstTrade.aggregator.contract_address)

            const comparedAllowance = BigNumber(formatAmount(allowance.data.allowance, fromToken?.decimals)).comparedTo(quoteType === 'from' ? amount : toTokenAmount)

            swapContext?.setStatus(comparedAllowance === -1 ? 9 : 99999)

          } else {
            swapContext?.setStatus(99999)
          }
        }
        return
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
    if (!tokenAddress && tokenAddress !== nativeTokenAddress) return

    try {
      const contract_address = swapContext?.quoteData?.aggregator?.contract_address
      if (contract_address) {
        setapproveLoading(true)
        const result = await getAllowance(tokenAddress, contract_address)

        const comparedAllowance = swapContext?.fromAmount && BigNumber(formatAmount(result.data.allowance, swapContext?.swapFromData?.decimals)).comparedTo(swapContext?.fromAmount)

        if (comparedAllowance === -1) {
          const transactionResult = await getTransaction(tokenAddress, contract_address)
          // eth_sendTransaction

          const { gas_price, gas_limit, ...params } = transactionResult.data
          const { hash } = await sendTransaction({
            ...params,
            gasPrice: gas_price,
            gas: gas_limit as any
          })

          // // eth_getTransactionReceipt
          const data = await waitForTransaction({
            hash: hash,
            confirmations: 4,
          })
          swapContext?.pushNotificationData({
            type: 'success',
            fromToken: swapContext?.swapFromData as unknown as token,
            hash: hash,
            text: 'Approved',
          })
          console.log(data)

          setapproveLoading(false)
          swapContext?.setStatus(99999)
          await submitSwap()
        }else {
          swapContext?.setStatus(99999)
        }
      }
    } catch (error: any) {
      setapproveLoading(false)
      cancel()
      if (error.message) {
        if (error.name === 'TransactionNotFoundError') {
          return
        }

        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: error.message.indexOf('User rejected the request') > -1 ? 'User rejected the request' : (error.reason || error.message || 'Unknown error')
        })
        return
      }
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: 'Unknown error'
      })
    }
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

  const submitSwap = async () => {
    // eth_signTypedData_v4
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

    try {

      const fromToken = tokens?.length && fromTokenAddress && findToken(tokens, fromTokenAddress)

      const parseAmountStr = fromToken && swapContext?.fromAmount ? parseAmount(swapContext.fromAmount, fromToken?.decimals) : '0'

      const aggregatorAddress = swapContext?.quoteData?.aggregator.contract_address

      if (!aggregatorAddress) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: 'Not found aggregator address'
        })
        return
      }

      if (swapContext) {
        setapproveLoading(true)
        const fromTokenAmount = `${swapContext?.fromAmount} ${swapContext?.swapFromData.symbol}`
        const toTokenAmount = `${swapContext?.swapToData.decimals && substringAmount(BigNumber(swapContext?.toAmount).toString())} ${swapContext?.swapToData.symbol}`
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

      const result = await trade<{ data: swapData }, quoteParams>(tradeParams)

      const firstTrade = result.data.data

      if (!firstTrade || !firstTrade?.trade) {
        if(firstTrade.error === 'cannot estimate') {
          swapContext?.setGlobalDialogMessage({
            type: 'cannotEstimate',
            description: ''
          })
          setapproveLoading(false)
          return
        }

        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: firstTrade.error || 'Unknown error'
        })

        setapproveLoading(false)
        return
      }

      const { gas_price, gas_limit, ...params } = firstTrade.trade

      if (tradeParams.from_token_address !== firstTrade.from_token_address || tradeParams.to_token_address !== firstTrade.to_token_address || tradeParams.amount !== firstTrade.from_token_amount.toString()) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: 'Internal error, please try again'
        })
        return
      }

      const { hash } = await sendTransaction({
        ...params,
        gasPrice: gas_price,
        gas: gas_limit as any,
        chainId,
      })

      swapContext?.setGlobalDialogMessage({
        type: 'success',
        description: 'Transaction submitted',
        info: {
          txHash: hash,
          blockExplorer: chain?.blockExplorers?.default.url,
          ...swapContext!.swapToData
        }
      })

      // eth_getTransactionReceipt
      console.log(hash)
      const data = await waitForTransaction({
        hash: hash,
        confirmations: 4,
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
      console.log(data)

    } catch (error: any) {
      setapproveLoading(false)
      if (!swapContext) return

      console.log(JSON.stringify(error), 'error message log')

      if (error.name === 'TransactionExecutionError') {
        swapContext.setGlobalDialogMessage(formatErrorMessage(error, 'Swap failed'))
        return
      }
      if (error.name === 'TransactionNotFoundError') {
        // swapContext.setGlobalDialogMessage(formatErrorMessage(error, 'Swap failed'))
        return
      }


      if (error.description) {
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description: error.description
        })
        return
      }

      if (error.message && swapContext) {
        swapContext.setGlobalDialogMessage({
          type: 'error',
          description: (error.reason || error.message || 'Unknown error')
        })
        return
      }

      swapContext.setGlobalDialogMessage({
        type: 'error',
        description: 'Unknown error'
      })
    }
  }

  const resetData = async () => {
    swapContext?.setToAmount('')
    cancel()
    settokens(undefined)

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

  const resetInputData = async (paramTokens?: token[]) => {
    swapContext?.setFromAmount('')
    swapContext?.setToAmount('')
    cancel()
    swapContext?.setquoteData(undefined)
    const tokenList = paramTokens || tokens
    if (tokenList?.length) {
      const tokenBalanceList = await getTokenListBalance(tokenList)
      settokens([...tokenBalanceList])
    }
  }

  const { run: accountChangeRun, cancel: accountChangeCancel } = useRequest(resetInputData, {
    debounceWait: 1000,
    manual: true,
  });



  useUpdateEffect(() => {
    networkChangeCancel()
    networkChangeRun()

    console.log("watchNetwork", isConnected, chain?.id, address)
  }, [chainId])

  useUpdateEffect(() => {
    const isNotFirstConnected = sessionStorage.getItem('isFirstConnected')
    if (isNotFirstConnected) {
      cancel()
      // run()
      accountChangeCancel()
      accountChangeRun()
      console.log("watchAccount", isConnected, chain?.id, address)
    } else {
      sessionStorage.setItem('isFirstConnected', '1')
    }
    // if(!address) {
    //   sessionStorage.removeItem('isFirstConnected')
    // }

  }, [address])

  const replaceValue = (val: string) => {
    const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,18})/g)?.[0] || ""
    return value
  }

  const swapLoading = useMemo(() => loading || approveLoading, [loading, approveLoading])

  const getFromInputChange = (val: string) => {
    cancel()
    if (val) {
      const value = replaceValue(val)
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
      const value = replaceValue(val)
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
      setcurrentSwitchType('to')
    }
  }

  const setFromInputChange = (value: string) => {
    swapContext?.setFromAmount(value)
    swapContext?.setToAmount('')
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress
    if (toTokenAddress && fromTokenAddress) {
      setcurrentSwitchType('from')
      run(fromTokenAddress, toTokenAddress, value, 'from')
    }
  }
  const getTokenToUSDPrice = async (tokenAddress: string, paramsTokenList?: token[]) => {
    if (tokens?.length || paramsTokenList?.length) {
      const tokenList = paramsTokenList || tokens || []
      const tokenIndex = tokenList.findIndex(val => val.address === tokenAddress)
      if (tokenIndex > -1 && !tokenList[tokenIndex].price) {
        try {
          const price = await fetchUSD(tokenList[tokenIndex].symbol)
          tokenList[tokenIndex].price = price
          settokens([...tokenList])
        } catch (error) {
          console.log(error, 'getTokenToUSDPrice-error')
        }
      }
    }
  }


  const getFromTokenChange = async (val: string) => {
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

    if(chain && address && [100, 8217, 1313161554, 324].includes(chain.id) && tokens) {
      if(swapContext?.swapFromData.tokenAddress) {
        const balance = await getBalance(swapContext?.swapFromData.tokenAddress as address, address, chain)
        if(balance?.value.toString() !== '0'){
          const tokenIndex = tokens.findIndex(val => val.address === swapContext?.swapFromData.tokenAddress)
          tokens[tokenIndex].balance = formatAmount(balance?.value.toString(), tokens[tokenIndex].decimals)
          settokens([...tokens])
        }
      }
    }

    // getTokenToUSDPrice(val)
  }

  const getToTokenChange = async (val: string) => {
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

    if(chain && address && [100, 8217, 1313161554, 324].includes(chain.id) && tokens) {
      if(swapContext?.swapToData.tokenAddress) {
        const balance = await getBalance(swapContext?.swapToData.tokenAddress as address, address, chain)
        console.log('get to balance')
        if(balance?.value.toString() !== '0'){
          const tokenIndex = tokens.findIndex(val => val.address === swapContext?.swapToData.tokenAddress)
          tokens[tokenIndex].balance = formatAmount(balance?.value.toString(), tokens[tokenIndex].decimals)
          settokens([...tokens])
        }
      }
    }
    // getTokenToUSDPrice(val)
  }

  const switchToken = () => {
    if (swapLoading) {
      return
    }

    if (swapContext) {
      const swapToData = swapContext.swapToData
      const swapFromData = swapContext.swapFromData
      const fromToken = tokens?.length && findToken(tokens, swapFromData.tokenAddress)
      const toToken = tokens?.length && findToken(tokens, swapToData.tokenAddress)
      const toAmount = swapContext.toAmount
      cancel()

      currentSwitchType === 'from' ?
        run(swapFromData.tokenAddress, swapToData.tokenAddress, swapContext.fromAmount, 'to') :
        run(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount, 'from')
      if (currentSwitchType === 'from') {
        console.log(swapFromData.tokenAddress, swapToData.tokenAddress, swapContext.fromAmount, currentSwitchType)
      } else {
        console.log(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount, currentSwitchType)
      }


      setcurrentSwitchType(currentSwitchType === 'from' ? 'to' : 'from')

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
          {tokens ? <TokenInput
            type="from"
            onChange={getFromInputChange}
            onTokenChange={getFromTokenChange}
            setInputChange={setFromInputChange}
            tokens={tokens}
            tokenAddress={swapContext?.swapFromData.tokenAddress}
            placeholder='0'
            isTokenLoading={isTokenLoading}
            maxLength={swapContext?.swapFromData.decimals}
            ref={fromInputRef}
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={swapContext?.fromAmount} /> : <Skeleton animated className="custom-skeleton" />}

          <div className="switch-token flex items-center justify-center cursor-pointer" onClick={switchToken}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>

          {tokens ? <TokenInput
            type="to"
            tokens={tokens}
            value={swapContext?.toAmount}
            ref={toInputRef}
            maxLength={swapContext?.swapToData.decimals}
            onChange={getToInputChange}
            onTokenChange={getToTokenChange}
            placeholder='0'
            tokenAddress={swapContext?.swapToData.tokenAddress}
          // readOnly
          /> : <Skeleton animated className="custom-skeleton" />}
        </div>

        <Quote tokens={tokens} data={swapContext?.quoteData} loading={swapLoading} />

        <SwapButton onClick={onClickSwap} loading={swapLoading} />

        <CenterPopup showCloseButton visible={showConfirmDialog} className="dialog-container" onClose={() => setshowConfirmDialog(false)}>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
              </div>

              <TokenInput
                type="to"
                status="ready"
                tokens={tokens}
                value={swapContext?.toAmount}
                tokenAddress={swapContext?.swapToData.tokenAddress}
              />
            </div>
            <Quote data={swapContext?.quoteData} tokens={tokens} loading={swapLoading} status="ready" />
            <Button block color="primary" className="confirm-swap-btn" loading={approveLoading} onClick={confirmSwap}>Confirm Swap</Button>
          </div>
        </CenterPopup>

        <StatusDialog successClose={resetInputData} dismissClose={dismissClose} />

        <Setting visible={openSetting} onClose={() => setopenSetting(false)} />
        {/* <Button onClick={()=>{
          resetInputData()
              }}>reset</Button> */}
      </div >
      <Notification />
    </div>
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
  </div>
};
export default Home;
