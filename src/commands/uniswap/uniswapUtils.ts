import { ChainId, Fetcher, Pair, Price, Token } from '@uniswap/sdk'
import chalk from 'chalk'
import { DEFAULT_PRICE_DECIMALS } from 'const'
import { providers } from 'ethers'
import { TokenDetails } from 'types'
import { getTokensDetails } from 'util/tokens'

interface PairInfo {
  pair: Pair
  // Just for convenience, the Pair we also return the labels
  sellTokenLabel: string
  receiveTokenLabel: string
}

export async function getPairInfo(
  sellTokenAddress: string,
  receiveTokenAddress: string,
  chainId: ChainId,
  provider: providers.BaseProvider,
): Promise<PairInfo> {
  const [sellTokenDetails, receiveTokenDetails] = await getTokensDetails(
    [sellTokenAddress, receiveTokenAddress],
    provider,
  )

  const sellToken = toToken(chainId, sellTokenDetails)
  const receiveToken = toToken(chainId, receiveTokenDetails)
  const pair = await Fetcher.fetchPairData(sellToken, receiveToken, provider)

  return {
    pair,
    sellTokenLabel: sellTokenDetails.label,
    receiveTokenLabel: receiveTokenDetails.label,
  }
}

export function toToken(chainId: ChainId, tokenDetails: TokenDetails): Token {
  return new Token(chainId, tokenDetails.address, tokenDetails.decimals, tokenDetails.symbol, tokenDetails.name)
}

export function printPrice(label: string, price: Price, sellTokenLabel: string, receiveTokenLabel: string): void {
  console.log(
    chalk`${label}: {white ${price.toSignificant(
      DEFAULT_PRICE_DECIMALS,
    )}} {yellow ${sellTokenLabel} per ${receiveTokenLabel}} (${price
      .invert()
      .toSignificant(DEFAULT_PRICE_DECIMALS)} ${receiveTokenLabel} per ${sellTokenLabel})`,
  )
}

export function printTrade(params: {
  label: string
  pair: Pair
  sellTokenLabel: string
  receiveTokenLabel: string
  amount?: string
}): void {
  const { label, pair, sellTokenLabel, receiveTokenLabel, amount } = params
  console.log()
  console.log(chalk`{bold ${label}}:`)
  console.log(chalk`\tSell Token: {yellow ${sellTokenLabel}} (${pair.token0.decimals}): {white ${pair.token0.address}}`)
  console.log(
    chalk`\tReceive Token: {yellow ${receiveTokenLabel}} (${pair.token1.decimals}): {white ${pair.token1.address}}`,
  )
  if (amount) {
    console.log(chalk`\tAmount: {yellow ${amount}}`)
  }
}

export function printPools(params: {
  pair: Pair
  sellTokenLabel: string
  receiveTokenLabel: string
  amount?: string
}): void {
  const { pair, sellTokenLabel, receiveTokenLabel } = params
  const pairAddress = Pair.getAddress(pair.token0, pair.token1)
  console.log()
  console.log(chalk`{bold Pools}:`)
  console.log(chalk`\tPair Address: {white ${pairAddress}}`)
  console.log(chalk`\t${sellTokenLabel} Reserve: {white ${pair.reserve0.toExact()} ${sellTokenLabel}}`)
  console.log(chalk`\t${receiveTokenLabel} Reserve: {white ${pair.reserve1.toExact()} ${receiveTokenLabel}}`)
}
