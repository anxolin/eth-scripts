import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { getDutchX, getEventData } from './utils'
import { getProvider } from 'util/ethers'
import { writeJson } from 'util/file'
import { Event } from '@ethersproject/contracts'

async function run(filePath: string): Promise<void> {
  const provider = getProvider()
  const dxContract = getDutchX()
  const blockNumber = await provider.getBlockNumber()

  const getDataFromEvent = async (event: Event) => event.args?.user as string

  // Get all users who payed any fee. This includes *buyOrders, sellOrders, and listing
  //  It's possible that a buyOrder user wouldn't be return here, since if you close the auction you don't need to pay fee
  const usersWithFee = await getEventData({
    itemsLabel: 'fee',
    blockNumber,
    eventFilter: dxContract.filters.Fee(null, null, null, null, null),
    getDataFromEvent,
  })

  // Get all buyOrders, because is
  const usersBuyOrder = await getEventData({
    itemsLabel: 'buyOrder',
    blockNumber,
    eventFilter: dxContract.filters.NewBuyOrder(null, null, null, null, null),
    getDataFromEvent,
  })

  const uniqueUsers = new Set(usersWithFee.concat(usersBuyOrder))

  console.log(chalk`TOTAL {white ${uniqueUsers.size}} users deposited tokens`)
  writeJson(filePath, Array.from(uniqueUsers))
  console.log(chalk`Written users in file {white ${filePath}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('dx-users <json-file-output>').description('Get all the users from DutchX').action(run)
}
