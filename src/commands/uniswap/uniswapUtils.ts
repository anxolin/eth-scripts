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
