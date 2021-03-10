import chalk from 'chalk'
import figlet from 'figlet'
import program from 'commander'
import assert from 'assert'

const COMMANDS = [
  // // Basic, read operation
  // 'commands/basic-read/blockNumber',
  // 'commands/basic-read/balance',

  // // ERC20
  // 'commands/erc20/tcrList',
  // 'commands/erc20/tokenDetails',

  // Signing
  // 'commands/sign/signText',
  // 'commands/sign/verifyText',

  // Gnosis Protocol v2
  // 'commands/gnosisProtocolV2/addresses',

  // // DutchX
  'commands/dutchX/balances',
  'commands/dutchX/usersDeposit',
  'commands/dutchX/auctions',
  // 'commands/dutchX/claimableFunds',

  // // Uniswap
  // 'commands/uniswap/sellPrice',
  // 'commands/uniswap/buyPrice',
]

async function run() {
  const version = process.env.npm_package_version
  assert(version, 'Version is unknown')

  console.log('\n' + chalk.yellow(figlet.textSync('eth-scripts', { horizontalLayout: 'full' })) + '\n')
  program.version('0.0.1').description('A miscellaneous CLI for interacting with Ethereum')
  for (const command of COMMANDS) {
    ;(await import(command)).registerCommand(program)
  }

  return program.parseAsync(process.argv)
}
run().catch(console.error)
