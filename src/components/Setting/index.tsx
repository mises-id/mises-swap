import { CenterPopupProps, Input } from 'antd-mobile'
import { FC, useContext, useMemo, useState } from 'react'
import './index.less'
import { SwapContext, defaultSlippageValue } from '@/context/swapContext'
import { DownOutline } from 'antd-mobile-icons'
import BigNumber from 'bignumber.js'

interface Iprops extends CenterPopupProps {

}

const Setting: FC<Iprops> = (props) => {
  const swapContext = useContext(SwapContext)
  const [isOpen, setisOpen] = useState(false)
  const statusText = useMemo(() => {
    if (!swapContext?.slippage) return undefined
    
    if (BigNumber(swapContext?.slippage).comparedTo(0.05) === -1) {
      return 'Slippage below 0.05% may result in a failed transaction'
    }

    if (BigNumber(1).comparedTo(swapContext?.slippage) === -1) {
      return 'Your transaction may be frontrun and result in an unfavorable trade.'
    }
  }, [swapContext?.slippage])

  const slippageChange = (val: string) =>{
    const value = val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(/^\d*(\.?\d{0,2})/g)?.[0] || ""
    swapContext?.setSlippage(value)
  }
  const isActive = useMemo(() => {
    return swapContext?.slippage ? 'Custom' : 'Auto'
  }, [swapContext?.slippage])

  const setSlipage = (type: 'custom' | 'auto') =>{
    if(type === 'custom'){
      swapContext?.setSlippage(Number(defaultSlippageValue).toFixed(2))
    } 
    if(type === 'auto'){
      swapContext?.setSlippage('')
    } 
  }
  return (
    props.visible ? <>
      <div className='setting-mask cursor-pointer' onClick={() => {
        setisOpen(false)
        props.onClose?.()
      }}></div>
      <div className='setting'>
        <div className='setting-item text-lg'>
          <div className='flex justify-between cursor-pointer' onClick={() => setisOpen(!isOpen)}>
            <span className='item-label'>Max Slippage</span>

            <div>
              <span className='item-value'>{swapContext?.slippage ? `${Number(swapContext?.slippage).toFixed(2)} %` : 'Auto'}</span>
              <DownOutline className={`DownOutline ml-5 ${isOpen ? 'up' : ''}`} />
            </div>
          </div>

          {
            isOpen && <div className='mt-20'>
              <div className='flex items-center gap-4'>
                <div className='flex-1 left-status flex text-center'>
                  <span className={`flex-1 status-item ${isActive === 'Auto' ? 'active' : ''}`} onClick={()=>setSlipage('auto')}>Auto</span>
                  <span className={`flex-1 status-item ${isActive === 'Custom' ? 'active' : ''}`} onClick={()=>setSlipage('custom')}>Custom</span>
                </div>
                <div className='flex-1 flex right-slippage-input items-center'>
                  <Input
                    placeholder={Number(defaultSlippageValue).toFixed(2)}
                    value={swapContext?.slippage}
                    onChange={slippageChange}
                    className={`slippageValue ${swapContext?.slippage && Number(swapContext?.slippage) > 50 ? 'error' : ''}`} />
                  %
                </div>
              </div>
              {statusText && <p className='status-text'>{statusText}</p>}
            </div>
          }

        </div>
      </div>
    </> : <></>
  )
}

export default Setting