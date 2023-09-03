import { SwapContext } from '@/context/swapContext'
import BigNumber from 'bignumber.js'
import React, { FC, useContext, useMemo } from 'react'
import './index.less'
import { Popover } from 'antd-mobile'

interface IProps {
  tokens: token[] | undefined,
  verifyShow?: boolean
}

const PriceImpact: FC<IProps> = (props)=> {
  const swapContext = useContext(SwapContext)

  const priceImpactValue = useMemo(() => {
    const tokens = props.tokens
    const fromAmount = swapContext?.currentSwitchType === 'from' ? swapContext?.fromAmount : swapContext?.toAmount
    const fromTokenData = swapContext?.currentSwitchType === 'from' ? swapContext?.swapFromData : swapContext?.swapToData
    const fromToken = props.tokens?.find(val=>val.address.toLowerCase() === fromTokenData?.tokenAddress.toLowerCase())

    let fromTokenPrice = 0

    if(fromAmount && fromToken?.price && !BigNumber(fromAmount).isZero()) {
      fromTokenPrice = BigNumber(fromAmount).multipliedBy(fromToken?.price).toNumber();
    }

    const toTokenData = swapContext?.currentSwitchType === 'from' ? swapContext?.swapToData : swapContext?.swapFromData
    const toAmount =  swapContext?.currentSwitchType === 'from' ?  swapContext?.toAmount : swapContext?.fromAmount
    const toToken = tokens?.find(val=>val.address.toLowerCase() === toTokenData?.tokenAddress.toLowerCase())

    let toTokenPrice = 0
    if(toAmount && toToken?.price && !BigNumber(toAmount).isZero()) {
      toTokenPrice = BigNumber(toAmount).multipliedBy(toToken?.price).toNumber();
    }

    if(fromTokenPrice && toTokenPrice) {
      // priceImpactValue: (1 - toTokenPrice / fromTokenPrice) * 100
      const priceImpactValue = BigNumber(1).minus(BigNumber(toTokenPrice).dividedBy(fromTokenPrice)).times(100)
      // if priceImpactValue.abs > 100 
      if(priceImpactValue.abs().comparedTo(100) === 1) return 100
      // if priceImpactValue < 0
      if(priceImpactValue.comparedTo(0) === -1) {
        return priceImpactValue.abs().toNumber()
      }
      // if priceImpactValue < 100 && priceImpactValue > 0
      return priceImpactValue.toNumber()
    }

    return 0
  }, [props.tokens, swapContext?.currentSwitchType, swapContext?.fromAmount, swapContext?.toAmount, swapContext?.swapFromData, swapContext?.swapToData])

  const isShow = useMemo(()=>{
    if((props.verifyShow && priceImpactValue > 15) || !props.verifyShow) return true
  }, [priceImpactValue, props.verifyShow])

  return (
    isShow ? <Popover content={<div className='popover-content'>A swap of this size may have a high price impact, given the current liquidity in the pool. There may be a large difference between the amount of your input token and what you will receive in the output token
      </div>} trigger='click'>
      <div className={`flex items-center justify-between ${props.verifyShow ? 'home-show' : ''}`}>
        <span className='swap-detail-label'>Price Impact</span>
        {priceImpactValue && <span className='swap-detail-value'>-{priceImpactValue.toFixed(2) || ''}%</span>}
      </div>
    </Popover> : <></>
  )
}
export default PriceImpact