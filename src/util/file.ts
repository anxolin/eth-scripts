// import Debug from 'debug'
import chalk from 'chalk'
import { ethers } from 'ethers'
import fs from 'fs'
import { Result } from 'types'

export function readAddressesFromFile(file: string): Result<string[]> {
  if (!fs.existsSync(file)) {
    return {
      isError: true,
      errorMsg: chalk`{red The file {white ${file}} doesn't exist}`,
    }
  }

  const maybeAddresses = JSON.parse(fs.readFileSync(file, 'utf8'))

  if (!Array.isArray(maybeAddresses)) {
    return {
      isError: true,
      errorMsg: chalk`{red The file {white ${file}} must contain an array of addresses (string)}`,
    }
  }

  const errors: string[] = []
  const addresses = maybeAddresses as string[]
  const allValidAddresses = addresses.every((address) => {
    const isValidAddress = ethers.utils.isAddress(address)
    if (!isValidAddress) {
      errors.push(chalk`{red The address {white ${address}} is not a valid ethereum address}`)
    }

    return isValidAddress
  })

  if (!allValidAddresses) {
    return {
      isError: true,
      errorMsg: errors.join('\n'),
    }
  }

  return {
    isError: false,
    value: addresses,
  }
}
