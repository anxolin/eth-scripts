import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

import { registerCommand as blockNumberCommand } from 'commands/blockNumber'
import { registerCommand as tokenDetailsCommand } from 'commands/tokenDetails'
import { registerCommand as balanceCommand } from 'commands/balance'
import { registerCommand as tcrListCommand } from 'commands/tcrList'
import { registerCommand as dxUserDepositsCommand } from 'commands/dxUsersDeposit'
import { registerCommand as dxBalancesCommand } from 'commands/dxBalances'
import { registerCommand as uniswapRegister } from 'commands/uniswap'

console.log('\n' + chalk.yellow(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')

const version = process.env.npm_package_version
assert(version, 'Version is unknown')

program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')

// Register commands
blockNumberCommand(program)
tokenDetailsCommand(program)
balanceCommand(program)
tcrListCommand(program)
dxUserDepositsCommand(program)
dxBalancesCommand(program)
uniswapRegister(program)

program.parse(process.argv)
