import BigNumber from "bignumber.js"
import { BigNumberish, ethers } from "ethers"

export function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

export function parseAmount(value: string, unitName?: BigNumberish): string {
  return ethers.parseUnits(value, unitName).toString()
}
export function toNonExponential(num: number) {
  const m: any = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
  return num.toFixed(Math.max(0, (m[1] || '').length - m[2]));
}
export function formatAmount(value: string, unitName?: BigNumberish): string {
  const formatAmount = ethers.formatUnits(value || 0, Number(unitName))
  return formatAmount
}
export const nativeTokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const TRUNCATED_ADDRESS_START_CHARS = 5;
export const TRUNCATED_NAME_CHAR_LIMIT = 11;
export const TRUNCATED_ADDRESS_END_CHARS = 4;

export function isETH(address: string): boolean { 
  return address.toLowerCase() === nativeTokenAddress
}

export function shortenAddress(
  address = '',
  prefix = TRUNCATED_ADDRESS_START_CHARS,
) {
  if (address.length < TRUNCATED_NAME_CHAR_LIMIT) {
    return address;
  }

  return `${address.slice(0, prefix)}...${address.slice(
    -TRUNCATED_ADDRESS_END_CHARS,
  )}`;
}

export function findToken(tokens: token[], address: string): token | undefined {
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase()) || undefined;
}

export function networkFee(gasPrice: string, estimatedGas: string): string {
  return BigNumber(estimatedGas).multipliedBy(gasPrice).dividedBy(BigNumber(10).pow(18)).toString()
}

export function isAndroid(): boolean {
  return (
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent)
  );
}

export function isSmallIOS(): boolean {
  return (
    typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent)
  );
}

export function isLargeIOS(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    (/iPad/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  );
}

export function isIOS(): boolean {
  return isSmallIOS() || isLargeIOS();
}

export function isMobile(): boolean {
  return isAndroid() || isIOS();
}


export function isMisesBrowser(): boolean {
  return window.misesWallet
}

export function substringAmount(amount: string | undefined, maxLen: number = 8): string | undefined{
  if(!amount) {
    return amount
  }


  const subAmount = amount.split('.');

  if(subAmount[1]?.length > maxLen) {
    const returnAmount = `${subAmount[0]}.${subAmount[1].substring(0, maxLen)}`
    return returnAmount === '0.00000000' ? '0.00000...' : returnAmount
  }

  return amount
}

export function formatErrorMessage(error: any, message: string) {
  const errorMessage: {
    type: "error",
    description: string
  } = {
    type: 'error',
    description: error.shortMessage || message || 'Unknown error'
  }
  const userRejectedNotAlert = undefined // 用户取消不提醒
  if(error.name === 'TransactionExecutionError') {
    if(error.details === `[ethjs-query] while formatting outputs from RPC '{"value":{"code":-32603,"data":{"code":-32000,"message":"transaction underpriced"}}}'`) {
      // low gas fee failed
      errorMessage.description = 'Transaction underpriced, Please try again'
    }
    if(error.details?.indexOf(`User denied transaction signature.`) > -1 || error.details?.indexOf(`The user rejected the request.`) > -1) {
      // User denied
      errorMessage.description = error.shortMessage
      return userRejectedNotAlert
    }
    if(error.shortMessage?.indexOf(`User rejected the request.`) > -1) {
      // User denied
      errorMessage.description = error.shortMessage
      return userRejectedNotAlert
    }
    if(error.details?.indexOf(`User rejected the provision of an Identity`) > -1) {
      // User denied
      errorMessage.description = 'User rejected the request.'
      return userRejectedNotAlert
    }
    // if(error.details?.indexOf('Fetching fee data failed') > -1) {
    //   errorMessage.description = 'Fetching fee data failed.'
    // }
  }
  return errorMessage
}

export function isRequest(provider: any) {
  return !window.befi && !window.nabox && provider.name !== "ezdefi" && !isIOS() && !window.phantom
}

// retryRequest
type Service<TData, TParams extends any[]> = (...args: TParams) => Promise<TData>;
interface Options {
  retryCount?: number;
  retryInterval?: number;
}
export const retryRequest = <TData, TParams extends any[]>(
  service: Service<TData,TParams>,
  options?: Options
) => {
  const defaultRetryCount = 3
  const defaultRetryInterval = -1
  const retryCount = options?.retryCount || defaultRetryCount
  const fn = async (...args: TParams) => { 
    let output: [any, TData | null] = [null, null];
    const maxSleep = 1000 * 30 //30s
    for (let a = 0; a < retryCount; a++) {
      output = await requestWrap(service(...args))

      if (output[1]) {
        break;
      }
      let retryInterval = options?.retryInterval || defaultRetryInterval
      if (retryInterval < 0) {
        retryInterval = 500 * 2 ** (a + 1)
        if (retryInterval > maxSleep) retryInterval = maxSleep
      }
      console.log(`retry ${a + 1} times, error: ${output[0]}, sleep time: ${retryInterval}`);
      await sleep(retryInterval);
    }

    if (output[0]) {
      throw output[0];
    }

    return output[1] as TData;
  }
  return fn
};

const sleep = (time: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const requestWrap = async <TData, U = any>(
  promise: Promise<TData>
): Promise<[U | null, TData | null]> => {
  try {
    const data = await promise;
    return [null, data];
  } catch (err: any) {
    return [err, null];
  }
}
