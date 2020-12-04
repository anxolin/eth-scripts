import { ChainId, Route, TokenAmount, Trade, TradeType } from '@uniswap/sdk'
import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getProvider } from 'util/ethers'
import { getPairInfo, printPools, printPrice, printTrade } from './_uniswapUtils'

async function run(fromAddress: string, toAddress: string, amount?: string) {
  const chainId = ChainId.MAINNET
  const provider = getProvider()
  const { pair, toLabel, fromLabel } = await getPairInfo(fromAddress, toAddress, chainId, provider)

  const route = new Route([pair], pair.token0)
  printTrade({ isSale: false, pair, amount, fromLabel: fromLabel, toLabel: toLabel })
  printPools({ pair, fromLabel, toLabel })

  console.log()
  console.log(chalk`{bold Prices}:`)
  printPrice('\tMid Price', route.midPrice, fromLabel, toLabel)
  if (amount) {
    const amountInWei = ethers.utils.parseUnits(amount, pair.token1.decimals)
    const trade = new Trade(route, new TokenAmount(pair.token1, amountInWei.toString()), TradeType.EXACT_OUTPUT)
    printPrice('\tExecution Price', trade.executionPrice, fromLabel, toLabel)
    printPrice('\tNext Mid Price', trade.nextMidPrice, fromLabel, toLabel)
  }
}

export function registerCommand(program: CommanderStatic): void {
  program.command('uni-buy-price <from-token> <to-token> [amount]').description('Get Uniswap selling price').action(run)
}
