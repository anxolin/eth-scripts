import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'

async function run(text: string, signedMessage: string) {
  console.log(chalk`{bold TEXT}:\n{yellow ${text}}`)
  console.log(chalk`{bold SIGNED MESSAGE}:\n{yellow ${signedMessage}}`)
  const message = ethers.utils.verifyMessage(text, signedMessage)

  console.log(chalk`\nTEXT:\n{white ${message}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('verify-text <text> <signedMessage>')
    .description(
      'Verify a text has been signed by an ethereum account. If succeeds, it returns the account used for signing. The signature may have a non-canonical v (i.e. does not need to be 27 or 28), in which case it will be normalized to compute the `recoveryParam` which will then be used to compute the address; this allows systems which use the v to encode additional data (such as EIP-155) to be used since the v parameter is still completely non-ambiguous.',
    )
    .action(run)
}
