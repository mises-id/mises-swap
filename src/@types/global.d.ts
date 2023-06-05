type address = `0x${string}`
interface token {
  "symbol": string,
  "name": string,
  "address": address,
  "decimals": number,
  'chain_id': number,
  "logo_uri": string,
  'balance'?: string,
  'price'?: string
}

interface quoteParams {
  chain_id: number, 
  amount: string,
  from_token_address: string,
  to_token_address: string,
  slippage?: number,
  from_address?: string,
  dest_receiver?: string,
  aggregator_address?: string
}

interface aggregator{
  logo: string,
  type: string,
  name: string,
  contract_address: string
}
interface trade {
  from: string
  gas_limit: string,
  data: `0x${string}`,
  to: string
  gas_price: bigint,
  value: bigint
}

interface swapData {
  estimate_gas_fee?: string
  aggregator: aggregator,
  from_token_address: string,
  to_token_address: string,
  from_token_amount: string,
  to_token_amount: string
  error: string
  fetch_time: string
  trade?: trade | null
  fee: number
}