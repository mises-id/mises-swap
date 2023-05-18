import BigNumber from "bignumber.js"
import { BigNumberish, ethers } from "ethers"

export function nowSec(): number {
  return Math.floor(Date.now() / 1000)
}

export function parseAmount(value: string, unitName?: BigNumberish): string {
  return ethers.utils.parseUnits(value, unitName).toString()
}

export function formatAmount(value: string, unitName?: BigNumberish): string {
  return ethers.utils.formatUnits(value, unitName).toString()
}
export const nativeTokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const TRUNCATED_ADDRESS_START_CHARS = 5;
export const TRUNCATED_NAME_CHAR_LIMIT = 11;
export const TRUNCATED_ADDRESS_END_CHARS = 4;

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
  return tokens.find(token => token.address === address) || undefined;
}

export function networkFee(gasPrice: string, estimatedGas: string): string {
  return BigNumber(estimatedGas).multipliedBy(gasPrice).dividedBy(BigNumber(10).pow(18)).toString()
}