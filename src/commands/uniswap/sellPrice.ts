import { ChainId, Fetcher, Pair, Price, Route, Token, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { TokenDetails } from 'types'
import { getProvider } from 'util/ethers'
import { getTokensDetails } from 'util/tokens'

const DEFAULT_PRICE_DECIMALS = 8

function toToken(chainId: ChainId, tokenDetails: TokenDetails): Token {
  return new Token(chainId, tokenDetails.address, tokenDetails.decimals, tokenDetails.symbol, tokenDetails.name)
}

function printPrice(label: string, price: Price, sellToken: TokenDetails, receiveToken: TokenDetails) {
  console.log(
    chalk`${label}: {white ${price.toSignificant(DEFAULT_PRICE_DECIMALS)}} {yellow ${sellToken.label} per ${
      receiveToken.label
    }} (${price.invert().toSignificant(DEFAULT_PRICE_DECIMALS)} ${receiveToken.label} per ${sellToken.label})`,
  )
}

async function run(sellTokenAddress: string, receiveTokenAddress: string, amount?: string) {
  const chainId = ChainId.MAINNET
  const provider = getProvider()
  const [sellTokenDetails, receiveTokenDetails] = await getTokensDetails(
    [sellTokenAddress, receiveTokenAddress],
    provider,
  )

  const sellToken = toToken(chainId, sellTokenDetails)
  const receiveToken = toToken(chainId, receiveTokenDetails)
  const pairAddress = Pair.getAddress(sellToken, receiveToken)
  const pair = await Fetcher.fetchPairData(sellToken, receiveToken, provider)

  const route = new Route([pair], sellToken)

  console.log()
  console.log(chalk`{bold Trade}:`)
  console.log(
    chalk`\tSell Token: {yellow ${sellTokenDetails.label}} (${sellTokenDetails.decimals}): {white ${sellTokenDetails.address}}`,
  )
  console.log(
    chalk`\tReceive Token: {yellow ${receiveTokenDetails.label}} (${receiveTokenDetails.decimals}): {white ${receiveTokenDetails.address}}`,
  )
  console.log(chalk`\tSell Amount: {yellow ${amount}}`)

  console.log()
  console.log(chalk`{bold Pools}:`)
  console.log(chalk`\tPair Address: {white ${pairAddress}}`)
  console.log(chalk`\t${sellTokenDetails.label} Reserve: {white ${pair.reserve0.toExact()} ${sellTokenDetails.label}}`)
  console.log(
    chalk`\t${receiveTokenDetails.label} Reserve: {white ${pair.reserve1.toExact()} ${receiveTokenDetails.label}}`,
  )

  console.log()
  console.log(chalk`{bold Prices}:`)
  printPrice('\tMid Price', route.midPrice, sellTokenDetails, receiveTokenDetails)
  if (amount) {
    const amountInWei = ethers.utils.parseUnits(amount, sellToken.decimals)
    const trade = new Trade(route, new TokenAmount(sellToken, amountInWei.toString()), TradeType.EXACT_INPUT)
    printPrice('\tExecution Price', trade.executionPrice, sellTokenDetails, receiveTokenDetails)
    printPrice('\tNext Mid Price', trade.nextMidPrice, sellTokenDetails, receiveTokenDetails)
  }
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('uni-sell-price <sell-token> <receive-token> [amount]')
    .description('Get Uniswap selling price')
    .action(run)
}
