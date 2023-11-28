import "./index.less"
import { FC, useContext, useState, Dispatch, SetStateAction } from 'react'
import { SwapContext } from '@/context/swapContext'
import { Input, InputProps } from 'antd-mobile'
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

    const handleBridgeModeChange = (floatMode: boolean) => {
        if(swapContext!.bridgeFloatMode !== floatMode){
            if(swapContext!.bridgeFloatMode){
                swapContext?.setBridgeToAmount(swapContext.bridgeFixedOutputAmount)
            } else {
                swapContext?.setBridgeToAmount(swapContext.bridgeFloatOutputAmount)
            }
            swapContext?.setBridgeFloatMode(floatMode)

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
            return async (val: string): Promise<void> => {
                props.setBridgeModeStatus(false)
                if(swapContext?.bridgeToData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeToData.symbol, val)){
                            swapContext?.setBridgeFloatRecipentAddress(val)
                            props.setBridgeModeStatus(true)
                        }
                    } catch(err) {
                        console.error("floatRecipient:", err)
                    }
                }
            }
        } else if(type === "fixRecipient") {
            return async (val: string): Promise<void> => {
                props.setBridgeModeStatus(false)
                setFixRecipientStatus(false)
                if(swapContext?.bridgeToData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeToData.symbol, val)){
                            swapContext?.setBridgeFixedRecipentAddress(val)
                            setFixRecipientStatus(true)
                            if(fixRecipientStatus && fixRefundStatus){
                                props.setBridgeModeStatus(true)
                            }
                        }
                    } catch(err) {
                        console.error("fixRecipient:", err)
                    }
                }
            }
        } else if(type === "fixRefund"){
            return async (val: string): Promise<void> => {
                props.setBridgeModeStatus(false)
                setFixRefundStatus(false)
                if(swapContext?.bridgeFromData.symbol){
                    try{
                        if(await runCheckInputAddress(swapContext.bridgeFromData.symbol, val)){
                            swapContext?.setBridgeFixedRefundAddress(val)
                            setFixRefundStatus(true)
                            if(fixRecipientStatus && fixRefundStatus){
                                props.setBridgeModeStatus(true)
                            }
                        }
                    } catch(err) {
                        console.error("fixRefund:", err)
                    }
                }
            }
        }
    }

    if(!swapContext?.bridgeFloatAvailable && !swapContext?.bridgeFixedAvailable){
        return null
    }
    return (
    <div className='bridge-swap-container auto-z-index margin-0'>
        <div className='token-container'>
            <div onClick={() => handleBridgeModeChange(true)} className={`flex justify-between items-center ${swapContext.bridgeFloatMode ? "border-selected" : ""} ${!swapContext.bridgeFloatAvailable ? "cursor-not-allowed" : "rate-item"}`}>
                <div>Floating rate</div>
                <div>{swapContext.bridgeFloatOutputAmount}</div>
            </div>
            {swapContext.bridgeFloatNotAvailableMsg ? <span>{swapContext.bridgeFloatNotAvailableMsg}</span> : null}
            <div onClick={() => handleBridgeModeChange(false)} className={`flex justify-between items-center ${!swapContext.bridgeFloatMode ? "border-selected" : ""} ${!swapContext.bridgeFixedAvailable ? "cursor-not-allowed" : "rate-item"}`}>
                <div>Fixed rate</div>
                <div>{swapContext.bridgeFixedOutputAmount}</div>
            </div>
            {swapContext.bridgeFixedNotAvailableMsg ? <span>{swapContext.bridgeFixedNotAvailableMsg}</span> : null}
        </div>
        {swapContext.bridgeFloatMode ? <div>
        The floating rate can change at any point due to market conditions, so you might receive more or less crypto than expected.
        </div> : <div>
        With the fixed rate, you will receive the exact amount of crypto you see on this screen.
        </div>}
        {swapContext.bridgeFloatMode ? 
        <div className='token-container'>
            <div>
                <div>Recipient wallet address</div>
                <Input 
                    className="bridge-mode-address-input"
                    onChange={handleAddressChange("floatRecipient")}
                />
            </div>
        </div> :
        <div className='token-container'>
            <div>
                <div>Recipient wallet address</div>
                <Input 
                    className="bridge-mode-address-input" 
                    onChange={handleAddressChange("fixRecipient")}
                />
            </div>
            <div>
                <div>Refund wallet address</div>
                <Input 
                    className="bridge-mode-address-input" 
                    onChange={handleAddressChange("fixRefund")}
                />
            </div>
        </div>    
        }    
    </div>
    )
}

export default BridgeMode
