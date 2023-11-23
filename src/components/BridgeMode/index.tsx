import "./index.less"
import { CSSProperties, FC, useContext, useEffect, useState } from 'react'
import { SwapContext } from '@/context/swapContext'
import { Input, InputProps } from 'antd-mobile'

interface Iprops {
}

const BridgeMode: FC<Iprops> = (props) => {
    const swapContext = useContext(SwapContext)

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
                <Input className="bridge-mode-address-input" />
            </div>
        </div> :
        <div className='token-container'>
            <div>
                <div>Recipient wallet address</div>
                <Input className="bridge-mode-address-input" />
            </div>
            <div>
                <div>Refund wallet address</div>
                <Input className="bridge-mode-address-input" />
            </div>
        </div>    
        }    
    </div>
    )
}

export default BridgeMode
