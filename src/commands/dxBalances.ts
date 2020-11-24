import { CommanderStatic } from 'commander'
import { readAddressesFromFile, writeJson } from 'util/file'
import { dxAddress } from 'const'
import { Dutchx__factory } from 'contracts/gen/factories/Dutchx__factory'
import { getProvider } from 'util/ethers'
import chalk from 'chalk'
import { Dutchx } from 'contracts/gen'
import { withRetry } from 'util/misc'
import tokenDetailsJson from '../../data/dx-token-details.json'
import { TokenDetails } from 'types'
import { ethers } from 'ethers'
import { CsvHeaders, writeCsvFile } from 'util/csv'

interface TokenDetailsBalance extends TokenDetails {
  user: string
  balance: string
  balanceAtoms: string
}

async function getUserBalances(
  user: string,
  dxContract: Dutchx,
  tokens: TokenDetails[],
): Promise<TokenDetailsBalance[]> {
  const balancePromises = tokens.map(async (token: TokenDetails) => {
    return {
      token,
      balanceAtoms: await dxContract.balances(token.address, user),
    }
  })
  const balances = await Promise.all(balancePromises)

  return balances.reduce<TokenDetailsBalance[]>((acc, balanceItem) => {
    const { token, balanceAtoms } = balanceItem

    // Return all non-zero balances
    if (!balanceAtoms.isZero()) {
      acc.push({
        ...token,
        user,
        balance: ethers.utils.formatUnits(balanceAtoms, token.decimals),
        balanceAtoms: balanceAtoms.toString(),
      })
    }
    return acc
  }, [])
}

async function run(usersFilePath: string, outputFilePath: string): Promise<void> {
  const users = readAddressesFromFile(usersFilePath)
  if (users.isError) {
    console.error(users.errorMsg)
    return
  }

  const provider = getProvider()
  const dxContract = Dutchx__factory.connect(dxAddress, provider)

  let balances: TokenDetailsBalance[] = []
  for (const user of users.value) {
    await withRetry(async () => {
      console.log(chalk`Get balances for user {yellow ${user}}`)
      const balancesUser = await getUserBalances(user, dxContract, tokenDetailsJson)
      balances = balances.concat(balancesUser)
      console.log(
        chalk`\t User has {white ${balancesUser.length}} tokens with balance. Total {white ${balances.length}}`,
      )
    })
  }

  balances.forEach((balanceItem) => {
    const { label, balance, user } = balanceItem
    console.log(chalk``)
    console.log(chalk`{yellow ${user}}: {white ${balance} ${label}}`)
  })
  console.log(chalk`TOTAL {white ${balances.length}} token balances in DutchX`)

  // if (outputFilePath) {
  //   writeJson(outputFilePath, balances)
  //   console.log(chalk`Written users in file {white ${outputFilePath}}`)
  // }

  const headers: CsvHeaders = [
    { id: 'user', title: 'user' },
    { id: 'balance', title: 'balance' },
    { id: 'label', title: 'label' },
    { id: 'name', title: 'Token Name' },
    { id: 'balanceAtoms', title: 'Balance Atoms' },
    { id: 'decimals', title: 'Token Decimals' },
    { id: 'address', title: 'Token Address' },
    { id: 'symbol', title: 'Token Symbol' },
  ]
  writeCsvFile(outputFilePath, balances, headers)
  console.log(chalk`Written users in file {white ${outputFilePath}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-balances <address-list-json-file> <output-csv-file>')
    .description('Get the DutchX balances from a list of addresses')
    .action(run)
}
