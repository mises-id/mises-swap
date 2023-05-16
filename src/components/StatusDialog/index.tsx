import { SwapContext } from '@/context/swapContext'
import { Button, CenterPopup, CenterPopupProps, Image } from 'antd-mobile'
import React, { FC, useContext, useMemo } from 'react'
import './index.less'
interface Iprops extends CenterPopupProps {

}
const StatusDialog: FC<Iprops> = (props) => {
  const swapContext = useContext(SwapContext)
  const isOpen = useMemo(() => {
    return !!swapContext?.globalDialogMessage?.type
  }, [swapContext?.globalDialogMessage])

  const dismiss = () => {
    swapContext?.setGlobalDialogMessage(undefined)
  }
  return (
    <CenterPopup {...props} visible={isOpen} showCloseButton onClose={dismiss} className='dialog-container'>
      {swapContext?.globalDialogMessage?.type === 'error' && <p className='status-dialog-title'>Error</p>}
      <div className='status-dialog-container flex flex-col items-center text-center'>
        {swapContext?.globalDialogMessage?.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#FA2B39" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}

        {swapContext?.globalDialogMessage?.type === 'pending' && <Image src='/images/loading.svg' className='loading-icon' width={90} height={90} />}

        <div className='description'>{swapContext?.globalDialogMessage?.description}</div>

        {swapContext?.globalDialogMessage?.type === 'error' ? <Button block color="primary" className="dismiss-btn" onClick={dismiss}>Dismiss</Button> : ''}
      </div>
    </CenterPopup>
  )
}
export default StatusDialog