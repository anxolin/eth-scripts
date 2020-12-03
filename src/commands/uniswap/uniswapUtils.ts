import { ChainId, Fetcher, Pair, Price, Token } from '@uniswap/sdk'
import chalk from 'chalk'
import { DEFAULT_PRICE_DECIMALS } from 'const'
import { providers } from 'ethers'
import { TokenDetails } from 'types'
import { getTokensDetails } from 'util/tokens'

interface PairInfo {
  pair: Pair
  // Just for convenience, the Pair we also return the labels
  fromLabel: string
  toLabel: string
}

export async function getPairInfo(
  fromAddress: string,
  toAddress: string,
  chainId: ChainId,
  provider: providers.BaseProvider,
): Promise<PairInfo> {
  const [fromDetails, toDetails] = await getTokensDetails([fromAddress, toAddress], provider)

  const sellToken = toToken(chainId, fromDetails)
  const receiveToken = toToken(chainId, toDetails)
  const pair = await Fetcher.fetchPairData(sellToken, receiveToken, provider)

  return {
    pair,
    fromLabel: fromDetails.label,
    toLabel: toDetails.label,
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
  isSale: boolean
  pair: Pair
  fromLabel: string
  toLabel: string
  amount?: string
}): void {
  const { isSale, pair, fromLabel, toLabel, amount } = params
  console.log()
  console.log(chalk`{bold ${isSale ? 'Sell Trade' : 'Buy Trade'}}:`)
  console.log(chalk`\tFrom: {yellow ${fromLabel}} (${pair.token0.decimals}): {white ${pair.token0.address}}`)
  console.log(chalk`\tTo: {yellow ${toLabel}} (${pair.token1.decimals}): {white ${pair.token1.address}}`)
  if (amount) {
    console.log(chalk`\t${isSale ? 'Sell ' : 'Receive'} Amount: {white ${amount} ${isSale ? fromLabel : toLabel}}`)
  }
}

export function printPools(params: { pair: Pair; fromLabel: string; toLabel: string; amount?: string }): void {
  const { pair, fromLabel: sellTokenLabel, toLabel: receiveTokenLabel } = params
  const pairAddress = Pair.getAddress(pair.token0, pair.token1)
  console.log()
  console.log(chalk`{bold Pools}:`)
  console.log(chalk`\tPair Address: {white ${pairAddress}}`)
  console.log(chalk`\t${sellTokenLabel} Reserve: {white ${pair.reserve0.toExact()} ${sellTokenLabel}}`)
  console.log(chalk`\t${receiveTokenLabel} Reserve: {white ${pair.reserve1.toExact()} ${receiveTokenLabel}}`)
}
