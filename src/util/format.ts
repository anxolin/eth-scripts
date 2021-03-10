import { BigNumber } from '@ethersproject/bignumber'

export function formatDate(date: Date): string {
  return date.toISOString()
}

export function fromEpochToDate(epoch: BigNumber): Date {
  return new Date(epoch.mul(1000).toNumber())
}

export function formatEpochAsDate(epoch: BigNumber): string {
  return formatDate(fromEpochToDate(epoch))
}
