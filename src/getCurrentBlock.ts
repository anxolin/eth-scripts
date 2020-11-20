import Debug from 'debug'
import { getProvider } from './util/ethers'

const info = Debug('INFO-app:currentBlock')

async function run() {
  const provider = getProvider()
  const blockNumber = await provider.getBlockNumber()

  info('Get block number', blockNumber)
}

run().catch(console.error)
