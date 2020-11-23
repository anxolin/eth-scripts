import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { Erc20__factory } from 'contracts/gen'
import { DEFAULT_DECIMALS } from 'const'
import { providers } from 'ethers'
import { TokenDetails } from 'types'
import { readAddressesFromFile, writeJson } from 'util/file'
import { getProvider } from '../util/ethers'

async function getTokenDetails(address: string, provider: providers.Provider): Promise<TokenDetails> {
  const token = Erc20__factory.connect(address, provider)

  const [name, symbol, decimals] = await Promise.all([
    token.name().catch(() => undefined),
    token.symbol().catch(() => undefined),
    token.decimals().catch(() => DEFAULT_DECIMALS),
  ])
  const label = symbol || name || address

  return { label, name, symbol, decimals, address }
}

async function run(tokensFilePath: string, outputFilePath: string | undefined) {
  const tokens = readAddressesFromFile(tokensFilePath)
  if (tokens.isError) {
    console.error(tokens.errorMsg)
    return
  }

  const provider = getProvider()
  const tokenDetailPromises = tokens.value.map((token) => getTokenDetails(token, provider))
  const tokenDetails = await Promise.all(tokenDetailPromises)

  tokenDetails.forEach((tokenDetails) => {
    const { address, label, decimals } = tokenDetails
    console.log(chalk`Token {yellow ${label}} (${decimals}): {white ${address}}`)
  })
  console.log(chalk`TOTAL {white ${tokenDetails.length}} tokens`)
  if (outputFilePath) {
    writeJson(outputFilePath, tokenDetails)
    console.log(chalk`Written users in file {white ${outputFilePath}}`)
  }
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('token-details <address-list-json-file> <token-details-json-file>')
    .description('Get the token details for a list of tokens')
    .action(run)
}
