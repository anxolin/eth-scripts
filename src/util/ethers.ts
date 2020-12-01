import { ethers, providers } from 'ethers'
import Debug from 'debug'
import assert from 'assert'

const debug = Debug('DEBUG-app:util:ethers')

let provider: providers.BaseProvider
export function getProvider(): providers.BaseProvider {
  if (!provider) {
    const nodeUrl = process.env.NODE_URL
    debug('Connecting to node: ' + nodeUrl)
    assert(nodeUrl, 'NODE_URL env var is required')
    provider = new ethers.providers.JsonRpcProvider(nodeUrl)
  }

  return provider
}
