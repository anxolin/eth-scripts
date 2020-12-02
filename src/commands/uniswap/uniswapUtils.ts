import { ChainId, Price, Token } from '@uniswap/sdk'
import chalk from 'chalk'
import { DEFAULT_PRICE_DECIMALS } from 'const'
import { TokenDetails } from 'types'

export function toToken(chainId: ChainId, tokenDetails: TokenDetails): Token {
  return new Token(chainId, tokenDetails.address, tokenDetails.decimals, tokenDetails.symbol, tokenDetails.name)
}

export function printPrice(label: string, price: Price, sellToken: TokenDetails, receiveToken: TokenDetails): void {
  console.log(
    chalk`${label}: {white ${price.toSignificant(DEFAULT_PRICE_DECIMALS)}} {yellow ${sellToken.label} per ${
      receiveToken.label
    }} (${price.invert().toSignificant(DEFAULT_PRICE_DECIMALS)} ${receiveToken.label} per ${sellToken.label})`,
  )
}
