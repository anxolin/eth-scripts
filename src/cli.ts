import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

const COMMANDS = [
  'commands/blockNumber',
  'commands/tokenDetails',
  'commands/balance',
  'commands/tcrList',
  'commands/signText',
  'commands/dutchX',
  'commands/uniswap',
]

async function run() {
  const version = process.env.npm_package_version
  assert(version, 'Version is unknown')

  console.log('\n' + chalk.yellow(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')
  program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')
  for (const command of COMMANDS) {
    ;(await import(command)).registerCommand(program)
  }

  program.parse(process.argv)
}
run().catch(console.error)
