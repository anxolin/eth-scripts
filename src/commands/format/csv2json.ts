import { CommanderStatic } from 'commander'
import { writeJson } from 'util/file'
import { parseCsvFile } from 'util/csv'
import chalk from 'chalk'

async function run(csvPath: string, outputFilePath: string): Promise<void> {
  console.log(chalk`\t Write {white ${csvPath.length}} in JSON format`)

  const csvData = await parseCsvFile(csvPath)
  const file = outputFilePath.endsWith('.json') ? outputFilePath : outputFilePath + '.json'
  writeJson(file, csvData)
  console.log(chalk`Written data in file {white ${file}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('csv2json <input-csv-file> <output-json-file>')
    .description('Convert a CSV file into JSON')
    .action(run)
}
