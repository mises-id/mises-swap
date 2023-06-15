import swapRequest from '@/utils/swapRequest'
import { AxiosPromise } from 'axios'
import { getAccount } from '@wagmi/core'
// export function healthcheck<T=any>(chainId: number): AxiosPromise<T>{
//   return swapRequest({
//     url: `/${chainId}/healthcheck`
//   })
// }

// export function spender<T=any>(chainId: number): AxiosPromise<T>{
//   return swapRequest({
//     url: `/${chainId}/approve/spender`
//   })
// }

const header = ()=>{
  const {address} = getAccount()
  return address ? {
    'User-Wallet-Address': address as string
  } : undefined
}

// const getBaseUrl = () =>{
//   return process.env.REACT_APP_NODE_ENV === 'production' ? 'https://swap.mises.site' : 'https://swap.test.mises.site'
// }

export function getTokens<T=any>(): AxiosPromise<T>{
  // return swapRequest({
  //   url: `${getBaseUrl()}/tokens.json`,
  //   timeout: 30000,
  //   headers: header()
  // })
  return swapRequest({
    url: `/token/list`,
    timeout: 30000,
    headers: header()
  })
  // return fetch('https://swap.mises.site/tokens.json').then(res=>{
  //   return res.json()
  // })
}

export function allowance<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/approve/allowance`,
    params,
    headers: header()
  })
}

export function transaction<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/approve/transaction`,
    params,
    headers: header()
  })
}

export function getQuote<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/quote`,
    params,
    headers: header()
  })
}

export function getSwapData<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/swap`,
    params,
    headers: header()
  })
}

export function trade<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/trade`,
    params,
    headers: header()
  })
}

export function getOrderList<T=any,P=any>(from_address: string, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/order/${from_address}`,
    params,
    headers: header()
  })
}