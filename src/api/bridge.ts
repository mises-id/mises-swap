import bridgeRequest from '@/utils/bridgeRequest'
import { AxiosPromise } from 'axios'
import { getToken } from '@/utils'

const header = () => {
    return {
      Authorization: `Bearer ${getToken('token')}`
    }
}

export function getBridgeTokens<T=any>(): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_currencies`,
      method: 'post',
      headers: header()
    })
}

export function getBridgeTokenPairInfo<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_pairs_params`,
      method: 'post',
      data,
      headers: header()
    })
}

export function getBridgeTokenExchangeAmount<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_exchange_amount`,
      method: 'post',
      data,
      headers: header()
    })
}

export function createBridgeTransaction<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/create_transaction`,
      method: 'post',
      data,
      headers: header()
    })
}

export function getBridgeTransactionInfo<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_transaction_info`,
      method: 'post',
      data,
      headers: header()
    })
}

export function getBridgeTransactionStatus<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_transaction_status`,
      method: 'post',
      data,
      headers: header()
    })
}

export function validateBridgeAddress<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/validate_address`,
      method: 'post',
      data,
      headers: header()
    })
}

export function getBridgeFixRateForAmount<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/get_fix_rate_for_amount`,
      method: 'post',
      data,
      headers: header()
    })
}

export function createFixBridgeTransaction<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/create_fix_transaction`,
      method: 'post',
      data,
      headers: header()
    })
}

export function getHistoryList<T=any,P=any>(data : P): AxiosPromise<T>{
    return bridgeRequest({
      url: `/history_list`,
      method: 'post',
      data,
      headers: header()
    })
}
