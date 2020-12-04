import chalk from 'chalk'
import { CommanderStatic } from 'commander'
import { ethers } from 'ethers'
import { getSigner } from 'util/ethers'
// import { getProvider } from '../util/ethers'

async function run(text: string) {
  // const provider = getProvider()
  console.log(chalk`TEXT:\n{yellow ${text}}`)

  const signer = getSigner()
  const signedMessage = await signer.signMessage(text)
  console.log(chalk`\nSIGNED MESSAGE:\n{white ${signedMessage}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program.command('sign-text <text>').description('Sign a text using the private key').action(run)
}
