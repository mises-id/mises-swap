import { CSSProperties, FC, useContext, useEffect, useState } from 'react'
import { SwapContext } from '@/context/swapContext'
import "./index.less"

interface Iprops {
}

const BridgeMode: FC<Iprops> = (props) => {
    const swapContext = useContext(SwapContext)
    if(!swapContext?.bridgeFloatAvailable && !swapContext?.bridgeFixedAvailable){
        return null
    }
    return <div className='swap-container auto-z-index'>
        <div className='token-container'>
            <div className={`flex justify-between items-center ${swapContext.bridgeFloatMode && "border-selected"} ${swapContext.bridgeFloatAvailable || "cursor-not-allowed"}`}>
                <div>Floating rate</div>
                <div>333</div>
            </div>
            {swapContext.bridgeFloatNotAvailableMsg ? <span>{swapContext.bridgeFloatNotAvailableMsg}</span> : null}
            <div className={`flex justify-between items-center ${!swapContext.bridgeFloatMode && "border-selected"} ${swapContext.bridgeFixedAvailable || "cursor-not-allowed"}`}>
                <div>Fixed rate</div>
                <div>444</div>
            </div>
            {swapContext.bridgeFixedNotAvailableMsg ? <span>{swapContext.bridgeFixedNotAvailableMsg}</span> : null}
        </div>
        <div className='token-container'>
        The floating rate can change at any point due to market conditions, so you might receive more or less crypto than expected.
        </div>
    </div>
}

export default BridgeMode
