import { readContract } from '@wagmi/core';


export async function getUSDTPrice() {
  const aggregatorV3InterfaceABI = [
    {
      inputs: [],
      name: 'decimals',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'description',
      outputs: [{ internalType: 'string', name: '', type: 'string' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint80', name: '_roundId', type: 'uint80' }],
      name: 'getRoundData',
      outputs: [
        { internalType: 'uint80', name: 'roundId', type: 'uint80' },
        { internalType: 'int256', name: 'answer', type: 'int256' },
        { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
        { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
        { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'latestRoundData',
      outputs: [
        { internalType: 'uint80', name: 'roundId', type: 'uint80' },
        { internalType: 'int256', name: 'answer', type: 'int256' },
        { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
        { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
        { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'version',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }
  ];
  const usdtToUsdAddress = '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D'
  const roundData: any = await readContract({
    address: usdtToUsdAddress,
    abi: aggregatorV3InterfaceABI,
    functionName: 'latestRoundData'
  })

  const decimals: any = await readContract({
    address: usdtToUsdAddress,
    abi: aggregatorV3InterfaceABI,
    functionName: 'decimals'
  })
  
  return roundData.answer.toNumber() / Math.pow(10, decimals)

//   // We create an instance of the contract which we can interact with
//   const priceFeed = new ethers.Contract(address, aggregatorV3InterfaceABI, window.ethereum as any);
//   // We get the data from the last round of the contract 
//   let roundData = await priceFeed.latestRoundData();
//   // Determine how many decimals the price feed has (10**decimals)
//   let decimals = await priceFeed.decimals();
//   // We convert the price to a number and return it
//   return Number((roundData.answer.toString() / Math.pow(10, decimals)).toFixed(2));
}