import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

import { registerCommand as registerBlockNumber } from 'commands/blockNumber'
import { registerCommand as registerBalance } from 'commands/balance'

console.log('\n' + chalk.red(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')

const version = process.env.npm_package_version
assert(version, 'Version is unknown')

program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')

// Register commands
registerBlockNumber(program)
registerBalance(program)

program.parse(process.argv)
