import { EventFilter, Event } from '@ethersproject/contracts'
import chalk from 'chalk'
import { Dutchx } from 'contracts/gen'
import { dxAddress, dxDeploymentBlock } from 'const'
import { Dutchx__factory } from 'contracts/gen/factories/Dutchx__factory'
import { getProvider } from 'util/ethers'

const BATCH_SIZE = 100000 // num of blocks

let dutchX: Dutchx | undefined

export async function getEventData<T>(params: {
  blockNumber?: number
  eventFilter: EventFilter
  getDataFromEvent: (e: Event) => Promise<T>
  batchSize?: number
  itemsLabel?: string
}): Promise<T[]> {
  const { blockNumber, eventFilter, getDataFromEvent, batchSize = BATCH_SIZE, itemsLabel = 'items' } = params
  const dxContract = getDutchX()

  const lastBlock = blockNumber ? blockNumber : await getProvider().getBlockNumber()

  const allItems: T[] = []
  for (let fromBlock = dxDeploymentBlock; fromBlock < lastBlock; fromBlock += batchSize) {
    const toBlock = fromBlock + batchSize - 1
    console.log(chalk`Query ${itemsLabel} from block {yellow ${fromBlock}} and {yellow ${toBlock}}`)
    const events = await dxContract.queryFilter(eventFilter, fromBlock, toBlock)
    const itemsPromise = events.map(getDataFromEvent)
    const items = await Promise.all(itemsPromise)
    items.forEach((item) => allItems.push(item))
    console.log(chalk`\tFound {white ${items.length}} deposits. Total ${itemsLabel} {white ${allItems.length}}\n`)
  }

  return allItems
}

export function getDutchX(): Dutchx {
  if (!dutchX) {
    dutchX = Dutchx__factory.connect(dxAddress, getProvider())
  }
  return dutchX
}
