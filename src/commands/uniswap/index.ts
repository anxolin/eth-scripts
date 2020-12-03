import { CommanderStatic } from 'commander'
import { registerCommand as sellPriceRegister } from './sellPrice'
import { registerCommand as buyPriceRegister } from './buyPrice'

export function registerCommand(program: CommanderStatic): void {
  sellPriceRegister(program)
  buyPriceRegister(program)
}
