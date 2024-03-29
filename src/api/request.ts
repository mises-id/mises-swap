import request from "@/utils/commonRequest";

export function formatUSD(params: {
  fsym: string,
  tsyms: string
}){
  return request({
    url: 'https://min-api.cryptocompare.com/data/price',
    params,
    headers: {
      authorization: `Apikey f8cbb0e1c33e4a1dd08057ddfb1624185fe548f478eb2554856fe3e506a58858`
    }
  })
}

export function formatUSDList(params: {
  chainName: string,
  contract_addresses: string
}){
  return request({
    url: `https://api.coingecko.com/api/v3/simple/token_price/${params.chainName}`,
    params: {
      contract_addresses: params.contract_addresses,
      vs_currencies: 'usd',
      include_last_updated_at: true
    },
  })
}

const getBaseUrl = () =>{
  return process.env.REACT_APP_NODE_ENV === 'production' ? 'https://api.alb.mises.site' : 'https://api.test.mises.site'
}

export async function signin(auth: string): Promise<{
  token: string,
  is_created: boolean
}> {
  const { data } = await request({
    url: `${getBaseUrl()}/api/v1/signin`,
    method: 'POST',
    data: {
      user_authz: { auth }
    }
  })
  return data.data
}