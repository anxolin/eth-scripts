import { CommanderStatic } from 'commander'
import { readAddressesFromFile } from 'util/file'

async function run(file: string): Promise<void> {
  const result = readAddressesFromFile(file)
  if (result.isError) {
    console.error(result.errorMsg)
    return
  }

  // const provider = getProvider()
  // const balance = await provider.getBalance(address)

  // console.log(chalk`Balance: {green ${ethers.utils.formatEther(balance)} ETH} (${balance} wei)`)
  console.log('result', result)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-balances <address-list-json-file>')
    .description('Get the DutchX balances from a list of addresses')
    .action(run)
}
