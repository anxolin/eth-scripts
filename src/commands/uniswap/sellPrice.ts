import { ChainId, Pair, Route, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getProvider } from 'util/ethers'
import { getPairInfo, printPools, printPrice, printTrade } from './uniswapUtils'

async function run(sellTokenAddress: string, receiveTokenAddress: string, amount?: string) {
  const chainId = ChainId.MAINNET
  const provider = getProvider()
  const { pair, receiveTokenLabel, sellTokenLabel } = await getPairInfo(
    sellTokenAddress,
    receiveTokenAddress,
    chainId,
    provider,
  )

  const route = new Route([pair], pair.token0)
  printTrade({
    label: 'Sell Trade',
    pair,
    amount,
    sellTokenLabel,
    receiveTokenLabel,
  })

  printPools({
    pair,
    sellTokenLabel,
    receiveTokenLabel,
  })

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
