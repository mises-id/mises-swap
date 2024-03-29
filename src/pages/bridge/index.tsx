/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/react-in-jsx-scope */
import "./index.less";
import { useContext, useEffect, useState, SetStateAction } from "react";
import { signin } from '@/api/request';
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { hooks } from '@/components/Web3Provider/mises';
import { useWeb3React } from '@web3-react/core';
import { SwapContext } from "@/context/swapContext";
import BridgeTokenInput from "@/components/bridgeTokenInput";
import { Button, Checkbox, Toast } from "antd-mobile";
import StatusDialog from "@/components/StatusDialog";
import { useNavigate } from "react-router-dom";
import { findBridgeToken, retryRequest } from "@/utils";
import { getBridgeTokens, getBridgeTokenPairInfo, getBridgeTokenExchangeAmount, getBridgeFixRateForAmount, createBridgeTransaction, createFixBridgeTransaction } from "@/api/bridge";
import { useRequest, useMount } from "ahooks";
import BridgeMode from "@/components/BridgeMode";
import BridgeHistoryList from "@/components/BridgeHistoryList";
import { useLocation } from 'react-router-dom';

const { useAccounts } = hooks

interface getPairInfoParams {
  from: string,
  to: string
}

interface getPairInfoResult {
  from: string,
  to: string,
  minAmountFloat: string,
  maxAmountFloat: string,
  minAmountFixed: string,
  maxAmountFixed: string
}

interface getBridgeTokenExchangeAmountParams {
  from: string,
  to: string,
  amountFrom: string
}

interface getBridgeTokenExchangeAmountResult {
  from: string,
  to: string,
  networkFee: string,
  amountFrom: string,
  amountTo	: string,
  max: string,
  maxFrom: string,
  maxTo: string,
  min: string,
  minFrom: string,
  minTo: string,
  visibleAmount: string,
  rate: string,
  fee: string
}

interface getBridgeFixRateForAmountParams {
  from: string,
  to: string,
  amountFrom: string
}

interface getBridgeFixRateForAmountResult {
  id:string
  result:string
  from:string
  to:string
  networkFee:string
  max:string
  maxFrom:string
  maxTo:string
  min:string
  minFrom:string
  minTo:string
  amountFrom:string
  amountTo	:string
  expiredAt:number
}

interface createBridgeTransactionParams {
  from: string,
  fromChain: string,
  to: string,
  toChain: string,
  address: string,
  extraId?:string,
  amountFrom:string,
  refundAddress?: string,
  refundExtraId?: string
}

interface createBridgeTransactionResult {
  id: string,
  trackUrl: string,
  type: string,
  payinAddress: string,
  payinExtraId: string,
  payoutAddress: string,
  payoutExtraId: string,
  refundAddress: string,
  refundExtraId: string,
  amountExpectedFrom: string,
  amountExpectedTo: string,
  status: string,
  currencyTo: string,
  currencyFrom: string,
  createdAt: number
}

interface createFixBridgeTransactionParams {
  from: string,
  fromChain: string,
  to: string,
  toChain: string,
  rateId: string,
  address: string,
  extraId?: string,
  amountFrom?: string,
  amountTo	?: string,
  refundAddress: string,
  refundExtraId?: string
}

interface createFixBridgeTransactionResult {
  id: string,
  trackUrl: string,
  type: string,
  payinAddress: string,
  payinExtraId: string,
  payoutAddress: string,
  payoutExtraId: string,
  refundAddress: string,
  refundExtraId: string,
  amountExpectedFrom: string,
  amountExpectedTo: string,
  status: string,
  payTill: string,
  currencyTo: string,
  currencyFrom: string,
  createdAt: number
}

