type address = `0x${string}`
interface token {
  // swap
  "symbol": string,
  "name": string,
  "address": address,
  "decimals": number,
  'chain_id': number,
  "logo_uri": string,
  'balance'?: string,
  'price'?: string,
  'cacheTime'?: number,
  'isImport'?: boolean,

  // bridge
  "bridgeEnabled"?: boolean,
  "bridgeFixRateEnabled"?: boolean,
  "bridgeEnabledFrom"?: boolean,
  "bridgeEnabledTo"?: boolean,
  "bridgePayinConfirmations"?: number,
  "bridgeExtraIdName"?: string,
  "bridgeFixedTime"?: number,
  "bridgeProtocol"?: string,
  "bridgeBlockchain"?: string,
  "bridgeNotifications"?: BridgeNotifications
}

interface BridgeNotifications {
	payin: string
	payout: string
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
  gas_price: string,
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
  fee: number,
  to_token_format_amount?: string
  compare_percent?: string
}