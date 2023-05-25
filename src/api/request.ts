import request from "@/utils/commonRequest";

export function formatUSD(params: {
  fsym: string,
  tsyms: string
}){
  return request({
    url: 'https://min-api.cryptocompare.com/data/price',
    params
  })
}