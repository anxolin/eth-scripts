import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { getProvider } from 'util/ethers'
import { getTokensDetails } from 'util/tokens'

async function run(amount: string, sellTokenAddress: string, receiveTokenAddress: string) {
  const provider = getProvider()
  const [sellToken, receiveToken] = await getTokensDetails([sellTokenAddress, receiveTokenAddress], provider)

  console.log(chalk`Sell Token: {yellow ${sellToken.label}} (${sellToken.decimals}): {white ${sellToken.address}}`)
  console.log(
    chalk`Receive Token: {yellow ${receiveToken.label}} (${receiveToken.decimals}): {white ${receiveToken.address}}`,
  )

  console.log(chalk`Sell Amount: {yellow ${amount}}`)
  console.log(chalk`\nPrice: {white ${amount}} {yellow ${receiveToken.label} ${sellToken.label}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('uni-sell-price <amount> <sell-token> <receive-token>')
    .description('Get Uniswap selling price')
    .action(run)
}
