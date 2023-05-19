import { formatAmount, nativeTokenAddress } from '@/utils'
import { fetchBalance, erc20ABI, Chain } from '@wagmi/core'
import { ethers } from 'ethers';

// 获取余额
export const getBalance = async (tokenAddress: address, address: address, chain: Chain) => {
  if (tokenAddress === nativeTokenAddress && address) {
    return fetchBalance({ address: address })
  }

  if (address && tokenAddress) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls.default.http[0]);

      // 代币合约实例
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals()
      // console.log(balance.toString(), decimals);
      
      return {
        value: balance,
        formatted: formatAmount(balance.toString(), decimals)
      }
    } catch (error) {
      return Promise.reject(error);
    }
    
    // return fetchBalance({
    //   address: address,
    //   token: tokenAddress,
    //   chainId: chainId
    // })
  }
}