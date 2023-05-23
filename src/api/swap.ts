import swapRequest from '@/utils/swapRequest'
import { AxiosPromise } from 'axios'

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

export function getTokens<T=any>(chainId: number): AxiosPromise<T>{
  return swapRequest({
    url: `/token/list`,
    params: {
      chain_id: chainId
    }
  })
}

export function allowance<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/approve/allowance`,
    params
  })
}

export function transaction<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/approve/transaction`,
    params
  })
}

export function getQuote<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/quote`,
    params
  })
}

export function getSwapData<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/swap`,
    params
  })
}

export function trade<T=any,P=any>(params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/trade`,
    params
  })
}

export function getOrderList<T=any,P=any>(from_address: string, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/order/${from_address}`,
    params
  })
}