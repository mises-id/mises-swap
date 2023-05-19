import { FC, useContext, useEffect, useMemo, useState } from 'react'
import './index.less'
import { findToken, formatAmount, shortenAddress } from '@/utils';
import BigNumber from 'bignumber.js';
import { DownOutline, EditSOutline } from 'antd-mobile-icons';
import { fetchFeeData } from '@wagmi/core'
import { SwapContext, defaultSlippageValue } from '@/context/swapContext';
import { CenterPopup, Image, TextArea } from 'antd-mobile';
import { ethers } from 'ethers';
import { useAccount, useNetwork } from 'wagmi';
interface Iprops {
  loading: boolean;
  data: swapData | undefined
  status?: 'ready' | undefined
  tokens: token[] | undefined
}

const Quote: FC<Iprops> = (props) => {
  const [tokenType, settokenType] = useState<'from' | 'to'>('from')

  const swapContext = useContext(SwapContext)
  const slippage = swapContext?.slippage || defaultSlippageValue
  const [receivingAddress, setReceivingAddress] = useState<string>()
  const { address } = useAccount()
  const tokenStr = useMemo(() => {
    if (props.data && props.tokens) {
      const data = props.data
      const fromToken = findToken(props.tokens, data.from_token_address)
      const toToken = findToken(props.tokens, data.to_token_address)
      if(fromToken && toToken){
        const fromAmount = formatAmount(data.from_token_amount, fromToken?.decimals)
        const toAmount = formatAmount(data.to_token_amount, toToken?.decimals)
        const showFromToken = tokenType === 'from' ? fromToken : toToken
        const showToToken = tokenType === 'from' ? toToken : fromToken
        const fromTokenSymbol = showFromToken.symbol
        const toTokenSymbol = showToToken.symbol
        const toAmountNumber = BigNumber(fromAmount).dividedBy(toAmount)
        const toTokenCompared = toAmountNumber.comparedTo(0.00001) > -1
        const toAmountStr = tokenType === 'from' ? BigNumber(toAmount).dividedBy(fromAmount).toString().substring(0, fromToken.decimals / 2) : (toTokenCompared ? toAmountNumber.toString().substring(0, 7) : '<0.00001')
  
        return `1 ${fromTokenSymbol} = ${toAmountStr} ${toTokenSymbol}`
      }
    }
    return ''

  }, [tokenType, props.data, props.tokens])

  const toToken = useMemo(() => {
    if(props.data && props.tokens){
      const toToken = findToken(props.tokens, props.data.to_token_address)
      return toToken
    }
    return undefined
    
  }, [props.data, props.tokens])

  const minOutNumber = useMemo(() => {
    if (props.data && slippage && props.tokens) {
      const data = props.data
      const toToken = findToken(props.tokens, data.to_token_address)

      if(!toToken) return

      const toAmount = formatAmount(data.to_token_amount, toToken.decimals)
      const minNumber = BigNumber(toAmount).multipliedBy(1 - Number(slippage) / 100)
      return minNumber.toString().substring(0, toToken.decimals / 2)
    }
    return 0

  }, [props.data, props.tokens, slippage])

  const expectedNumber = useMemo(() => {
    if (props.data && props.tokens) {
      const data = props.data
      const toToken = findToken(props.tokens, data.to_token_address)

      if(!toToken) return

      const toAmount = formatAmount(data.to_token_amount, toToken.decimals)
      return BigNumber(toAmount).toString().substring(0, toToken.decimals / 2)
    }
    return 0
  }, [props.data, props.tokens])

  const [gasPrice, setgasPrice] = useState('0')
  useEffect(() => {
    if(props.data){
      fetchFeeData({
        formatUnits: 'wei',
      }).then(res => {
        if (res.formatted.gasPrice) {
          setgasPrice(res.formatted.gasPrice)
        }
      })
    }
    if(!props.data) setisOpen(false)
  }, [props.data])


  const networkFee = useMemo(() => {
    if (props.data) {
      const data = props.data
      const estimatedGas = data.estimate_gas_fee as unknown as string
      
      if (gasPrice !== '0' && estimatedGas) {
        return BigNumber(estimatedGas).multipliedBy(gasPrice).dividedBy(BigNumber(10).pow(18)).toNumber()
      }
    }
    return 0

  }, [props.data, gasPrice])

  const [isOpen, setisOpen] = useState(false)
  const [editAddress, seteditAddress] = useState(false)

  const showEditAddressDialog = () => {
    seteditAddress(true)
  }

  // const [editSlippage, seteditSlippage] = useState(false)

  const getAddressChange = (value: string) => {
    setReceivingAddress(value)
    seterrorMessage('')
  }

  const [errorMessage, seterrorMessage] = useState('')
  const submitChange = () => {
    if(receivingAddress){
      const isAddress = ethers.utils.isAddress(receivingAddress)
      if(isAddress){
        swapContext?.setReceivingAddress(receivingAddress as address)
        setReceivingAddress('')
      }else {
        seterrorMessage('Address invalid')
        return 
      }
    }
    seteditAddress(false)
  }

  const showDetail = useMemo(() => {
    if(props.status === 'ready'){
      return true
    }
    if(!props.status){
      return isOpen
    }
  }, [props.status, isOpen])

  const {chain} = useNetwork()

  return (
    (props.loading || props.data) ?
      <div className='quote-view'>
        <div className='quote-header-view'>
          {props.loading && !showDetail && <div className='loading'>Fetching best price... </div>}

          {props.data && (!props.loading || showDetail) && <>

            <div className='flex justify-between items-center cursor-pointer' onClick={() => setisOpen(!isOpen)}>
              <span
                className='quote-token-item'
                onClick={e => {
                  e.stopPropagation()
                  settokenType(tokenType === 'from' ? 'to' : 'from');
                }}
              >{tokenStr}</span>

              {props.status !== 'ready' ? <div className='flex items-center'>
                {!isOpen && <>

                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0047 9.26921H10.2714C11.0078 9.26921 11.6047 9.86617 11.6047 10.6025V12.1359C11.6047 12.7987 12.142 13.3359 12.8047 13.3359C13.4675 13.3359 14.0047 12.7995 14.0047 12.1367V5.22059C14.0047 4.86697 13.7758 4.56227 13.5258 4.31223L10.6714 1.33594M4.00472 2.00254H8.00472C8.7411 2.00254 9.33805 2.59949 9.33805 3.33587V14.0015H2.67139V3.33587C2.67139 2.59949 3.26834 2.00254 4.00472 2.00254ZM14.0047 5.33587C14.0047 6.07225 13.4078 6.66921 12.6714 6.66921C11.935 6.66921 11.3381 6.07225 11.3381 5.33587C11.3381 4.59949 11.935 4.00254 12.6714 4.00254C13.4078 4.00254 14.0047 4.59949 14.0047 5.33587Z" stroke="rgb(152, 161, 192)"></path><line x1="4" y1="9.99414" x2="8" y2="9.99414" stroke="rgb(152, 161, 192)"></line><line x1="4" y1="11.9941" x2="8" y2="11.9941" stroke="rgb(152, 161, 192)"></line><path d="M4 8.16113H8" stroke="rgb(152, 161, 192)"></path></svg>
                  <span style={{ color: 'rgb(152, 161, 192)' }} className='ml-5'>$1.12</span>

                </>}

                <DownOutline className={`DownOutline ml-5 ${isOpen ? 'up' : ''}`} />
              </div> : ''}

            </div>

            <div className='details-box' style={{ height: showDetail ? 196 : 0 }}>
              <div className="advanced-swap-details flex flex-col gap-4">
                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Receiving address</span>
                  <div className='swap-detail-value cursor-pointer'  onClick={showEditAddressDialog}>
                    {shortenAddress(swapContext?.receivingAddress || address)}
                    {props.status !== 'ready' ? <EditSOutline className='edit ml-5'/> : ''}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Network fee</span>
                  <span className='swap-detail-value'>{networkFee} {chain?.nativeCurrency.symbol}</span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Mises fee</span>
                  <span className='swap-detail-value'>{props.data.fee}%</span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Minimum output</span>
                  <span className='swap-detail-value'>{minOutNumber} {toToken?.symbol}</span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Expected output</span>
                  <span className='swap-detail-value'>{expectedNumber} {toToken?.symbol}</span>
                </div>

              </div>
              <div className='advanced-swap-details'>
                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Order routing</span>
                  <div className='flex items-center gap-2' onClick={()=>{
                    
                  }}>
                    <Image
                        width={20}
                        height={20}
                        style={{borderRadius: 100}}
                        src={props.data.aggregator.logo}
                    /> 
                    <span className='swap-detail-value'>{props.data.aggregator.name || '123'}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* <div className='flex items-center justify-between'>
              <span className='swap-detail-label'>Slippage</span>
              <div className='swap-detail-value'>
                {slippage} %
                <SetOutline className='ml-5'/>
              </div>
            </div> */}
          </>}
        </div>
        <CenterPopup visible={editAddress} className="dialog-container">
          <div className='p-20'>
            <p className='dialog-title'>Set receiving address</p>
            <div className='textarea-container'>
              <TextArea placeholder={swapContext?.receivingAddress || address} value={receivingAddress} onChange={getAddressChange}/>
            </div>
            {errorMessage && <div className='error-message'>{errorMessage}</div>}
          </div>
          <div className='flex dialog-btns'>
            <span className='flex-1' onClick={()=>seteditAddress(false)}>Cancel</span>
            <span className='flex-1' onClick={submitChange}>Confirm</span>
          </div>
        </CenterPopup>
      </div> : <></>
  )
}

export default Quote