import { FC, useContext, useEffect, useMemo, useState } from 'react'
import './index.less'
import { formatAmount, shortenAddress, substringAmount } from '@/utils';
import BigNumber from 'bignumber.js';
import { DownOutline, EditSOutline } from 'antd-mobile-icons';
import { SwapContext, defaultSlippageValue } from '@/context/swapContext';
import { CenterPopup, Image, TextArea } from 'antd-mobile';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { chainList } from '@/App';
import FallBackImage from '../Fallback';
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
      const fromToken = swapContext?.swapFromData
      const toToken = swapContext?.swapToData
      if(fromToken && toToken){
        const from_token_amount = fromToken.tokenAddress === data.from_token_address ? data.from_token_amount : data.to_token_amount
        const to_token_amount = fromToken.tokenAddress === data.from_token_address ? data.to_token_amount : data.from_token_amount
        
        const fromAmount = formatAmount(from_token_amount, fromToken?.decimals)
        const toAmount = formatAmount(to_token_amount, toToken?.decimals)
        const showFromToken = tokenType === 'from' ? fromToken : toToken
        const showToToken = tokenType === 'from' ? toToken : fromToken
        const fromTokenSymbol = showFromToken.symbol
        const toTokenSymbol = showToToken.symbol
        const toAmountNumber = BigNumber(fromAmount).dividedBy(toAmount)
        const toTokenCompared = toAmountNumber.comparedTo(0.00001) > -1
        const toAmountStr = tokenType === 'from' ? substringAmount(BigNumber(toAmount).dividedBy(fromAmount).toString()) : (toTokenCompared ? substringAmount(toAmountNumber.toString()) : '<0.00001')
  
        return `1 ${fromTokenSymbol} = ${toAmountStr} ${toTokenSymbol}`
      }
    }
    return ''

  }, [props.data, props.tokens, swapContext?.swapFromData, swapContext?.swapToData, tokenType])

  const toToken = useMemo(() => {
    if(props.data && props.tokens){
      const toToken = swapContext?.swapToData
      return toToken
    }
    return undefined
    
  }, [props.data, props.tokens, swapContext?.swapToData])

  const minOutNumber = useMemo(() => {
    if (props.data && slippage && props.tokens) {
      const data = props.data
      const toToken = swapContext?.swapToData
      if(!toToken) return

      const from_token_amount = toToken.tokenAddress === data.to_token_address ? data.to_token_amount : data.from_token_amount
      const toAmount = formatAmount(from_token_amount, toToken?.decimals)
      const slippageValue =  Number(slippage) <= 50 ? slippage : defaultSlippageValue
      const minNumber = BigNumber(toAmount).multipliedBy(1 - Number(slippageValue) / 100)
      return substringAmount(minNumber.toString())
    }
    return 0

  }, [props.data, props.tokens, slippage, swapContext?.swapToData])

  const expectedNumber = useMemo(() => {
    if (props.data && props.tokens) {
      const data = props.data
      const toToken = swapContext?.swapToData
      if(!toToken) return

      const from_token_amount = toToken.tokenAddress === data.to_token_address ? data.to_token_amount : data.from_token_amount
      const toAmount = formatAmount(from_token_amount, toToken?.decimals)
      return substringAmount(BigNumber(toAmount).toString())
    }
    return 0
  }, [props.data, props.tokens, swapContext?.swapToData])

  const [gasPrice, setgasPrice] = useState('0')


  const nativeCurrency = useMemo(() => {
    if(swapContext?.chainId) {
      const chain = chainList.find(chain => chain.id === swapContext!.chainId)
      if(chain) return chain.nativeCurrency
    }
    // eslint-disable-next-line
  }, [swapContext?.chainId])

  const walletClient = useWalletClient()
  
  useEffect(() => {
    if(props.data){
      walletClient.data?.request({method: 'eth_gasPrice'}).then(res=>{
        const gasPriceNumber = parseInt(res)
        setgasPrice(gasPriceNumber.toString())
      })
    }
    if(!props.data) setisOpen(false)
    // eslint-disable-next-line 
  }, [props.data])

  const networkFee = useMemo(() => {
    if (props.data) {
      const data = props.data
      const estimatedGas = data.estimate_gas_fee as unknown as string
      
      if (gasPrice !== '0' && estimatedGas) {
        const findNativeToken = props.tokens?.find(val=>val.symbol === nativeCurrency?.symbol)
        if(findNativeToken?.price) {
          const nativeTokenAmount = BigNumber(estimatedGas).multipliedBy(gasPrice).dividedBy(BigNumber(10).pow(18)).toNumber()
          return BigNumber(nativeTokenAmount).multipliedBy(findNativeToken?.price).toFixed(2)
        }
        // const token = nativeCurrency.
        return '0'
      }
    }
    return 0
  // eslint-disable-next-line
  }, [props.data, gasPrice, nativeCurrency])

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

  // const {chain} = useNetwork()

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
                  <span style={{ color: 'rgb(152, 161, 192)' }} className='ml-5'>${networkFee}</span>

                </>}

                <DownOutline className={`DownOutline ml-5 ${isOpen ? 'up' : ''}`} />
              </div> : ''}

            </div>

            <div className='details-box' style={{ height: showDetail ? ((swapContext?.receivingAddress || address) ? 196 : 170) : 0 }}>
              <div className="advanced-swap-details flex flex-col gap-4">
                {(swapContext?.receivingAddress || address) &&<div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Receiving address</span>
                  <div className='swap-detail-value cursor-pointer'  onClick={showEditAddressDialog}>
                    {shortenAddress(swapContext?.receivingAddress || address)}
                    {props.status !== 'ready' ? <EditSOutline className='edit ml-5'/> : ''}
                  </div>
                </div>}
                <div className='flex items-center justify-between'>
                  <span className='swap-detail-label'>Network fee</span>
                  <span className='swap-detail-value'>~${networkFee}</span>
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
                  <span className='swap-detail-label'>Best routing</span>
                  <div className='flex items-center gap-2' onClick={()=>{
                    
                  }}>
                    <Image
                        width={20}
                        height={20}
                        style={{borderRadius: 100}}
                        fallback={props.data.aggregator.name ? <FallBackImage width={20} height={20} symbol={props.data.aggregator.name} /> : ''}
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