type address = `0x${string}`
interface token {
  [key: string]: {
    "symbol": string,
    "name": string,
    "address": address,
    "decimals": number,
    "logoURI": string
  }
}

interface quoteParams {
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  protocols?: string,
  fee?: number,
  gasLimit?: string,
  connectorTokens?: string,
  complexityLevel?: string,
  mainRouteParts?: string,
  parts?: string,
  gasPrice?: string
  destReceiver?: string
}
interface quoteData {
  "fromToken": token[number],
  "toToken": token[number],
  "toTokenAmount": string,
  "fromTokenAmount": string,
  "protocols": [
    {
      "name": string,
      "part": number,
      "fromTokenAddress": string,
      "toTokenAddress": string
    }
  ],
  "estimatedGas": number
}