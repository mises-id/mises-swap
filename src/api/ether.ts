import { formatAmount, nativeTokenAddress } from '@/utils'
import { fetchBalance, erc20ABI, Chain } from '@wagmi/core'
import { ethers } from 'ethers';
import { formatUSD } from './request';
import { arbitrum, avalanche, bsc, fantom, mainnet, optimism, polygon } from 'viem/chains';
import { getAddressBalances } from 'eth-balance-checker/lib/ethers';

export const SINGLE_CALL_BALANCES_ADDRESS_BY_CHAINID: Record<number, string> = {
  [mainnet.id]:
    '0xb1f8e55c7f64d203c1400b9d8555d050f94adf39',
  [bsc.id]:
    '0x2352c63A83f9Fd126af8676146721Fa00924d7e4',
  [polygon.id]:
    '0x2352c63A83f9Fd126af8676146721Fa00924d7e4',
  [optimism.id]:
    '0xB1c568e9C3E6bdaf755A60c7418C269eb11524FC',
  [arbitrum.id]:
    '0x151E24A486D7258dd7C33Fb67E4bB01919B7B32c',
  [avalanche.id]:
  '0xD023D153a0DFa485130ECFdE2FAA7e612EF94818',
  [fantom.id]:
  '0x07f697424ABe762bB808c109860c04eA488ff92B'
};

export interface BalanceMap {
  [tokenAddress: string]: string;
}

// get token balance
export const getBalance = async (tokenAddress: address, address: address, chain: Chain) => {
  if (tokenAddress === nativeTokenAddress && address) {
    return fetchBalance({ address: address })
  }

  if (address && tokenAddress) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls.default.http[0]);

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals()
      
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

// get has balance from token list
export async function getBalancesInSingleCall(walletAddress: string, tokensToDetect: string[], chain: Chain) {
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls.default.http[0]);
  if (!(chain.id in SINGLE_CALL_BALANCES_ADDRESS_BY_CHAINID) || !tokensToDetect) {
    // Only fetch balance if contract address exists
    return {};
  }
  const contractAddress = SINGLE_CALL_BALANCES_ADDRESS_BY_CHAINID[chain.id]; 
  const data = await getAddressBalances(provider, walletAddress, tokensToDetect, {
    contractAddress
  })

  // const contract = new ethers.Contract(contractAddress, abiSingleCallBalancesContract, provider);
  // const result = await contract.balances([walletAddress], tokensToDetect);
  const nonZeroBalances: BalanceMap = {};
  for (const key in data) {
    const element = data[key];
    if(element !=='0'){
      nonZeroBalances[key] = element;
    }
  }
  return nonZeroBalances
} 

// get fiat from token
// https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD
export async function fetchUSD(fsym: string) {
  const params = {
    fsym: fsym.toLocaleUpperCase(),
    tsyms: 'USD'
  }
  try {
    const data = await formatUSD(params)
    return data.data.USD
  } catch (error) {
    Promise.reject(error)
  }
}
