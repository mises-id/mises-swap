import request from "@/utils/okLink";
interface formatUSDParams {
  chainShortName: string // 公链缩写符号，例如：btc、eth，请求/api/v5/explorer/blockchain/summary接口查询OKLink已支持的公链
  /**合约协议类型
  20代币：token_20
  721代币：token_721
  1155代币：token_1155
  10代币：token_10
  默认是token_20 */
  protocolType?: string 
  tokenContractAddress: string

}
export function formatUSD(params: formatUSDParams){
  return request({
    url: '/api/v5/explorer/token/token-list',
    params
  })
}