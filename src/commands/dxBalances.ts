import { CommanderStatic } from 'commander'
import { readAddressesFromFile } from 'util/file'
import { dxAddress, dxTokens } from 'const'
import { Dutchx__factory } from 'contracts/gen/factories/Dutchx__factory'
import { getProvider } from 'util/ethers'
import chalk from 'chalk'
import { BigNumber } from 'ethers'
import { Dutchx } from 'contracts/gen'

interface Balances {
  user: string
  balances: Map<string, BigNumber>
}

async function getBalances(user: string, dxContract: Dutchx): Promise<Balances> {
  const balancePromises = dxTokens.map(async (token) => {
    return {
      token,
      balance: await dxContract.balances(token, user),
    }
  })
  const balances = await Promise.all(balancePromises)

  return {
    user,
    balances: balances.reduce((acc, balanceItem) => {
      const { token, balance } = balanceItem

      // Return all non-zero balances
      if (!balance.isZero) {
        acc.set(token, balance)
      }

      return acc
    }, new Map()),
  }
}

async function run(file: string): Promise<void> {
  const users = readAddressesFromFile(file)
  if (users.isError) {
    console.error(users.errorMsg)
    return
  }

  const provider = getProvider()
  const dxContract = Dutchx__factory.connect(dxAddress, provider)

  const balancePromises = users.value.map((user) => getBalances(user, dxContract))
  const balances = (await Promise.all(balancePromises)).filter(({ balances }) => balances.size > 0)

  balances.forEach(({ user, balances }) => {
    console.log(chalk`User ${user}:`)
    for (const [token, balance] of balances) {
      console.log(`token ${token}, balance = ${balance}`)
    }
  })
  console.log(chalk`TOTAL {white ${balances.length}} users with balance in DutchX`)

  // console.log(chalk`Balance: {green ${ethers.utils.formatEther(balance)} ETH} (${balance} wei)`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-balances <address-list-json-file>')
    .description('Get the DutchX balances from a list of addresses')
    .action(run)
}
