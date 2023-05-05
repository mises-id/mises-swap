import swapRequest from '@/utils/swapRequest'
import { AxiosPromise } from 'axios'

export function healthcheck<T=any>(chainId: number): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/healthcheck`
  })
}

export function spender<T=any>(chainId: number): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/approve/spender`
  })
}

export function getTokens<T=any>(chainId: number): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/tokens`
  })
}

export function allowance<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/approve/allowance`,
    params
  })
}

export function transaction<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/approve/transaction`,
    params
  })
}

export function getQuote<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/quote`,
    params
  })
}

export function getSwapData<T=any,P=any>(chainId: number, params: P): AxiosPromise<T>{
  return swapRequest({
    url: `/${chainId}/swap`,
    params
  })
}