import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { TokenListsTcr__factory } from 'contracts/gen'
import { getProvider } from '../util/ethers'

async function run(tcrAddress: string, listId: string | undefined) {
  const provider = getProvider()

  const tcr = TokenListsTcr__factory.connect(tcrAddress, provider)
  const tokens = await tcr.getTokens(listId || 0)

  tokens.forEach((token) => {
    console.log(chalk`- {yellow ${token}}`)
  })
  console.log(chalk`TOTAL {white ${tokens.length}} tokens`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('tcr <tcr-address> <list-id>').description('Get tokens from a TCR').action(run)
}
