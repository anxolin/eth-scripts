// import Debug from 'debug'
import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getProvider } from '../../util/ethers'

async function run(address: string): Promise<void> {
  if (!address || !ethers.utils.isAddress(address)) {
    console.error(chalk.red(`${address} is not a valid ethereum address`))
    return
  }

  const provider = getProvider()
  const balance = await provider.getBalance(address)

  console.log(chalk`Balance: {green ${ethers.utils.formatEther(balance)} ETH} (${balance} wei})`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('balance <address>').description('Get the balance of an ethereum account').action(run)
}
