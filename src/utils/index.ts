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