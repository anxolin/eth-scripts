import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

import { registerCommand as regBlockNumber } from 'commands/blockNumber'
import { registerCommand as regBalance } from 'commands/balance'
import { registerCommand as regDxBalances } from 'commands/dxBalances'

console.log('\n' + chalk.yellow(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')

const version = process.env.npm_package_version
assert(version, 'Version is unknown')

program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')

// Register commands
regBlockNumber(program)
regBalance(program)
regDxBalances(program)

program.parse(process.argv)
