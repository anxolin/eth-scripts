import { CommanderStatic } from 'commander'

import { registerCommand as sellPrice } from './sellPrice'
import { registerCommand as buyPrice } from './buyPrice'

export function registerCommand(program: CommanderStatic): void {
  sellPrice(program)
  buyPrice(program)
}
