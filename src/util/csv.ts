import fs from 'fs'
import csvParser from 'csv-parser'
import { createObjectCsvWriter } from 'csv-writer'
import { ObjectStringifierHeader } from 'csv-writer/src/lib/record'

export type CsvHeaders = ObjectStringifierHeader

export async function parseCsvFile<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = []
    fs.createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(csvParser())
      .on('data', (data: T) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error))
  })
}

export async function writeCsvFile<T>(filePath: string, data: T[], header: CsvHeaders): Promise<void> {
  return createObjectCsvWriter({
    path: filePath,
    header,
  }).writeRecords(data)
}
