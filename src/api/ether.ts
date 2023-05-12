import { nativeTokenAddress } from '@/utils'
import { fetchBalance } from '@wagmi/core'

// 获取余额
export const getBalance = async (tokenAddress: address, address: address) => {
  if(tokenAddress === nativeTokenAddress && address){
    return fetchBalance({ address: address })
  }

  if(address && tokenAddress) {
    return fetchBalance({
      address: address,
      token: tokenAddress,
    })
  }
}