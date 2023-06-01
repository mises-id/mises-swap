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