import "./index.less";
import { useContext, useEffect, useState, SetStateAction } from "react";
import Web3 from 'web3';
import { signin } from '@/api/request';
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
//import { hooks } from '@/components/Web3Provider/metamask';
//import { useWeb3React } from '@web3-react/core';
import { SwapContext } from "@/context/swapContext";
import BridgeTokenInput from "@/components/bridgeTokenInput";
import { Button, Toast, CenterPopup } from "antd-mobile";
import StatusDialog from "@/components/StatusDialog";
//import BridgeNotification from "@/components/BridgeNotification";
import { useNavigate } from "react-router-dom";
import { findBridgeToken, retryRequest } from "@/utils";
import { getBridgeTokens, getBridgeTokenPairInfo, getBridgeTokenExchangeAmount, getBridgeFixRateForAmount, createBridgeTransaction, createFixBridgeTransaction } from "@/api/bridge";
import { useRequest, useMount } from "ahooks";
import BridgeMode from "@/components/BridgeMode";
import { useLocation } from 'react-router-dom';

//const { useAccounts } = hooks

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
  to: string,
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
  to: string,
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
  //const [recipientAddress, setRecipientAddress] = useState<string>("")
  //const [recipientExtraId  /*, setRecipientExtraId*/] = useState<string>("")
  const [refundAddress /*, setRefundAddress*/] = useState<string>("")
  const [refundExtraId /*, setRefundExtraId*/] = useState<string>("")
  //const [fixRateId /*, setFixRateId*/] = useState<string>("")

  const [disableExchangeButton, setDisableExchangeButton] = useState(false)

  // form status
  const [bridgeModeStatus, setBridgeModeStatus] = useState(false)

  // const [authAccount, setauthAccount] = useState('')
  //const [/*loading, */ setloading] = useState(true)

  //const [/*downloadPop, */ setDownloadPop] = useState(false)

  const [showConnectWalletPopup, setShowConnectWalletPopup] = useState(false)

  //const accounts = useAccounts()

  //const { connector } = useWeb3React();

  // const getCurrentAccount = () => {
  //   let currentAccount: string
  //   if (accounts?.length) {
  //     currentAccount = accounts[0]
  //     console.log("currentAccount:accounts?.length")
  //   }else{
  //     const connectAddress = localStorage.getItem('ethAccount')
  //     currentAccount = connectAddress || authAccount || ''
  //     console.log("currentAccount:connectAddress || authAccount")
  //   }
  //   // if(!currentAccount){
  //   //   console.log("currentAccount:1")
  //   //   setShowConnectWalletPopup(true)
  //   // }else{
  //   //   console.log("currentAccount:"+currentAccount)
  //   //   setShowConnectWalletPopup(false)
  //   // }
  //   return currentAccount
  // }

  //const currentAccount = useMemo(getCurrentAccount, [accounts, authAccount])

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

  // attempt to connect eagerly on mount
  // useEffect(() => {
  //   metaMask.connectEagerly().catch(() => {
  //     console.debug('Failed to connect eagerly to metamask')
  //   })
  //   setloading(false)
  // }, [])

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
      // swapContext?.setGlobalDialogMessage({
      //   type: 'error',
      //   description: "Network Error: Failed to obtain Currencies"
      // })
    }
  }

  const [checked, setChecked] = useState(false)
  const UserClause = (props: {bridgeModeStatus:boolean, userClauseChecked: boolean, setChecked: (value: SetStateAction<boolean>) => void}) => {
    const [nextStepButton, setNextStepButton] = useState<boolean>(true)

    useEffect(() => {
      if(props.bridgeModeStatus && props.userClauseChecked){
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
        I have been informed and agreed that
        </div>
        <div className="flex">
            <input type="checkbox" checked={props.userClauseChecked} onChange={() => setChecked(!props.userClauseChecked)} />
            <div>The exchange service is provided by Changelly.com. If there is any problem, I need to contact the support line of Changelly.com directly.</div>
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
            to: swapContext.bridgeToData.symbol,
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
            to: swapContext!.bridgeToData.symbol,
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
                <div className="bridge-transaction-detail-title">You get</div>
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
              <div className="bridge-transaction-detail-title">Recipient address</div>
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
                <div className="bridge-transaction-detail-title">You get</div>
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
                <div className="bridge-transaction-detail-title">Recipient address</div>
                <div className="bridge-transaction-detail-content">{swapContext?.bridgeFixedRecipentAddress}</div>
              </div>
            </div>
            <div className="bridge-transaction-detail-block">
              <div className="bridge-transaction-detail-title">Refund address</div>
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
          className='exchange-button'>Confirm &amp; make payment</Button>
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

  let floatAvailable = true;
  let fixAvailable = true;

  // checkPairInfo
  const getBridgeTokenPairInfoWithRetry = retryRequest(getBridgeTokenPairInfo)
  const checkPairInfo = async (fromVal: string | undefined, toVal: string | undefined): Promise<boolean> => {
    swapContext!.setBridgeAmountCheckMsg("")
    swapContext!.setBridgeFloatAvailable(true)
    swapContext!.setBridgeFixedAvailable(true)
    swapContext?.setBridgeFloatNotAvailableMsg("")
    swapContext?.setBridgeFixedNotAvailableMsg("")
    floatAvailable = true
    fixAvailable = true
    setDisableExchangeButton(false)

    if(!fromVal){
      console.error("checkPairInfo:", "from token error")
      swapContext?.setBridgeToAmount("")
      swapContext!.setBridgeFloatAvailable(false)
      swapContext!.setBridgeFixedAvailable(false)
      floatAvailable = false
      fixAvailable = false
      return false
    }
    if(!toVal){
      swapContext?.setBridgeToAmount("")
      swapContext!.setBridgeFloatAvailable(false)
      swapContext!.setBridgeFixedAvailable(false)
      floatAvailable = false
      fixAvailable = false
      console.error("checkPairInfo:", "to token error")
      return false
    }

    try{
      const ret = await getBridgeTokenPairInfoWithRetry<{data: getPairInfoResult}, {pairs:getPairInfoParams}>({pairs: {from: fromVal, to: toVal}})
      if(!ret.data.data || Object.keys(ret.data.data).length === 0){
        console.error("getBridgeTokenPairInfoWithRetry:empty data", ret.data.data)
        swapContext?.setBridgeToAmount("")
        return false
      }

      const minAmountFloat = parseFloat(ret.data.data.minAmountFloat)
      const maxAmountFloat = parseFloat(ret.data.data.maxAmountFloat)
      const minAmountFixed = parseFloat(ret.data.data.minAmountFixed)
      const maxAmountFixed = parseFloat(ret.data.data.maxAmountFixed)

      if(isNaN(minAmountFloat) && isNaN(maxAmountFloat)){
        swapContext?.setBridgeFloatAvailable(false)
        floatAvailable = false
      }

      if(isNaN(minAmountFixed) && isNaN(maxAmountFixed)){
        swapContext?.setBridgeFixedAvailable(false)
        fixAvailable = false
      }

      if(!floatAvailable && !fixAvailable){
        swapContext?.setBridgeToAmount("")
        swapContext!.setBridgeAmountCheckMsg("Unsupported exchange pair")
        setDisableExchangeButton(true)
        return false
      }

      const fromAmount = parseFloat(swapContext!.bridgeFromAmount)

      if(!fromAmount){
        swapContext?.setBridgeFloatAvailable(false)
        swapContext?.setBridgeFixedAvailable(false)
        floatAvailable = false
        fixAvailable = false
      } else {
        if (!isNaN(minAmountFloat) && fromAmount < minAmountFloat) {
          floatAvailable = false
          swapContext?.setBridgeFloatAvailable(false)
          swapContext?.setBridgeFloatNotAvailableMsg(`Cannot be less than ${minAmountFloat}`)
        }
        if (!isNaN(maxAmountFloat) && fromAmount > maxAmountFloat) {
          floatAvailable = false
          swapContext?.setBridgeFloatAvailable(false)
          swapContext?.setBridgeFloatNotAvailableMsg(`Cannot be more than ${maxAmountFloat}`)
        }
        if (!isNaN(minAmountFixed) && fromAmount < minAmountFixed) {
          fixAvailable = false
          swapContext?.setBridgeFixedAvailable(false)
          swapContext?.setBridgeFixedNotAvailableMsg(`Cannot be less than ${minAmountFixed}`)
        }
        if (!isNaN(maxAmountFixed) && fromAmount > maxAmountFixed) {
          fixAvailable = false
          swapContext?.setBridgeFixedAvailable(false)
          swapContext?.setBridgeFixedNotAvailableMsg(`Cannot be more than ${maxAmountFixed}`)
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
        setDisableExchangeButton(true)
        return false
      }
      if(fromAmount > maxAmount){
        swapContext!.setBridgeAmountCheckMsg(`Maximum allowed: ${maxAmount} ${fromVal}`)
        swapContext?.setBridgeToAmount("")
        setDisableExchangeButton(true)
        return false
      }
    }catch(err){
      console.error("getBridgeTokenPairInfoWithRetry:api error", err)
      swapContext!.setBridgeAmountCheckMsg("Unsupported exchange pair")
      swapContext?.setBridgeToAmount("")
      setDisableExchangeButton(true)
      return false
    }
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
      console.error("generateOutputAmount:", "from token error")
      return false
    }
    if(!to){
      console.error("generateOutputAmount:", "to token error")
      return false
    }
    if(!amountFrom){
      console.error("generateOutputAmount:", "amountFrom error")
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
          throw new Error("amountTo or networkFee NaN")
        }
        if(swapContext?.bridgeFloatMode){
          swapContext?.setBridgeToAmount(`~ ${amountTo}`)
        }
        swapContext?.setBridgeFloatOutputAmount(`~ ${amountTo}`)
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
          throw new Error("amountTo or networkFee NaN")
        }
        if(!swapContext?.bridgeFloatMode){
          swapContext?.setBridgeToAmount(`${amountTo}`)
        }
        swapContext?.setBridgeFixedOutputAmount(`${amountTo}`)
        if(ret.data.data.id){
          swapContext?.setBridgeFixedRateId(ret.data.data.id)
        }
      })
      .catch((err) => {
        console.error("getBridgeFixRateForAmountRetry:", err)
      })
    }

    return true
  }

  // const loginMisesAccount = async (params: {
  //   auth: string,
  //   misesId: string
  // }) => {
  //   console.log("connectWallet:4")
  //   try {
  //     localStorage.setItem('ethAccount', params.misesId)
  //     setauthAccount(params.misesId)
  //     //const res = await signin(params.auth)
  //     await signin(params.auth)
  //     //setloading(false)
  //   } catch (error) {
  //     //setloading(false)
  //   }
  // }

  // const signMsg = async () => {
  //   console.log("connectWallet:3")
  //   try {
  //     const timestamp = new Date().getTime();
  //     console.log(accounts, 'accounts')
  //     if (accounts && accounts.length) {
  //       const address = accounts[0]
  //       const nonce = `${timestamp}`;
  //       const sigMsg = `address=${address}&nonce=${timestamp}`
  //       const data = await window.misesEthereum?.signMessageForAuth(address, nonce)
  //       if (data?.sig) {
  //         const auth = `${sigMsg}&sig=${data?.sig}`
  //         return auth
  //       }
  //       return Promise.reject({
  //         code: 9998,
  //         message: 'Not found personal sign message'
  //       })
  //     }
  //     // setsignLoadingFalse()
  //     return Promise.reject({
  //       code: 9998,
  //       message: 'Invalid address'
  //     })
  //   } catch (error) {
  //     // setsignLoadingFalse()
  //     return Promise.reject(error)
  //   }
  // }

  // const loginMises = () => {
  //   console.log("connectWallet:2")
  //   const oldConnectAddress = localStorage.getItem('ethAccount')
  //   if (accounts && accounts.length && oldConnectAddress !== accounts[0]) {
  //     // removeToken('token')
  //     // localStorage.removeItem('ethAccount')
  //     signMsg().then(auth => {
  //       loginMisesAccount({
  //         auth,
  //         misesId: accounts[0]
  //       })
  //     }).catch(error => {
  //       console.log(error, 'error')
  //       if(error && error.message) {
  //         Toast.show(error.message)
  //       }
  //     })
  //   }
  // }

  // const connectWallet = async () => {
  //   try {
  //     await connector.activate()
  //     console.log("connectWallet:1")
  //     loginMises()
  //   } catch (error: any) {
  //     if(error && error.message === 'Please download the latest version of Mises Browser.') {
  //       setDownloadPop(true)
  //       return
  //     }
  //     if(error && error.code !== 1) {
  //       Toast.show(error.message)
  //     }
  //   }
  // }

  const login = async () => {
    const provider = (window as any).misesEthereum;
    if(provider) {
      try{
        const accounts = await provider.request({method: 'eth_requestAccounts', params: []})
        if(accounts.length > 0 && accounts[0] !== localStorage.getItem("ethAccount")){
          localStorage.removeItem('token')
          localStorage.removeItem('ethAccount')
          const address = Web3.utils.toChecksumAddress(accounts[0])
          const timestamp = new Date().getTime()
          const nonce = `${timestamp}`
          const sigMsg = `address=${address}&nonce=${nonce}`
          const {sig: personalSignMsg} = await provider.signMessageForAuth(address, nonce)
          const auth = `${sigMsg}&sig=${personalSignMsg}`
          const data = await signin(auth)
          localStorage.setItem('token', data.token)
          localStorage.setItem('ethAccount', accounts[0])
          setShowConnectWalletPopup(false)
        }
      }catch(err) {
        setShowConnectWalletPopup(true)
        console.log(`login error:${err}`)
      }
    } else {
      Toast.show('Please use Mises browser')
    }
  }

  useMount(
    () => {
      const provider = (window as any).misesEthereum;
      if(provider) {
        provider.on("accountsChanged", async (accounts: string[]) => {
            if(accounts.length) {
              login()
            }else {
              localStorage.removeItem('token')
              localStorage.removeItem('ethAccount')
              setShowConnectWalletPopup(true)
            }
          }
        );
        provider.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          console.log(accounts)
          if(accounts.length) {
            login()
          }else {
            localStorage.removeItem('token')
            localStorage.removeItem('ethAccount')
            setShowConnectWalletPopup(true)
          }
        });
      } else {
        Toast.show('Please use Mises browser')
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
        throw new Error("fail to check pair")
      }
    } catch(err){
      console.error(`onInputChange:${err}`)
      setBridgeModeStatus(false)
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
      console.error("input error:", val)
      return false
    }
    swapContext?.setBridgeFromAmount(val)
    runRefresh()
  }

  // event handler: onFromTokenChange
  const onFromTokenChange = async (val : string) => {
    cancelRefresh()
    if(!val) {
      console.error("onFromTokenChange:", "empty val")
      return false
    }
    const tokens = swapContext!.bridgeTokens
    if(!tokens){
      console.error("onFromTokenChange:", "empty bridge tokens")
      return false
    }
    if (swapContext) {
      const token = findBridgeToken(tokens, val)
      if(!token) {
        console.error("onFromTokenChange:", "cannot find bridge token")
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
      console.error("onToTokenChange:", "empty val")
      return false
    }
    const tokens = swapContext!.bridgeTokens
    if(!tokens){
      console.error("onToTokenChange:", "empty bridge tokens")
      return false
    }
    if (swapContext) {
      const token = findBridgeToken(tokens, val)
      if(!token) {
        console.error("onToTokenChange:", "cannot find bridge token")
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

  // return
  return <div className="flex flex-col flex-1">
    <div className='flex justify-between items-center px-10 py-10' style={{height: 40}}>
      <div className="relative flex">
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
        {location.pathname === '/bridge' && <Button
          disabled={disableExchangeButton}
          onClick={() => navigate('/bridge/process')}
          block
          color="primary"
          className='exchange-button'>Exchange Now</Button>}
      </div >
      {location.pathname === '/bridge/process' && <BridgeMode setBridgeModeStatus={setBridgeModeStatus} />}
      {location.pathname === '/bridge/process' && <UserClause bridgeModeStatus={bridgeModeStatus} userClauseChecked={checked} setChecked={setChecked} />}
    </div>
    }

    {!showMainForm && <TransactionDetails/>}
    {/* <BridgeNotification /> */}
    <CenterPopup
      style={{ '--min-width': '90vw' }}
      showCloseButton
      onClose={() => {setShowConnectWalletPopup(false)}}
      visible={showConnectWalletPopup}>
      <div className='bg-white px-15 pb-30'>
        <p className='text-14 leading-6 text-[#333333] py-20 mb-20'>To access your transaction records, please provide your Mises ID.</p>
        <Button block shape='rounded' onClick={login} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", 'padding': '12px 0' }}>
          <span className='text-white block text-18'>Connect Mises ID</span>
        </Button>
      </div>
    </CenterPopup>
    <StatusDialog />
  </div>
}
export default Bridge;
