import { SwapContext } from '@/context/swapContext'
import { Button, CenterPopup, CenterPopupProps, Image } from 'antd-mobile'
import React, { FC, useContext, useMemo } from 'react'
import './index.less'
import { useWalletClient } from 'wagmi';
import { useAnalytics } from '@/hooks/useAnalytics';
import { logEvent } from 'firebase/analytics';
import { chainList } from '@/App';
interface Iprops extends CenterPopupProps {
  successClose?: ()=>void;
  dismissClose?: ()=>void;
}
const StatusDialog: FC<Iprops> = (props) => {
  const swapContext = useContext(SwapContext)
  const analytics = useAnalytics()

  const isOpen = useMemo(() => {
    if(!!swapContext?.globalDialogMessage?.type && swapContext?.globalDialogMessage?.type !== 'pending') {
      logEvent(analytics, `swap_${swapContext?.globalDialogMessage?.type}`, {
        error_message: swapContext?.globalDialogMessage?.description || `swap-${swapContext?.globalDialogMessage?.type}-message` 
      })
    }

    return !!swapContext?.globalDialogMessage?.type

    // eslint-disable-next-line
  }, [swapContext?.globalDialogMessage])

  const dismiss = () => {
    if(swapContext?.globalDialogMessage?.description && ['Timeout getting token list,please try again', 'Failed to connect to the wallet, please refresh the page'].includes(swapContext?.globalDialogMessage?.description)) {
      window.location.reload()
      return 
    }
    swapContext?.setGlobalDialogMessage(undefined)
    props.dismissClose?.()
  }
  
  const walletClient = useWalletClient()
  const addToken = () => {
    const {tokenAddress, decimals, symbol } = swapContext?.globalDialogMessage?.info as any

    if(tokenAddress && decimals && symbol) {
      walletClient.data?.watchAsset({
        type: 'ERC20',
        options: {
          address: tokenAddress,
          decimals: decimals,
          symbol: symbol,
        }
      })
    }
  }

  const goToExplorer = () =>{
    const info = swapContext?.globalDialogMessage?.info
    if(info?.blockExplorer && info?.txHash) window.open(`${info?.blockExplorer}/tx/${info?.txHash}`, 'target=_blank')
    dismiss()
  }
  const nativeCurrency = useMemo(() => {
    if(swapContext?.chainId) {
      const chain = chainList.find(chain => chain.id === swapContext!.chainId)
      if(chain) return chain.nativeCurrency
    }
    // eslint-disable-next-line
  }, [swapContext?.chainId])

  if(swapContext?.globalDialogMessage?.description) console.log(swapContext?.globalDialogMessage?.description, '=====submiterror====')
  return (
    <CenterPopup {...props} visible={isOpen} showCloseButton onClose={dismiss} className='dialog-container'>
      {swapContext?.globalDialogMessage?.type === 'error' && <p className='status-dialog-title'>Error</p>}
      <div className='status-dialog-container flex flex-col items-center text-center'>
        {swapContext?.globalDialogMessage?.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#FA2B39" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}

        {swapContext?.globalDialogMessage?.type === 'pending' && <Image src='/images/loading.svg' className='loading-icon' width={90} height={90} />}

        {swapContext?.globalDialogMessage?.type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" width="75px" height="75px" viewBox="0 0 24 24" fill="none" stroke="#4C82FB" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>}

        <div className='description'>{swapContext?.globalDialogMessage?.description}</div>

        {swapContext?.globalDialogMessage?.info?.symbol && nativeCurrency?.symbol !== swapContext?.globalDialogMessage?.info?.symbol &&
          <div className='add-token-to-wallet flex items-center justify-center mt-10 mb-40' 
          onClick={addToken}>
            <span>Add {swapContext?.globalDialogMessage?.info?.symbol}</span>
          </div>}

        {swapContext?.globalDialogMessage?.type === 'error' ? <Button block color="primary" className="dismiss-btn" onClick={dismiss}>Dismiss</Button> : ''}

        {swapContext?.globalDialogMessage?.type === 'success' ? <>
          <Button block color="primary" className="dismiss-btn" onClick={()=>{
            dismiss()
            props.successClose?.()
          }}>Close</Button>
          <p className='text-center view-explorer mt-20 text-sm cursor-pointer' onClick={goToExplorer}>
            View on Block Explorer
          </p>
        </> : ''}
      </div>
    </CenterPopup>
  )
}
export default StatusDialog