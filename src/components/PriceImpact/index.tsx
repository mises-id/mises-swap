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
    const fromAmount = swapContext?.fromAmount
    const fromTokenData = swapContext?.swapFromData
    const fromToken = props.tokens?.find(val=>val.address === fromTokenData?.tokenAddress)

    let fromTokenPrice = 0

    if(fromAmount && fromToken?.price && !BigNumber(fromAmount).isZero()) {
      fromTokenPrice = BigNumber(fromAmount).multipliedBy(fromToken?.price).toNumber();
    }

    const toTokenData = swapContext?.swapToData
    const toAmount = swapContext?.toAmount
    const toToken = tokens?.find(val=>val.address === toTokenData?.tokenAddress)

    let toTokenPrice = 0
    if(toAmount && toToken?.price && !BigNumber(toAmount).isZero()) {
      toTokenPrice = BigNumber(toAmount).multipliedBy(toToken?.price).toNumber();
    }

    if(fromTokenPrice && toTokenPrice) {
      return BigNumber(1).minus(BigNumber(toTokenPrice).dividedBy(fromTokenPrice)).times(100).toNumber()
    }

    return 0
  }, [props.tokens, swapContext?.fromAmount, swapContext?.toAmount, swapContext?.swapFromData, swapContext?.swapToData])

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