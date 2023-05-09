
import "./index.less";
import { useEffect, useState } from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAccount, useNetwork } from "wagmi";
import { routeProps } from "@/routes";
import { allowance, getQuote, getSwapData, getTokens, spender, transaction } from "@/api/swap";
import { formatAmount, parseAmount } from "@/utils";
import { useRequest } from "ahooks";
import { sendTransaction } from '@wagmi/core'
import SwapProvider from "@/context/swapContext";
import { SetOutline } from "antd-mobile-icons";
import TokenInput from "@/components/tokenInput";
import SwapButton from "@/components/swapButton";
const defaultTokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
type allowanceParams = Record<'tokenAddress' | 'walletAddress', string>
type transactionParams = Record<'tokenAddress' | 'amount', string>
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

  // init page
  const [showLayout, setshowLayout] = useState(true)
  const init = () => {
    setshowLayout(true)
    getTokenList()
    getSpender()
  }
  const [tokens, settokens] = useState<token>({})
  const [fromTokenAddress, setFormtokenAddress] = useState(defaultTokenAddress)
  const [toTokenAddress, setToTokenAddress] = useState('')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  const getTokenList = () => {
    getTokens<{
      "tokens": token
    }>(chainId).then(res => {
      settokens({ ...res.data.tokens })
      setFormtokenAddress(defaultTokenAddress)
      const findUSDTAddress = Object.keys(res.data.tokens).find(key => res.data.tokens[key].symbol === 'USDT')

      if (findUSDTAddress) {
        setToTokenAddress(findUSDTAddress)
        setFromAmount('')
        quote(defaultTokenAddress, findUSDTAddress)
      }
    })
  }

  const [spenderAddress, setspenderAddress] = useState('')
  const getSpender = () => {
    spender<{
      "address": string
    }>(chainId).then(res => {
      setspenderAddress(res.data.address)
    })
  }


  const quote = (fromTokenAddr = fromTokenAddress, toTokenAddr = toTokenAddress, amount = fromAmount) => {
    if (!fromTokenAddr || !toTokenAddr || (!amount || amount === '0' || amount === '') || !tokens[fromTokenAddr]) {
      return Promise.reject('error')
    }
    const parseAmountStr = tokens[fromTokenAddr] ? parseAmount(amount, tokens[fromTokenAddr]?.decimals) : '0'
    if (parseAmountStr === '0') return Promise.reject('error')

    return getQuote<quoteData, quoteParams>(chainId, {
      fromTokenAddress: fromTokenAddr,
      toTokenAddress: toTokenAddr,
      amount: parseAmountStr,
      fee: 1
    }).then(res => {
      const toTokenAmount = formatAmount(res.data.toTokenAmount, res.data.toToken.decimals)
      if(fromAmount) setToAmount(toTokenAmount)
    })
  }

  const { address } = useAccount()
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
      const parseAmountStr = tokens[tokenAddress] ? parseAmount(toAmount, tokens[tokenAddress]?.decimals) : '0'
      const allowanceData: transactionParams = {
        tokenAddress,
        amount: parseAmountStr
      }
      const result = await transaction<Record<'data' | 'gasPrice' | 'value', string> & {
        to: `0x${string}`
      }, transactionParams>(chainId, allowanceData)
      return result.data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const swap = async () => {
    if (!address || !toTokenAddress) return
    try {
      /* 
      * 1. get allowance balance
      * 2. Generate data for calling the contract in order to allow the 1inch router to spend funds
      * 3. Using eth_sendTransaction and eth_getTransactionReceipt to retrieve authorization results.
      * 4. Using eth_signTypedData_v4
      */
      const result = await getAllowance(toTokenAddress)
      if (result.allowance === '0') {
        const transactionResult = await getTransaction(toTokenAddress)
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

    }
  }

  const submitSwap = async () => {
    // eth_signTypedData_v4
    // const sign = await signTypedData()
    if (!address) return
    try {
      const parseAmountStr = tokens[fromTokenAddress] ? parseAmount(fromAmount, tokens[fromTokenAddress]?.decimals) : '0'
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

  const { run } = useRequest(quote, {
    debounceWait: 350,
    manual: true,
  });

  const getFromInputChange = (val: string) => {
    if(val){
      const value = val.replace(/[^\d^\.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,2})/g)?.[0] || ""
      setFromAmount(value)
      setToAmount('')
      run(fromTokenAddress, toTokenAddress, value)
    }else{
      setFromAmount('')
      setToAmount('')
    }
  }


  // const getToInputChange = (val: string) =>{
  //   run(toTokenAddress, fromTokenAddress, val, )
  //   setToAmount(val)
  //   setFromAmount('')
  // }
  return showLayout ?
    <SwapProvider>
      <div className="swap-container">
        <div className="flex justify-between items-center swap-header">
          <p className="title">Swap</p>
          <SetOutline className="setting-icon" />
        </div>
        <div>
          <TokenInput
            type="from"
            onChange={getFromInputChange}
            tokens={tokens}
            defaultTokenAddress={defaultTokenAddress}
            placeholder='0'
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={fromAmount} />

          <div className="switch-token flex items-center justify-center">
            <i className="iconfont icon-xiajiantou"></i>
          </div>

          <TokenInput
            type="to"
            tokens={tokens}
            value={toAmount}
            placeholder='0'
            readOnly
            disabled />
        </div>
        <SwapButton onClick={swap} />
        {/* <p>
        {tokens[fromTokenAddress]?.symbol}
      </p>
      <p>
        {tokens[toTokenAddress]?.symbol}
      </p> */}

      </div >
    </SwapProvider> :
    <></>
};
export default Home;
