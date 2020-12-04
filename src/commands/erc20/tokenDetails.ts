import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { readAddressesFromFile, writeJson } from 'util/file'
import { getTokensDetails } from 'util/tokens'
import { getProvider } from '../../util/ethers'

async function run(tokensFilePath: string, outputFilePath: string | undefined) {
  const tokens = readAddressesFromFile(tokensFilePath)
  if (tokens.isError) {
    console.error(tokens.errorMsg)
    return
  }

  const provider = getProvider()
  const tokenDetails = await getTokensDetails(tokens.value, provider)

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
