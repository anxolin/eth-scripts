import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { dxAddress, dxDeploymentBlock } from 'const'
import { Dutchx__factory } from 'contracts/gen/factories/Dutchx__factory'
import { Event } from 'ethers'
import { getProvider } from 'util/ethers'
import { writeJson } from 'util/file'

const BATCH_SIZE = 100000 // num of blocks

async function run(filePath: string): Promise<void> {
  const provider = getProvider()
  const dxContract = Dutchx__factory.connect(dxAddress, provider)
  const allDepositFilter = dxContract.filters.NewDeposit(null, null)
  const blockNumber = await provider.getBlockNumber()
  const users: Set<string> = new Set()
  for (let fromBlock = dxDeploymentBlock; fromBlock < blockNumber; fromBlock += BATCH_SIZE) {
    const toBlock = fromBlock + BATCH_SIZE - 1
    console.log(chalk`Query deposits from block {yellow ${fromBlock}} and {yellow ${blockNumber}}`)
    const allDeposits = await dxContract.queryFilter(allDepositFilter, fromBlock, toBlock)
    const addressesPromise = allDeposits.map(async (event) =>
      event.getTransactionReceipt().then((receipt) => receipt.from),
    )
    const addresses = await Promise.all(addressesPromise)
    addresses.forEach((user) => users.add(user))
    console.log(chalk`\tFound {white ${addresses.length}} deposits. Total users {white ${users.size}}\n`)
  }

  console.log(chalk`TOTAL {white ${users.size}} users deposited tokens`)
  writeJson(filePath, Array.from(users))
  console.log(chalk`Written users in file {white ${filePath}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-users-deposit <json-file-output>')
    .description('Get all the users from DutchX that have made a deposit')
    .action(run)
}
