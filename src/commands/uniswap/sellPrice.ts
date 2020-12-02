import { ChainId, Pair, Route, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getProvider } from 'util/ethers'
import { getPairInfo, printPrice } from './uniswapUtils'

async function run(sellTokenAddress: string, receiveTokenAddress: string, amount?: string) {
  const chainId = ChainId.MAINNET
  const provider = getProvider()
  const { pair, receiveTokenLabel, sellTokenLabel } = await getPairInfo(
    sellTokenAddress,
    receiveTokenAddress,
    chainId,
    provider,
  )
  const pairAddress = Pair.getAddress(pair.token0, pair.token1)

  const route = new Route([pair], pair.token0)

  console.log()
  console.log(chalk`{bold Trade}:`)
  console.log(chalk`\tSell Token: {yellow ${sellTokenLabel}} (${pair.token0.decimals}): {white ${pair.token0.address}}`)
  console.log(
    chalk`\tReceive Token: {yellow ${receiveTokenLabel}} (${pair.token1.decimals}): {white ${pair.token1.address}}`,
  )
  console.log(chalk`\tSell Amount: {yellow ${amount}}`)

  console.log()
  console.log(chalk`{bold Pools}:`)
  console.log(chalk`\tPair Address: {white ${pairAddress}}`)
  console.log(chalk`\t${sellTokenLabel} Reserve: {white ${pair.reserve0.toExact()} ${sellTokenLabel}}`)
  console.log(chalk`\t${receiveTokenLabel} Reserve: {white ${pair.reserve1.toExact()} ${receiveTokenLabel}}`)

  console.log()
  console.log(chalk`{bold Prices}:`)
  printPrice('\tMid Price', route.midPrice, sellTokenLabel, receiveTokenLabel)
  if (amount) {
    const amountInWei = ethers.utils.parseUnits(amount, pair.token0.decimals)
    const trade = new Trade(route, new TokenAmount(pair.token0, amountInWei.toString()), TradeType.EXACT_INPUT)
    printPrice('\tExecution Price', trade.executionPrice, sellTokenLabel, receiveTokenLabel)
    printPrice('\tNext Mid Price', trade.nextMidPrice, sellTokenLabel, receiveTokenLabel)
  }
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('uni-sell-price <sell-token> <receive-token> [amount]')
    .description('Get Uniswap selling price')
    .action(run)
}
