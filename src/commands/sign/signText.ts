import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getSigner } from 'util/ethers'

async function run(text: string) {
  const signer = getSigner()
  const [signedMessage, address] = await Promise.all([signer.signMessage(text), signer.getAddress()])
  const { r, s, v } = ethers.utils.splitSignature(signedMessage)

  console.log(chalk`{bold ADDRESS}: {yellow ${address}}`)
  console.log(chalk`\n{bold TEXT}:\n{white ${text}}`)
  console.log(chalk`{bold SIGNED MESSAGE}: {white ${signedMessage}}`)
  console.log(chalk`{bold R}: {white ${r}}`)
  console.log(chalk`{bold S}: {white ${s}}`)
  console.log(chalk`{bold V}: {white ${v}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('sign-text <text>').description('Sign a text using the private key').action(run)
}
