
import "./index.less";
import { useContext, useEffect, useMemo, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { routeProps } from "@/routes";
import { allowance, getQuote, getTokens, trades, transaction } from "@/api/swap";
import { findToken, formatAmount, nativeTokenAddress, parseAmount } from "@/utils";
import { useRequest } from "ahooks";
import { sendTransaction, watchNetwork, watchAccount, waitForTransaction } from '@wagmi/core'
import { SwapContext, defaultSlippageValue } from "@/context/swapContext";
// import { SetOutline } from "antd-mobile-icons";
import TokenInput from "@/components/tokenInput";
import SwapButton from "@/components/swapButton";
import { Button, CenterPopup, Skeleton } from "antd-mobile";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import BigNumber from "bignumber.js";
import Quote from "@/components/Quote";
import StatusDialog from "@/components/StatusDialog";
import { SetOutline } from "antd-mobile-icons";
import Setting from "@/components/Setting";
import { getBalance } from "@/api/ether";
import Notification from "@/components/Notification";
type allowanceParams = Record<'token_address' | 'wallet_address', string>
type transactionParams = Record<'token_address', string>
const Home = (props: routeProps) => {
  // firebase
  const analytics = useAnalytics()
  useEffect(() => {
    logEvent(analytics, 'open_swap_page')
    getTokenList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { chain } = useNetwork()
  const chainId = chain?.id || 1

  const [tokens, settokens] = useState<token[] | undefined>(undefined)
  const [toAmount, setToAmount] = useState('')
  const swapContext = useContext(SwapContext)
  const { address } = useAccount()
  const [quoteData, setquoteData] = useState<swapData | undefined>(undefined)

  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const getTokenList = async () => {
    const cacheTokens = sessionStorage.getItem(`${chainId}`)
    let tokenList = undefined
    if (cacheTokens) {
      tokenList = JSON.parse(cacheTokens)
    } else {
      const res = await getTokens<{ "data": token[] }>(chainId)
      if (res) {
        tokenList = res.data.data
        sessionStorage.setItem(`${chainId}`, JSON.stringify(tokenList))
      } else {
        tokenList = []
      }
    }
    settokens([...tokenList])

    if (swapContext) {
      const token = tokenList[nativeTokenAddress] || {}

      swapContext.swapFromData = {
        tokenAddress: nativeTokenAddress,
        ...token
      }

      swapContext.setswapFromData({
        ...swapContext.swapFromData
      })
    }
  }

  const resetData = () => {
    setToAmount('')
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
    return getTokenList()
  }

  const { run: networkChangeRun, cancel: networkChangeCancel } = useRequest(resetData, {
    debounceWait: 350,
    manual: true,
  });

  watchNetwork(() => {
    networkChangeCancel()
    networkChangeRun()
  })

  const [approveLoading, setapproveLoading] = useState(false)

  const quote = async (fromTokenAddr = swapContext?.swapFromData.tokenAddress, toTokenAddr = swapContext?.swapToData.tokenAddress, amount = swapContext?.fromAmount) => {
    const fromToken = tokens?.length && fromTokenAddr && findToken(tokens, fromTokenAddr)

    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !fromToken) {
      return
    }

    const parseAmountStr = fromToken ? parseAmount(amount, fromToken?.decimals) : '0'

    if (parseAmountStr === '0') return Promise.reject('')

    const res = await getQuote<{ data: swapData[] }, quoteParams>({
      chain_id: chainId,
      from_token_address: fromTokenAddr,
      to_token_address: toTokenAddr,
      amount: parseAmountStr
    })
    if (res.data.data.length) {
      const [firstTrade] = res.data.data
      if (firstTrade.error) {
        swapContext?.setStatus(11)
        return
      }

      setquoteData(firstTrade)
      const toToken = findToken(tokens, firstTrade.to_token_address)
      const toTokenAmount = formatAmount(firstTrade.to_token_amount, toToken?.decimals)
      if (swapContext?.fromAmount) setToAmount(toTokenAmount)

      // get balance
      if (address) {
        const balance = await getBalance(fromTokenAddr as address, address)
        if (!balance?.formatted) {
          return res
        }

        const compared = BigNumber(balance?.formatted).comparedTo(amount)

        if (compared === -1) {
          // Insufficient token balance	
          swapContext?.setStatus(4)
          return res
        }

        // allowance
        const allowance = await getAllowance(fromTokenAddr, firstTrade.aggregator.contract_address)

        const comparedAllowance = BigNumber(formatAmount(allowance.data.allowance, fromToken?.decimals)).comparedTo(amount)

        if (comparedAllowance === -1) {
          swapContext?.setStatus(9)
        } else {
          swapContext?.setStatus(99999)
        }
      }
      return
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

  const getTransaction = async (tokenAddress: string) => {
    try {
      const result = await transaction<{
        data: trade
      }, transactionParams & { chain_id: number }>({
        chain_id: chainId,
        token_address: tokenAddress,
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
      */
      setshowConfirmDialog(false)

      if (quoteData?.trade?.to) {
        const result = await getAllowance(tokenAddress, quoteData?.trade?.to)

        const comparedAllowance = BigNumber(formatAmount(result.data.allowance, swapContext.swapFromData?.decimals)).comparedTo(swapContext.fromAmount)

        if (comparedAllowance === -1) {
          const transactionResult = await getTransaction(tokenAddress)
          // eth_sendTransaction
          setapproveLoading(true)

          const { gas_price, ...params } = transactionResult.data
          const { hash } = await sendTransaction({
            ...params,
            gasPrice: gas_price,
          })

          // // eth_getTransactionReceipt
          console.log(hash)
          const data = await waitForTransaction({
            hash: hash,
          })
          console.log(data)

          setapproveLoading(false)

          await submitSwap()
          return
        }
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

      const fromToken = tokens?.length && fromTokenAddress && findToken(tokens, fromTokenAddress)

      const parseAmountStr = fromToken && swapContext?.fromAmount ? parseAmount(swapContext.fromAmount, fromToken?.decimals) : '0'

      if (swapContext) {

        swapContext.setGlobalDialogMessage({
          type: 'pending',
          description: `Waiting for confirmation Swapping ${swapContext?.fromAmount} ${swapContext?.swapFromData.symbol} for ${swapContext?.swapToData.decimals && BigNumber(toAmount).toFixed(swapContext?.swapToData.decimals / 2)} ${swapContext?.swapToData.symbol}`
        })
      }

      const result = await trades<{ data: swapData[] }, quoteParams>({
        chain_id: chainId,
        from_token_address: fromTokenAddress,
        to_token_address: toTokenAddress,
        from_address: address,
        amount: parseAmountStr,
        slippage: (swapContext?.slippage && Number(swapContext?.slippage) < 50) ? Number(swapContext.slippage) / 100 : Number(defaultSlippageValue) / 100,
        dest_receiver: swapContext?.receivingAddress
      })

      const [firstTrade] = result.data.data

      if (!firstTrade || !firstTrade?.trade) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: firstTrade.error || 'Unknown error'
        })
        return
      }

      const {gas_price, ...params} = firstTrade.trade

      const { hash } = await sendTransaction({
        ...params,
        gasPrice: gas_price,
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
      swapContext?.setGlobalDialogMessage({
        type: 'success',
        description: 'Transaction submitted'
      })

      // eth_getTransactionReceipt
      console.log(hash)
      const data = await waitForTransaction({
        hash: hash,
      })

      console.log(data)

      // if (swapContext) {
      //   swapContext?.setGlobalDialogMessage(undefined) // reset
      // }

    } catch (error: any) {
      if (!swapContext) return

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
          description: error.message.indexOf('User rejected the request') > -1 ? 'User rejected the request' : error.message
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

  const swapLoading = useMemo(() => {
    return loading || approveLoading
  }, [loading, approveLoading])

  const getFromInputChange = (val: string) => {
    cancel()
    if (val) {
      const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,8})/g)?.[0] || ""
      setInputChange(value)
    } else {
      swapContext?.setFromAmount('')
      setToAmount('')
    }
  }

  const setInputChange = (value: string) => {
    swapContext?.setFromAmount(value)
    setToAmount('')
    const fromTokenAddress = swapContext!.swapFromData.tokenAddress
    const toTokenAddress = swapContext!.swapToData.tokenAddress

    if (toTokenAddress && fromTokenAddress) {
      run(fromTokenAddress, toTokenAddress, value)
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
      run(val, toTokenAddress, swapContext.fromAmount)
    }
  }

  const getToTokenChange = (val: string) => {
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
      run(fromTokenAddress, val, swapContext.fromAmount)
    }
  }

  const switchToken = () => {
    setToAmount('')
    swapContext?.setFromAmount(toAmount)

    if (swapContext) {
      const swapToData = swapContext.swapToData
      const swapFromData = swapContext.swapFromData
      const fromToken = tokens?.length && findToken(tokens, swapFromData.tokenAddress)
      const toToken = tokens?.length && findToken(tokens, swapToData.tokenAddress)

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

      if (toAmount) run(swapToData.tokenAddress, swapFromData.tokenAddress, toAmount)
    }
  }

  useEffect(() => {
    if (!address) {
      swapContext?.setStatus(1) // unconnect 
      return
    }

    if (!swapContext?.swapToData.tokenAddress || !swapContext?.swapFromData.tokenAddress) {
      swapContext?.setStatus(2) // un select token
      return
    }

    if (!swapContext?.fromAmount) {
      swapContext?.setStatus(3) // unset amount
      return
    }

    // eslint-disable-next-line
  }, [address, swapContext?.swapToData.tokenAddress, swapContext?.fromAmount])

  const [openSetting, setopenSetting] = useState(false)

  return <div className="swap-container">
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
      /> : <Skeleton animated className="custom-skeleton" />}
    </div>

    <Quote tokens={tokens} data={quoteData} loading={swapLoading} />

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
        <Quote data={quoteData} tokens={tokens} loading={swapLoading} status="ready" />
        <Button block color="primary" className="confirm-swap-btn" loading={approveLoading} onClick={confirmSwap}>Confirm Swap</Button>
      </div>
    </CenterPopup>

    <StatusDialog />

    <Setting visible={openSetting} onClose={() => setopenSetting(false)} />

    <Notification />
  </div >
};
export default Home;
