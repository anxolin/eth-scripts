import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

import { registerCommand as blockNumber } from 'commands/blockNumber'
import { registerCommand as tokenDetails } from 'commands/tokenDetails'
import { registerCommand as balance } from 'commands/balance'
import { registerCommand as tcrList } from 'commands/tcrList'
import { registerCommand as dxUserDeposits } from 'commands/dxUsersDeposit'
import { registerCommand as dxBalances } from 'commands/dxBalances'
import { registerCommand as uniswap } from 'commands/uniswap'
import { registerCommand as signText } from 'commands/signText'

console.log('\n' + chalk.yellow(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')

const version = process.env.npm_package_version
assert(version, 'Version is unknown')

program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')

// Register commands
blockNumber(program)
tokenDetails(program)
balance(program)
tcrList(program)
dxUserDeposits(program)
dxBalances(program)
uniswap(program)
signText(program)

program.parse(process.argv)
