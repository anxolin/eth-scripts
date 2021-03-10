import { CommanderStatic, Command } from 'commander'
import chalk from 'chalk'
import { dxAddress, dxDeploymentBlock } from 'const'
import { Dutchx__factory } from 'contracts/gen/factories/Dutchx__factory'
import { getProvider } from 'util/ethers'
import { writeJson } from 'util/file'
import { BigNumber } from '@ethersproject/bignumber'
import { formatEpochAsDate } from 'util/format'

const BATCH_SIZE = 500000 // num of blocks

interface AuctionStartScheduledEvent {
  sellToken: string
  buyToken: string
  auctionIndex: BigNumber
  auctionStart: BigNumber
}

export interface Auction {
  sellToken: string
  buyToken: string
  auctionIndex: number
  auctionStart: string
  blockNumber: number
  transactionHash: string
}

async function run(filePath: string, program: Command): Promise<void> {
  const { sell, buy, auctionFrom, auctionTo } = program.opts()
  const provider = getProvider()
  const dxContract = Dutchx__factory.connect(dxAddress, provider)

  console.log(chalk`Find auction with criteria`, { sell, buy, auctionFrom, auctionTo })
  const auctionsFilter = dxContract.filters.AuctionStartScheduled(sell, buy, auctionFrom, auctionTo)
  const blockNumber = await provider.getBlockNumber()

  const auctions: Auction[] = []
  for (let fromBlock = dxDeploymentBlock; fromBlock < blockNumber; fromBlock += BATCH_SIZE) {
    const toBlock = fromBlock + BATCH_SIZE - 1
    console.log(chalk`Query auctions from block {yellow ${fromBlock}} and {yellow ${toBlock}}`)
    const allAuctions = await dxContract.queryFilter(auctionsFilter, fromBlock, toBlock)
    const addressesPromise = allAuctions.map(async (auctionEvent) => {
      // event.getTransactionReceipt().then((receipt) => receipt.from),
      const { transactionHash, blockNumber, args } = auctionEvent
      const { sellToken, buyToken, auctionIndex, auctionStart } = (args as unknown) as AuctionStartScheduledEvent
      auctions.push({
        sellToken,
        buyToken,
        auctionStart: formatEpochAsDate(auctionStart),
        auctionIndex: auctionIndex.toNumber(),
        transactionHash,
        blockNumber,
      })
    })
    const addresses = await Promise.all(addressesPromise)
    // addresses.forEach((user) => users.add(user))
    console.log(chalk`\tFound {white ${addresses.length}} auctions. Total auctions {white ${auctions.length}}\n`)
  }

  console.log(chalk`TOTAL {white ${auctions.length}} auctions`)
  writeJson(filePath, Array.from(auctions))
  console.log(chalk`Written users in file {white ${filePath}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-auctions <json-file-output>')
    .option('-s --sell <address>', 'Filter by sell token')
    .option('-b --buy <address>', 'Filter by buy token')
    // .option('-t --token <address>', 'Filter by token (sell or buy)')
    .option('-f --auction-from <auction-index>', 'Filter by auction index')
    .option('-t --auction-to <auction-index>', 'Filter by auction index')
    .description('Get all the historic auctions from DutchX')
    .action(run)
}
