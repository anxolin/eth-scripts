import { CommanderStatic } from 'commander'

import { registerCommand as balances } from './balances'
import { registerCommand as usersDeposit } from './usersDeposit'

export function registerCommand(program: CommanderStatic): void {
  balances(program)
  usersDeposit(program)
}
