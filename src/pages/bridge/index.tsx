import "./index.less";
import { useContext, useEffect} from "react";
import { logEvent } from "firebase/analytics";
import { useAnalytics } from "@/hooks/useAnalytics";
import { SwapContext } from "@/context/swapContext";
import BridgeTokenInput from "@/components/bridgeTokenInput";
import { Button } from "antd-mobile";
import StatusDialog from "@/components/StatusDialog";
import BridgeNotification from "@/components/BridgeNotification";
import { useNavigate } from "react-router-dom";
import { findBridgeToken, retryRequest } from "@/utils";
import { getBridgeTokens, getBridgeTokenPairInfo, getBridgeTokenExchangeAmount } from "@/api/bridge";
import {useRequest} from "ahooks";
import BridgeMode from "@/components/BridgeMode";
import { useLocation } from 'react-router-dom';

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

const Bridge = () => {
  // hooks
  const analytics = useAnalytics()
  const swapContext = useContext(SwapContext)
  const location = useLocation();
  const navigate = useNavigate()

  // init
  useEffect(() => {
    init()
  }, []);

  const init = async () =>{
    logEvent(analytics, 'open_bridge_page')
    const isPageReLoad = sessionStorage.getItem('isPageReLoad')
    if(isPageReLoad) {
      logEvent(analytics, 'swap_bridge_reload')
      sessionStorage.removeItem('isPageReLoad')
      console.log('isPageReLoad analytics')
    }
    getBridgeTokenList()
  }

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
        const res = await getTokensWithRetry<{ "data": token[] }>()
        if (res) {
          tokenList = res.data.data || []
          sessionStorage.setItem('bridgeTokenList', JSON.stringify(tokenList))
        } else {
          tokenList = []
        }
      }
      swapContext!.setBridgeTokens([...tokenList])
    } catch (error: any) {
      swapContext?.setGlobalDialogMessage({
        type: 'error',
        description: "Network Error: Failed to obtain Currencies"
      })
    }
  }

  // Logo
  const Logo = () => {
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
  }

  // switchToken
  const switchToken = () => {
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

  // checkPairInfo
  const getBridgeTokenPairInfoWithRetry = retryRequest(getBridgeTokenPairInfo)
  const checkPairInfo = async (fromVal: string | undefined, toVal: string | undefined): Promise<boolean> => {
    if(!fromVal){
      console.error("checkPairInfo:", "from token error")
      return false
    }
    if(!toVal){
      console.error("checkPairInfo:", "to token error")
      return false
    }

    try{
      const ret = await getBridgeTokenPairInfoWithRetry<{data: getPairInfoResult}, getPairInfoParams>({from: fromVal, to: toVal})
      if(!ret.data.data || Object.keys(ret.data.data).length == 0){
        console.error("getBridgeTokenPairInfoWithRetry:empty data", ret.data.data)
        return false
      }

      const minAmountFloat = parseFloat(ret.data.data.minAmountFloat)
      const maxAmountFloat = parseFloat(ret.data.data.maxAmountFloat)
      const minAmountFixed = parseFloat(ret.data.data.minAmountFixed)
      const maxAmountFixed = parseFloat(ret.data.data.maxAmountFixed)

      if(isNaN(minAmountFloat) || isNaN(maxAmountFloat) || isNaN(minAmountFixed) || isNaN(maxAmountFixed)){
        console.error("getBridgeTokenPairInfoWithRetry:isNaN", ret.data.data)
        return false
      }

      const fromAmount = parseFloat(swapContext!.bridgeFromAmount)
      if(!fromAmount){
        swapContext?.setBridgeFloatAvailable(false)
        swapContext?.setBridgeFixedAvailable(false)
      } else {
        if (fromAmount < minAmountFloat) {
          swapContext?.setBridgeFloatAvailable(false)
          swapContext?.setBridgeFloatNotAvailableMsg(`Cannot be less than ${minAmountFloat}`)
        }
        if (fromAmount > maxAmountFloat) {
          swapContext?.setBridgeFloatAvailable(false)
          swapContext?.setBridgeFloatNotAvailableMsg(`Cannot be more than ${maxAmountFloat}`)
        }
        if (fromAmount < minAmountFixed) {
          swapContext?.setBridgeFixedAvailable(false)
          swapContext?.setBridgeFixedNotAvailableMsg(`Cannot be less than ${minAmountFixed}`)
        }
        if (fromAmount > maxAmountFixed) {
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
        return false
      }
      if(fromAmount > maxAmount){
        swapContext!.setBridgeAmountCheckMsg(`Maximum allowed: ${maxAmount} ${fromVal}`)
        return false
      }
    }catch(err){
      console.error("getBridgeTokenPairInfoWithRetry:api error", err)
      return false
    }
    return true
  }

  // generateOutputAmount
  const getBridgeTokenExchangeAmountRetry = retryRequest(getBridgeTokenExchangeAmount)
  const generateOutputAmount = async (from: string | undefined, to: string | undefined, amountFrom: string | undefined) => {
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

    try{
      const ret = await getBridgeTokenExchangeAmountRetry<{"data": getBridgeTokenExchangeAmountResult}, getBridgeTokenExchangeAmountParams>({from, to, amountFrom})
      if(!ret.data.data && Object.keys(ret.data.data).length == 0){
        throw new Error("result is empty")
      }
      const amountTo = parseFloat(ret.data.data.amountTo)
      const networkFee = parseFloat(ret.data.data.networkFee)
      if(isNaN(amountTo) || isNaN(networkFee)){
        throw new Error("amountTo or networkFee NaN")
      }
      if(amountTo <= networkFee){
        throw new Error("amountTo error")
      }
      swapContext?.setBridgeToAmount(swapContext?.bridgeFloatMode ? `~ ${amountTo - networkFee}` : `${amountTo - networkFee}`)
    } catch (err) {
      console.error("generateOutputAmount:", err)
      return false
    }
    return true
  }

  // refresh
  const refresh = async () => {
    try{
      if (await checkPairInfo(swapContext?.bridgeFromData.symbol, swapContext?.bridgeToData.symbol)){
        generateOutputAmount(swapContext?.bridgeFromData.symbol, swapContext?.bridgeToData.symbol, swapContext?.bridgeFromAmount)
      }
    } catch(err){
      console.error("onInputChange:", err)
      return false
    }
    return true 
  }

  // runRefresh: wrapper of refresh
  const { run: runRefresh, cancel: cancelRefresh, loading: refreshLoading } = useRequest(refresh, {
    debounceWait: 550,
    manual: true,
    pollingInterval: 30000,
    pollingWhenHidden: false,
  });

  // event handler: onInputChange
  const onInputChange = async (val: string) => {
    if(isNaN(Number(val))){
      console.error("input error:", val)
      return false
    }
    swapContext?.setBridgeFromAmount(val)
    runRefresh()
  }

  // event handler: onFromTokenChange
  const onFromTokenChange = async (val : string) => {
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
    <div className='flex justify-between items-center px-10 py-10'  style={{height: 40}}>
      <Logo />
    </div>
    <div className='flex-1 flex flex-col overflow-hidden relative'>
      <div className="swap-container">
        <div className="flex justify-between items-center swap-header">
          <p className="title" onClick={() => navigate('/')}>Swap</p><p className="selected-title">Bridge</p>
        </div>
        <div>
          <BridgeTokenInput
            type="from"
            tokens={swapContext!.bridgeTokens}
            onInputChange={onInputChange}
            onTokenChange={onFromTokenChange}
            placeholder='0'
            //maxLength={swapContext?.swapFromData.decimals}
            pattern='^[0-9]*[.,]?[0-9]*$'
            inputMode='decimal'
            value={swapContext?.bridgeFromAmount} />

          <div className="switch-token flex items-center justify-center cursor-pointer" onClick={switchToken}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
          </div>

          <BridgeTokenInput
            type="to"
            tokens={swapContext!.bridgeTokens}
            value={swapContext?.bridgeToAmount}
            //maxLength={swapContext?.swapToData.decimals}
            placeholder='0'
            onTokenChange={onToTokenChange}
          />
        </div>

        <Button
          onClick={() => navigate('/bridge/process')}
          block
          color="primary"
          className='swap-button'>Exchange Now</Button>
      </div >

      <BridgeNotification />

      {location.pathname === '/bridge/process' && <BridgeMode />}
    </div>
    <StatusDialog />
  </div>
};
export default Bridge;
