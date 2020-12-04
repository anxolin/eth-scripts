import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { getProvider } from '../../util/ethers'

async function run() {
  const provider = getProvider()
  const blockNumber = await provider.getBlockNumber()

  console.log(chalk`Current block number: {green ${blockNumber}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('block-number').description('Returns the current block number').action(run)
}