const Bridge = () => {
  // hooks
  const analytics = useAnalytics()
  const swapContext = useContext(SwapContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [showMainForm, setShowMainForm] = useState<boolean>(true)
  const [refundAddress /*, setRefundAddress*/] = useState<string>("")
  const [refundExtraId /*, setRefundExtraId*/] = useState<string>("")

  const [disableExchangeButton, setDisableExchangeButton] = useState(false)
  const [totalDisabled, setTotalDisabled] = useState(false)

  // form status
  const [bridgeModeStatus, setBridgeModeStatus] = useState(false)

  const [showConnectWallet, setShowConnectWallet] = useState(false)
  const [apiToken, setApiToken] = useState("")

  const accounts = useAccounts()

  const { connector } = useWeb3React();


  const init = async () => {
    logEvent(analytics, 'open_bridge_page')
    const isPageReLoad = sessionStorage.getItem('isPageReLoad')
    if(isPageReLoad) {
      logEvent(analytics, 'swap_bridge_reload')
      sessionStorage.removeItem('isPageReLoad')
    }
    if(!swapContext?.bridgeFromAmount){
      swapContext!.bridgeFromAmount = "0.1"
      swapContext?.setBridgeFromAmount("0.1")
    }
    getBridgeTokenList()
  }

  useEffect(() => {
    init()
    // eslint-disable-next-line
  }, []);

  // getBridgeTokenList
  const getTokensWithRetry = retryRequest(getBridgeTokens)
  const getBridgeTokenList = async () => {
    try {
      const cacheTokens = sessionStorage.getItem('bridgeTokenList')
       let tokenList: token[] = []
       if (cacheTokens && cacheTokens!=='undefined') {
         tokenList = JSON.parse(cacheTokens)
      }
      if(tokenList.length === 0) {
        const res = await getTokensWithRetry<{ data: token[] }>()
        if (res) {
          tokenList = res.data.data || []
          sessionStorage.setItem('bridgeTokenList', JSON.stringify(tokenList))
        } else {
          tokenList = []
        }
      }

      swapContext!.setBridgeTokens([...tokenList])

      if(!swapContext?.bridgeFromData.symbol){
        const fromToken = findBridgeToken(tokenList, "btc")
        if(fromToken) {
          swapContext!.bridgeFromData = {
            ...fromToken
          }
          swapContext?.setBridgeFromData({
            ...swapContext.bridgeFromData
          })
        }
      }

      if(!swapContext?.bridgeToData.symbol){
        const toToken = findBridgeToken(tokenList, "eth")
        if(toToken) {
          swapContext!.bridgeToData = {
            ...toToken
          }
          swapContext?.setBridgeToData({
            ...swapContext.bridgeToData
          })
        }
      }

      runRefresh()

    } catch (error: any) {
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: "Network Error: Failed to obtain Currencies"
      })
    }
  }

  const [checked, setChecked] = useState(false)
  const UserClause = (props: {bridgeModeStatus:boolean, userClauseChecked: boolean, setChecked: (value: SetStateAction<boolean>) => void}) => {
    const [nextStepButton, setNextStepButton] = useState<boolean>(true)

    useEffect(() => {
      if(swapContext?.bridgeToAmount && swapContext.bridgeToAmount !== "..." && props.bridgeModeStatus && props.userClauseChecked){
        setNextStepButton(false)
      }else{
        setNextStepButton(true)
      }
    }, [props.bridgeModeStatus, props.userClauseChecked])

    const goToConfirm = () => {
      setShowMainForm(false)
    }
    
    return (
      <div className="bridge-swap-container auto-z-index user-clause">
        <div className="user-clause-title">
        ✔&nbsp;I have been informed and agreed
        </div>
        <div className="flex">
            <Checkbox checked={props.userClauseChecked} onChange={() => setChecked(!props.userClauseChecked)} />
            <div className="user-clause-tip">The exchange service is provided by Changelly.com. If there is any problem, I need to contact the support of Changelly.com directly.</div>
        </div>
        <Button
          onClick={goToConfirm}
          disabled={nextStepButton}
          block
          color="primary"
          className='exchange-button auto-z-index'>Next step</Button>
      </div>
    )
  }

  const TransactionDetails = () => {

    const [submitButtonLoading, setSubmitButtonLoading] = useState(false)

    const createTransaction = async () => {
      setSubmitButtonLoading(true)
      try{
        let transactionId = ""
        if(swapContext?.bridgeFloatMode){
          // todo:check params

          // float
          const params:createBridgeTransactionParams = {
            from: swapContext.bridgeFromData.symbol,
            fromChain: swapContext.bridgeFromData.bridgeBlockchain || "",
            to: swapContext.bridgeToData.symbol,
            toChain: swapContext.bridgeToData.bridgeBlockchain || "",
            address: swapContext.bridgeFloatRecipentAddress,
            extraId: swapContext.bridgeFloatRecipentExtraId,
            amountFrom: swapContext.bridgeFromAmount,
            refundAddress: refundAddress,
            refundExtraId: refundExtraId
          }
          const ret = await createBridgeTransaction<{data: createBridgeTransactionResult}, createBridgeTransactionParams>(params)
          if(ret.data.data.id){
            transactionId = ret.data.data.id
          } else {
            throw new Error("empty transaction id")
          }
        } else {
          // todo:check params

          // fix
          const params:createFixBridgeTransactionParams = {
            from: swapContext!.bridgeFromData.symbol,
            fromChain: swapContext?.bridgeFromData.bridgeBlockchain || "",
            to: swapContext!.bridgeToData.symbol,
            toChain: swapContext?.bridgeToData.bridgeBlockchain || "",
            rateId: swapContext!.bridgeFixedRateId,
            address: swapContext!.bridgeFixedRecipentAddress,
            extraId: swapContext?.bridgeFixedRecipentExtraId,
            amountFrom: swapContext!.bridgeFromAmount,
            refundAddress: swapContext!.bridgeFixedRefundAddress,
            refundExtraId: swapContext?.bridgeFixedRefundExtraId
          }
          const ret = await createFixBridgeTransaction<{data:createFixBridgeTransactionResult}, createFixBridgeTransactionParams>(params)
          if(ret.data.data.id){
            transactionId = ret.data.data.id
          } else {
            throw new Error("empty transaction id")
          }
        }

        // jump 
        navigate(`/bridge/transaction/${transactionId}`)
        return
      } catch (err) {
        swapContext?.setGlobalDialogMessage({
          type: 'error',
          description: "Network Error: Failed to create transaction."
        })
      }
      setSubmitButtonLoading(false)
    }

    return (
      <div className='flex-1 flex flex-col overflow-hidden relative'>
      <div className="bridge-swap-container">
        <div className="flex justify-between items-center swap-header">
          <p className="unselected-title" onClick={() => navigate('/')}>Swap</p><p className="selected-title">Bridge</p>
          <div className="flex items-center"></div>
        </div>
        <div>
            <div className="flex justify-between items-center">
              <h3>Checkout</h3>
              <Button
                onClick={() => {setShowMainForm(true)}}
                color="primary"
                className='bridge-back-button'>Back</Button>
            </div>
            { swapContext?.bridgeFloatMode ?
            <>
            <div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">You send</div>
                <div className="bridge-transaction-detail-content">{swapContext.bridgeFromAmount} {swapContext.bridgeFromData.symbol}</div>
                {/*<div className="bridge-transaction-detail-tip">blockchain: {bitcoin}</div>*/}
              </div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">You'll get</div>
                <div className="bridge-transaction-detail-content">{swapContext.bridgeToAmount} {swapContext.bridgeToData.symbol}</div>
                {/*<div className="bridge-transaction-detail-tip">blockchain: ethereum</div>*/}
              </div>
            </div>
            <div>
            {/*
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Exchange fee</div>
                <div className="bridge-transaction-detail-content">0.00455041 ETH</div>
                <div className="bridge-transaction-detail-tip">The exchange fee is already included in the displayed amount you’ll get</div>
              </div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Network fee</div>
                <div className="bridge-transaction-detail-content">0.001617 ETH</div>
                <div className="bridge-transaction-detail-tip">The network fee is already included in the displayed amount you’ll get</div>
              </div>
            */}
            </div>
            <div className="bridge-transaction-detail-block">
              <div className="bridge-transaction-detail-title">Recipient address ({swapContext.bridgeToData.bridgeBlockchain})</div>
              <div className="bridge-transaction-detail-content">{swapContext.bridgeFloatRecipentAddress}</div>
            </div>
            {/*
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Exchange rate</div>
                <div className="bridge-transaction-detail-content">1 BTC ~ 18.20161503 ETH</div>
              </div>
            */}
            </>
            :
            <>
              <div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">You send</div>
                <div className="bridge-transaction-detail-content">{swapContext?.bridgeFromAmount} {swapContext?.bridgeFromData.symbol}</div>
                {/*<div className="bridge-transaction-detail-tip">blockchain: bitcoin</div>*/}
              </div>
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">You'll get</div>
                <div className="bridge-transaction-detail-content">{swapContext?.bridgeToAmount} {swapContext?.bridgeToData.symbol}</div>
                {/*<div className="bridge-transaction-detail-tip">blockchain: ethereum</div>*/}
              </div>
            </div>
            <div>
              {/*
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Guaranteed rate</div>
                <div className="bridge-transaction-detail-content">1 BTC = 17.90606837 ETH</div>
              </div>
              */}
              <div className="bridge-transaction-detail-block">
                <div className="bridge-transaction-detail-title">Recipient address ({swapContext?.bridgeToData.bridgeBlockchain})</div>
                <div className="bridge-transaction-detail-content">{swapContext?.bridgeFixedRecipentAddress}</div>
              </div>
            </div>
            <div className="bridge-transaction-detail-block">
              <div className="bridge-transaction-detail-title">Refund address ({swapContext?.bridgeFromData.bridgeBlockchain})</div>
              <div className="bridge-transaction-detail-content">{swapContext?.bridgeFixedRefundAddress}</div>
            </div>
            </>
            }
        </div>
        <div>
        <Button
          loading={submitButtonLoading}
          loadingText="Processing"
          onClick={createTransaction}
          block
          color="primary"
          className='confirm-button'>Confirm &amp; make payment</Button>
        </div>
      </div>
    </div>
    )
  }

  // switchToken
  const switchToken = () => {
    cancelRefresh()
    const tokens = swapContext!.bridgeTokens
    if (swapContext) {
      const fromToken = tokens?.length && findBridgeToken(tokens, swapContext.bridgeFromData.symbol)
      const toToken = tokens?.length && findBridgeToken(tokens, swapContext.bridgeToData.symbol)
      if(fromToken){
        swapContext.bridgeToData = {
          ...fromToken
        }
        swapContext.setBridgeToData({
          ...swapContext.bridgeToData
        })
      }
      if(toToken){
        swapContext.bridgeFromData = {
          ...toToken
        }
        swapContext.setBridgeFromData({
          ...swapContext.bridgeFromData
        })
      }
      runRefresh()
    }
  }

  let floatAvailable = false;
  let fixAvailable = false;

  // checkPairInfo
  const getBridgeTokenPairInfoWithRetry = retryRequest(getBridgeTokenPairInfo)
  const checkPairInfo = async (fromVal: string | undefined, toVal: string | undefined): Promise<boolean> => {
    swapContext!.setBridgeAmountCheckMsg("")
    swapContext!.setBridgeFloatAvailable(false)
    swapContext!.setBridgeFixedAvailable(false)
    floatAvailable = false
    fixAvailable = false
    setDisableExchangeButton(true)
    swapContext?.setBridgeToAmount("...")
    swapContext?.setBridgeFloatOutputAmount("...")
    swapContext?.setBridgeFixedOutputAmount("...")

    if(!fromVal){
      swapContext?.setBridgeToAmount("")
      return false
    }

    if(!toVal){
      swapContext?.setBridgeToAmount("")
      return false
    }

    try{
      const ret = await getBridgeTokenPairInfoWithRetry<{data: getPairInfoResult}, {pairs:getPairInfoParams}>({pairs: {from: fromVal, to: toVal}})
      if(!ret.data.data || Object.keys(ret.data.data).length === 0){
        swapContext?.setBridgeToAmount("")
        return false
      }

      const minAmountFloat = parseFloat(ret.data.data.minAmountFloat)
      const maxAmountFloat = parseFloat(ret.data.data.maxAmountFloat)
      const minAmountFixed = parseFloat(ret.data.data.minAmountFixed)
      const maxAmountFixed = parseFloat(ret.data.data.maxAmountFixed)

      if(isNaN(minAmountFloat) && isNaN(maxAmountFloat) && isNaN(minAmountFixed) && isNaN(maxAmountFixed)){
        swapContext?.setBridgeToAmount("")
        swapContext!.setBridgeAmountCheckMsg("Unsupported exchange pair")
        setDisableExchangeButton(true)
        return false
      }

      const fromAmount = parseFloat(swapContext!.bridgeFromAmount)

      if(fromAmount){
        if(!isNaN(minAmountFloat) && !isNaN(maxAmountFloat) && (fromAmount >= minAmountFloat) && (fromAmount <= maxAmountFloat)){
          floatAvailable = true
        }
        if(!isNaN(minAmountFixed) && !isNaN(maxAmountFixed) && (fromAmount >= minAmountFixed) && (fromAmount <= maxAmountFixed)){
          fixAvailable = true
        }
      }

      let minAmount:number = 0
      let maxAmount:number = 0
      if(swapContext!.bridgeFloatMode){
        minAmount = minAmountFloat
        maxAmount = maxAmountFloat
      }else{
        minAmount = minAmountFixed
        maxAmount = maxAmountFixed
      }
      if(!fromAmount || fromAmount < minAmount) {
        swapContext!.setBridgeAmountCheckMsg(`Minimum amount: ${minAmount} ${fromVal}`)
        swapContext?.setBridgeToAmount("")
        return false
      }
      if(fromAmount > maxAmount){
        swapContext!.setBridgeAmountCheckMsg(`Maximum allowed: ${maxAmount} ${fromVal}`)
        swapContext?.setBridgeToAmount("")
        return false
      }
    }catch(err){
      swapContext!.setBridgeAmountCheckMsg("Unsupported exchange pair")
      swapContext?.setBridgeToAmount("")
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: "Data Error: Please check your network"
      })
      return false
    }
    setDisableExchangeButton(false)
    return true
  }

  // generateOutputAmount
  const getBridgeTokenExchangeAmountRetry = retryRequest(getBridgeTokenExchangeAmount)
  const getBridgeFixRateForAmountRetry = retryRequest(getBridgeFixRateForAmount)
  const generateOutputAmount = async (from: string | undefined, to: string | undefined, amountFrom: string | undefined) => {
    swapContext?.setBridgeToAmount("...")
    swapContext?.setBridgeFloatOutputAmount("...")
    swapContext?.setBridgeFixedOutputAmount("...")

    if(!from){
      return false
    }
    if(!to){
      return false
    }
    if(!amountFrom){
      return false
    }

    if(floatAvailable){
    getBridgeTokenExchangeAmountRetry<{data: getBridgeTokenExchangeAmountResult}, {pairs:getBridgeTokenExchangeAmountParams}>({pairs: {from, to, amountFrom}})
      .then((ret) => {
        if(!ret.data.data && Object.keys(ret.data.data).length === 0){
          throw new Error("result is empty")
        }
        const amountTo = parseFloat(ret.data.data.amountTo)
        if(isNaN(amountTo)){
          throw new Error("amountTo or networkFee is NaN")
        }
        if(swapContext?.bridgeFloatMode){
          swapContext?.setBridgeToAmount(`~ ${amountTo}`)
        }
        swapContext?.setBridgeFloatOutputAmount(`~ ${amountTo}`)
        swapContext?.setBridgeFloatAvailable(true)
      })
      .catch((err) => {
        console.error("getBridgeTokenExchangeAmountRetry:", err)
      })
    }

    if(fixAvailable){
    getBridgeFixRateForAmountRetry<{data: getBridgeFixRateForAmountResult}, {params:getBridgeFixRateForAmountParams}>({params:{from, to, amountFrom}})
      .then((ret) => {
        if(!ret.data.data && Object.keys(ret.data.data).length === 0){
          throw new Error("result is empty")
        }
        const amountTo = parseFloat(ret.data.data.amountTo)
        if(isNaN(amountTo)){
          throw new Error("amountTo or networkFee is NaN")
        }
        if(!swapContext?.bridgeFloatMode){
          swapContext?.setBridgeToAmount(`${amountTo}`)
        }
        swapContext?.setBridgeFixedOutputAmount(`${amountTo}`)
        if(ret.data.data.id){
          swapContext?.setBridgeFixedRateId(ret.data.data.id)
        }
        swapContext?.setBridgeFixedAvailable(true)
      })
      .catch((err) => {
        console.error("getBridgeFixRateForAmountRetry:", err)
      })
    }

    return true
  }

  const loginMisesAccount = async (params: {
    auth: string,
    misesId: string
  }) => {
    try {
      const data = await signin(params.auth)
      localStorage.setItem('ethAccount', params.misesId)
      localStorage.setItem('token', data.token)
      setApiToken(data.token)
      setShowConnectWallet(false)
    } catch (error) {
      setShowConnectWallet(true)
    }
  }

  const signMsg = async (newAccount:string) => {
    try {
      const timestamp = new Date().getTime();
      if (newAccount) {
        const address = newAccount
        const nonce = `${timestamp}`;
        const sigMsg = `address=${address}&nonce=${timestamp}`
        const data = await window.misesEthereum?.signMessageForAuth(address, nonce)
        if (data?.sig) {
          const auth = `${sigMsg}&sig=${data?.sig}`
          return auth
        }
        return Promise.reject({
          code: 9998,
          message: 'Not found personal sign message'
        })
      }
      return Promise.reject({
        code: 9998,
        message: 'Invalid address'
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const loginMises = (newAccount:string) => {
    const oldConnectAddress = localStorage.getItem('ethAccount')
    if (newAccount && oldConnectAddress !== newAccount) {
      signMsg(newAccount).then(auth => {
        loginMisesAccount({
          auth,
          misesId: newAccount
        })
      }).catch(error => {
        console.log(error, 'error')
        if(error && error.message) {
          Toast.show(error.message)
        }
      })
    }
  }

  const updateCurrentAccount = () => {
    let currentAccount: string
    if (accounts?.length) {
      currentAccount = accounts[0]

      loginMises(currentAccount)
    }else{
      const connectAddress = localStorage.getItem('ethAccount')
      currentAccount = connectAddress || ''
    }
  }

  // eslint-disable-next-line
  useEffect(updateCurrentAccount, [accounts])

  const connectWallet = async () => {
    try {
      await connector.activate()
    } catch (error: any) {
      console.log("connectWallet:error", error)
      if(error && error.name === 'NoMetaMaskError') {
        //setDownloadPop(true)
        setTotalDisabled(true)
        Toast.show(error.message)
        return
      }
      if(error && error.code !== 1) {
        Toast.show(error.message)
      }
    }
  }

  useMount(
    () => {
      const token = localStorage.getItem('token')
      const ethAccount = localStorage.getItem('ethAccount')
      if(!ethAccount || !token){
        localStorage.removeItem('token')
        localStorage.removeItem('ethAccount')
        setApiToken("")
        setShowConnectWallet(true)
      } else {
        setApiToken(token!)
      }
    }
  )

  // refresh
  const refresh = async () => {
    try{
      if (await checkPairInfo(swapContext?.bridgeFromData.symbol, swapContext?.bridgeToData.symbol)){
        if(!await generateOutputAmount(swapContext?.bridgeFromData.symbol, swapContext?.bridgeToData.symbol, swapContext?.bridgeFromAmount)){
          throw new Error("fail to generate output")
        }
      } else {
        setBridgeModeStatus(false)
        return false
      }
    } catch(err){
      console.error(`onRefresh:${err}`)
      setBridgeModeStatus(false)
      // error msg
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: "Data Error: Please check your network"
      })
      return false
    }
    return true 
  }

  // runRefresh: wrapper of refresh
  const { run: runRefresh, cancel: cancelRefresh, loading: refreshLoading } = useRequest(refresh, {
    debounceWait: 1000,
    manual: true,
    pollingInterval: 30000,
    pollingWhenHidden: false,
  });

  // event handler: onInputChange
  const onInputChange = async (val: string) => {
    cancelRefresh()
    if(isNaN(Number(val))){
      return false
    }
    swapContext?.setBridgeFromAmount(val)
    runRefresh()
  }

  // event handler: onFromTokenChange
  const onFromTokenChange = async (val : string) => {
    cancelRefresh()
    if(!val) {
      return false
    }
    const tokens = swapContext!.bridgeTokens
    if(!tokens){
      return false
    }
    if (swapContext) {
      const token = findBridgeToken(tokens, val)
      if(!token) {
        return false
      }
      swapContext.bridgeFromData = {
        ...token
      }
      swapContext.setBridgeFromData({
        ...swapContext.bridgeFromData
      })
    }
    runRefresh()
  }

  // event handler: onToTokenChange
  const onToTokenChange = async (val : string) => {
    cancelRefresh()
    if(!val) {
      return false
    }
    const tokens = swapContext!.bridgeTokens
    if(!tokens){
      return false
    }
    if (swapContext) {
      const token = findBridgeToken(tokens, val)
      if(!token) {
        return false
      }
      swapContext.bridgeToData = {
        ...token
      }
      swapContext.setBridgeToData({
        ...swapContext.bridgeToData
      })
    }
    runRefresh()
  }

  if((totalDisabled || showConnectWallet) && location.pathname === '/bridge/process'){
    return null
  }

  // return
  return <div className="flex flex-col flex-1">
    <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
      <div className="relative flex" onClick={() => navigate('/bridge')}>
        <p className='swap-title'><span className='mises-title'>Mises</span> <span>Swap</span></p>
        <div><span className="beta-tag">BETA</span></div>
      </div>
    </div>
    {showMainForm &&
    <div className='flex-1 flex flex-col overflow-hidden relative'>
      <div className="bridge-swap-container">
        <div className="flex justify-between items-center swap-header">
          <p className="unselected-title" onClick={() => navigate('/')}>Swap</p><p className="selected-title">Bridge</p>
          <div className="flex items-center"></div>
        </div>
        <div>
          <BridgeTokenInput
            type="from"
            tokens={swapContext!.bridgeTokens}
            tokenSymbol={swapContext!.bridgeFromData.symbol}
            onInputChange={onInputChange}
            onTokenChange={onFromTokenChange}
            placeholder='0'
            //maxLength={swapContext?.swapFromData.decimals}
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={swapContext?.bridgeFromAmount} 
          />
          <div className="switch-token flex items-center justify-center cursor-pointer" onClick={switchToken}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>
          <BridgeTokenInput
            type="to"
            tokens={swapContext!.bridgeTokens}
            tokenSymbol={swapContext!.bridgeToData.symbol}
            value={refreshLoading ? "..." : swapContext?.bridgeToAmount}
            //maxLength={swapContext?.swapToData.decimals}
            placeholder='0'
            onTokenChange={onToTokenChange}
          />
        </div>
        {location.pathname === '/bridge' && showConnectWallet && <Button
          onClick={connectWallet}
          block
          color="primary"
          className='exchange-button'>Connect Mises ID</Button>}
        {location.pathname === '/bridge' && !showConnectWallet && <Button
          disabled={totalDisabled || disableExchangeButton}
          onClick={() => navigate('/bridge/process')}
          block
          color="primary"
          className='exchange-button'>Exchange Now</Button>}
      </div >
      {location.pathname === '/bridge/process' && <BridgeMode setBridgeModeStatus={setBridgeModeStatus} />}
      {location.pathname === '/bridge/process' && <UserClause bridgeModeStatus={bridgeModeStatus} userClauseChecked={checked} setChecked={setChecked} />}
      {location.pathname === '/bridge' && <BridgeHistoryList token={apiToken}/>}
    </div>
    }

    {!showMainForm && <TransactionDetails/>}
    <StatusDialog />
  </div>
}
export default Bridge;
