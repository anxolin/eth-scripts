/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// import Debug from 'debug'
import chalk from 'chalk'
import { ethers } from 'ethers'
import fs from 'fs'
import { Result } from 'types'

export function readAddressesFromFile(filePath: string): Result<string[]> {
  if (!fs.existsSync(filePath)) {
    return {
      isError: true,
      errorMsg: chalk`{red The file {white ${filePath}} doesn't exist}`,
    }
  }

  const maybeAddresses = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  if (!Array.isArray(maybeAddresses)) {
    return {
      isError: true,
      errorMsg: chalk`{red The file {white ${filePath}} must contain an array of addresses (string)}`,
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

export function writeJson(filePath: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, json)
}
