import "./index.less"
import { FC, useContext, useState, Dispatch, useEffect, SetStateAction } from 'react'
import { SwapContext } from '@/context/swapContext'
import { Input } from 'antd-mobile'
import { useRequest } from "ahooks"
import { retryRequest } from "@/utils"
import { validateBridgeAddress } from "@/api/bridge"

interface ValidateBridgeAddressResult {
    result: boolean,
    message: string
}

interface ValidateBridgeAddressParams {
    currency: string,
    address: string
}

interface Iprops {
    setBridgeModeStatus: Dispatch<SetStateAction<boolean>>
}

const BridgeMode: FC<Iprops> = (props) => {
    const swapContext = useContext(SwapContext)
    const [fixRecipientStatus, setFixRecipientStatus] = useState(false)
    const [fixRefundStatus, setFixRefundStatus] = useState(false)
    const [floatRecipientStatus, setFloatRecipientStatus] = useState(false)

    const [fixRecipientValidating, setFixRecipientValidating] = useState(false)
    const [fixRefundValidating, setFixRefundValidating] = useState(false)
    const [floatRecipientValidating, setFloatRecipientValidating] = useState(false)

    const [floatRecipientValue, setFloatRecipientValue] = useState("")
    const [fixRecipientValue, setFixRecipientValue] = useState("")
    const [fixRefundValue, setFixRefundValue] = useState("")

    const handleTokenChange = () => {
        if(!swapContext?.bridgeFloatMode){
            handleAddressChange("fixRecipient")?.(fixRecipientValue)
            handleAddressChange("fixRefund")?.(fixRefundValue)
        } else {
            handleAddressChange("floatRecipient")?.(floatRecipientValue)
        }
    }

    useEffect(
        handleTokenChange,
        // eslint-disable-next-line
        [swapContext?.bridgeFromData, swapContext?.bridgeToData]
    );

    const handleBridgeModeChange = (floatMode: boolean) => {
        if(swapContext!.bridgeFloatMode !== floatMode){
            if(swapContext!.bridgeFloatMode && swapContext?.bridgeFixedAvailable){
                swapContext?.setBridgeToAmount(swapContext.bridgeFixedOutputAmount)
                swapContext?.setBridgeFloatMode(floatMode)
                swapContext?.setBridgeAmountCheckMsg("")
                handleAddressChange("fixRecipient")?.(fixRecipientValue)
                handleAddressChange("fixRefund")?.(fixRefundValue)
            } else if(!swapContext!.bridgeFloatMode && swapContext?.bridgeFloatAvailable) {
                swapContext?.setBridgeToAmount(swapContext.bridgeFloatOutputAmount)
                swapContext?.setBridgeFloatMode(floatMode)
                swapContext?.setBridgeAmountCheckMsg("")
                handleAddressChange("floatRecipient")?.(floatRecipientValue)
            }
        }
    }

    const validateBridgeAddressWithRetry = retryRequest(validateBridgeAddress)

    const checkInputAddress = async (currency: string, address: string) => {
        const ret = await validateBridgeAddressWithRetry<{data:ValidateBridgeAddressResult}, ValidateBridgeAddressParams>({currency, address})
        if(!ret.data.data && Object.keys(ret.data.data).length === 0){
            throw new Error("empty data")
        }
        if(ret.data.data.result){
            return true
        }else{
            if(ret.data.data.message){
                throw new Error(ret.data.data.message)
            }
            return false   
        }
    }

    const {runAsync: runCheckInputAddress} = useRequest(
        checkInputAddress,
        {
            manual: true,
            debounceWait: 1000,
        }
    )

    const handleAddressChange = (type: string) => {
        if(type === "floatRecipient"){
            return async (val: string | undefined): Promise<void> => {
                if(val === undefined){
                    return
                }
                props.setBridgeModeStatus(false)
                setFloatRecipientValue(val)
                if(val === ""){
                    setFloatRecipientStatus(false)
                    return
                }
                setFloatRecipientValidating(true)
                if(swapContext?.bridgeToData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeToData.symbol, val)){
                            swapContext?.setBridgeFloatRecipentAddress(val)
                            props.setBridgeModeStatus(true)
                            setFloatRecipientStatus(true)
                            setFloatRecipientValidating(false)
                            return
                        }
                    } catch(err) {
                        console.error(`floatRecipient:${err}`)
                    }
                }
                setFloatRecipientStatus(false)
                setFloatRecipientValidating(false)
            }
        } else if(type === "fixRecipient") {
            return async (val: string | undefined): Promise<void> => {
                if(val === undefined){
                    return
                }
                props.setBridgeModeStatus(false)
                setFixRecipientValue(val)
                if(val === ""){
                    setFixRecipientStatus(false)
                    return
                }
                setFixRecipientValidating(true)
                if(swapContext?.bridgeToData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeToData.symbol, val)){
                            swapContext?.setBridgeFixedRecipentAddress(val)
                            setFixRecipientStatus(true)
                            if(fixRefundStatus){
                                props.setBridgeModeStatus(true)
                            }
                            setFixRecipientValidating(false)
                            return
                        }
                    } catch(err) {
                        console.error(`fixRecipient:${err}`)
                    }
                }
                setFixRecipientStatus(false)
                setFixRecipientValidating(false)
            }
        } else if(type === "fixRefund"){
            return async (val: string | undefined): Promise<void> => {
                if(val === undefined){
                    return
                }
                props.setBridgeModeStatus(false)
                setFixRefundValue(val)
                if(val === ""){
                    setFixRefundStatus(false)
                    return
                }
                setFixRefundValidating(true)
                if(swapContext?.bridgeFromData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeFromData.symbol, val)){
                            swapContext?.setBridgeFixedRefundAddress(val)
                            setFixRefundStatus(true)
                            if(fixRecipientStatus){
                                props.setBridgeModeStatus(true)
                            }
                            setFixRefundValidating(false)
                            return
                        }
                    } catch(err) {
                        console.error(`fixRefund:${err}`)
                    }
                }
                setFixRefundStatus(false)
                setFixRefundValidating(false)
            }
        }
    }

    if(!swapContext?.bridgeFloatAvailable && !swapContext?.bridgeFixedAvailable){
        return null
    }
    return (
    <div className='bridge-swap-container auto-z-index margin-0'>
        <div>
            <div onClick={() => handleBridgeModeChange(true)} className={`token-container flex justify-between items-center margin-10 ${swapContext.bridgeFloatMode ? "border-selected" : ""} ${!swapContext.bridgeFloatAvailable ? "cursor-not-allowed" : "rate-item"}`}>
                <div>Floating rate</div>
                <div>{swapContext.bridgeFloatOutputAmount}</div>
            </div>
            {swapContext.bridgeFloatMode && swapContext.bridgeFloatNotAvailableMsg ? <span className="bridgeAmountCheckMsg">{swapContext.bridgeFloatNotAvailableMsg}</span> : null}
            <div onClick={() => handleBridgeModeChange(false)} className={`token-container flex justify-between items-center ${!swapContext.bridgeFloatMode ? "border-selected" : ""} ${!swapContext.bridgeFixedAvailable ? "cursor-not-allowed" : "rate-item"}`}>
                <div>Fixed rate</div>
                <div>{swapContext.bridgeFixedOutputAmount}</div>
            </div>
            {!swapContext.bridgeFloatMode && swapContext.bridgeFixedNotAvailableMsg ? <span className="bridgeAmountCheckMsg">{swapContext.bridgeFixedNotAvailableMsg}</span> : null}
        </div>
        {swapContext.bridgeFloatMode ? <div className="bridge-mode-tip">
        ✔&nbsp;The floating rate can change at any point due to market conditions, so you might receive more or less crypto than expected.
        </div> : <div className="bridge-mode-tip">
        ✔&nbsp;With the fixed rate, you will receive the exact amount of crypto you see on this screen.
        </div>}
        {swapContext.bridgeFloatMode && 
        <div className='token-container padding-10'>
            <div>
                <div className="bridge-mode-title">Recipient Wallet Address</div>
                <Input 
                    className="bridge-mode-address-input"
                    onChange={handleAddressChange("floatRecipient")}
                    defaultValue={floatRecipientValue}
                />
                {swapContext.bridgeFloatMode && !floatRecipientStatus && floatRecipientValue !== "" && !floatRecipientValidating ? <span className="bridgeAmountCheckMsg">invalid address</span> : null}
            </div>
            { swapContext.bridgeToData.bridgeExtraIdName && 
            <div className="margin-top-10">
                <div className="bridge-mode-title">{swapContext.bridgeToData.bridgeExtraIdName} (if needed)</div>
                <Input 
                    className="bridge-mode-address-input"
                    onChange={(val) => swapContext.setBridgeFloatRecipentExtraId(val)}
                />
            </div>
            }
        </div> 
        }
        {!swapContext.bridgeFloatMode && 
        <>
        <div className='token-container margin-10 padding-10'>
            <div className="margin-10">
                <div className="bridge-mode-title">Recipient Wallet Address</div>
                <Input 
                    className="bridge-mode-address-input" 
                    onChange={handleAddressChange("fixRecipient")}
                    defaultValue={fixRecipientValue}
                />
                {!swapContext.bridgeFloatMode && !fixRecipientStatus && fixRecipientValue !== "" && !fixRecipientValidating ? <span className="bridgeAmountCheckMsg">invalid address</span> : null}
            </div>
            { swapContext.bridgeToData.bridgeExtraIdName && 
            <div className="margin-top-10">
                <div className="bridge-mode-title">{swapContext.bridgeToData.bridgeExtraIdName} (if needed)</div>
                <Input 
                    className="bridge-mode-address-input"
                    onChange={(val) => swapContext.setBridgeFixedRecipentExtraId(val)}
                />
            </div>
            }
        </div>
        <div className='token-container padding-10'>
            <div>
                <div className="bridge-mode-title">Refund Wallet Address</div>
                <Input 
                    className="bridge-mode-address-input" 
                    onChange={handleAddressChange("fixRefund")}
                    defaultValue={fixRefundValue}
                />
                {!swapContext.bridgeFloatMode && !fixRefundStatus && fixRefundValue !== "" && !fixRefundValidating ? <span className="bridgeAmountCheckMsg">invalid address</span> : null}
            </div>
            { swapContext.bridgeFromData.bridgeExtraIdName && 
            <div className="margin-top-10">
                <div className="bridge-mode-title">{swapContext.bridgeFromData.bridgeExtraIdName} (if needed)</div>
                <Input 
                    className="bridge-mode-address-input"
                    onChange={(val) => swapContext.setBridgeFixedRefundExtraId(val)}
                />
            </div>
            }
        </div> 
        </>
        }    
    </div>
    )
}

export default BridgeMode
