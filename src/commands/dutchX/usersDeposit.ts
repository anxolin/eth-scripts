import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { writeJson } from 'util/file'
import { getDutchX, getEventData } from './utils'

async function run(filePath: string): Promise<void> {
  const dxContract = getDutchX()

  const usersWithDeposit = await getEventData({
    itemsLabel: 'deposits',
    eventFilter: dxContract.filters.NewDeposit(null, null),
    getDataFromEvent: async (event) =>
      // Note, we cannot get the original message sender. For getting users, is best to
      event.getTransactionReceipt().then((receipt) => receipt.from),
  })

  const users = new Set(usersWithDeposit)
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
