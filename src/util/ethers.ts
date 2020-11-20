import { ethers, providers } from 'ethers'
import Debug from 'debug'
import assert from 'assert'

const debug = Debug('DEBUG-app:util:ethers')

export function getProvider(): providers.Provider {
  const nodeUrl = process.env.NODE_URL
  debug('Connecting to node: ' + nodeUrl)
  assert(nodeUrl, 'NODE_URL env var is required')

  return new ethers.providers.JsonRpcProvider(nodeUrl)
}
