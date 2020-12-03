import { ethers, providers, Signer } from 'ethers'
import Debug from 'debug'
import assert from 'assert'

const debug = Debug('DEBUG-app:util:ethers')

let provider: providers.BaseProvider
let signer: Signer

export function getProvider(): providers.BaseProvider {
  if (!provider) {
    const nodeUrl = process.env.NODE_URL
    debug('Connecting to node: ' + nodeUrl)
    assert(nodeUrl, 'NODE_URL env var is required')
    provider = new ethers.providers.JsonRpcProvider(nodeUrl)
  }

  return provider
}

export function getSigner(): Signer {
  if (!signer) {
    if (!process.env.PK) {
      throw new Error('Private Key is required. Define a "PK" environment var')
    }
    signer = new ethers.Wallet('0x' + process.env.PK, getProvider())
  }

  return signer
}
