import { formatAmount, nativeTokenAddress } from '@/utils'
import { erc20ABI, Chain } from '@wagmi/core'
import { ethers } from 'ethers';
import { formatUSD, formatUSDList } from './request';
import { arbitrum, avalanche, bsc, fantom, mainnet, optimism, polygon } from 'viem/chains';
import { getAddressBalances } from 'eth-balance-checker/lib/ethers';
import { getWalletClient } from '@wagmi/core'
import BigNumber from 'bignumber.js';

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
  if (tokenAddress.toLowerCase() === nativeTokenAddress.toLowerCase() && address) {
    const walletClient = await getWalletClient({ chainId: chain.id })
    const getWalletBalance = await walletClient?.request({method: 'eth_getBalance', params: [address] as any})
    if(getWalletBalance) {
      return {
        value: new BigNumber(parseInt(getWalletBalance))
      }
    }
  }

  if (address && tokenAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrls.default.http[0]);

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals()
      return {
        value: balance,
        formatted: formatAmount(BigNumber(balance.toString()).toString(), decimals)
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
  const provider = new ethers.JsonRpcProvider(chain.rpcUrls.default.http[0]); 
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
    return Promise.reject(error)
  }
}
const chainList = [{
  "id": "ethereum",
  "chain_identifier": 1,
  "name": "Ethereum",
  "shortname": ""
}, {
  "id": "binance-smart-chain",
  "chain_identifier": 56,
  "name": "BNB Smart Chain",
  "shortname": "BSC"
},{
  "id": "polygon-pos",
  "chain_identifier": 137,
  "name": "Polygon POS",
  "shortname": "MATIC"
},{
  "id": "optimistic-ethereum",
  "chain_identifier": 10,
  "name": "Optimism",
  "shortname": "Optimism"
},{
  "id": "arbitrum-one",
  "chain_identifier": 42161,
  "name": "Arbitrum One",
  "shortname": "Arbitrum"
},{
  "id": "avalanche",
  "chain_identifier": 43114,
  "name": "Avalanche",
  "shortname": "AVAX"
},{
  "id": "fantom",
  "chain_identifier": 250,
  "name": "Fantom",
  "shortname": ""
},{
  "id": "xdai",
  "chain_identifier": 100,
  "name": "Gnosis Chain",
  "shortname": ""
},{
  "id": "klay-token",
  "chain_identifier": 8217,
  "name": "Klaytn",
  "shortname": ""
},{
  "id": "aurora",
  "chain_identifier": 1313161554,
  "name": "Aurora",
  "shortname": "aurora"
},{
  "id": "zksync",
  "chain_identifier": 324,
  "name": "zkSync",
  "shortname": "zks"
},{
  "id": "okex-chain",
  "chain_identifier": 66,
  "name": "OKExChain",
  "shortname": "OKEx"
},{
  "id": "ethereumpow",
  "chain_identifier": 10001,
  "name": "EthereumPoW",
  "shortname": "ethw"
},{
  "id": "conflux",
  "chain_identifier": 1030,
  "name": "Conflux",
  "shortname": "conflux"
}]

export async function fetchUSDList(chainId: number, contract_addresses: string) {
  const findChain = chainList.find(val=>val.chain_identifier === chainId);
  if(findChain) {
    try {
      const data = await formatUSDList({
        chainName: findChain.id,
        contract_addresses
      })
      return data.data
    } catch (error) {
      return Promise.reject(error)
    }
  }
  return Promise.resolve({})
}