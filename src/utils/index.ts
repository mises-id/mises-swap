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