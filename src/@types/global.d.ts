interface token {
  [key: string]: {
    "symbol": string,
    "name": string,
    "address": `0x${string}`,
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