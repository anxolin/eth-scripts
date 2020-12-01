import chalk from 'chalk'

const WAIT_TIME = 10000

export async function withRetry<T>(run: () => Promise<T>, attempts = 100): Promise<T> {
  return run().catch((error) => {
    console.error(chalk`{red Error: ${error}. Retrying in {white ${WAIT_TIME}ms} }`)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        withRetry(run, attempts - 1)
          .then(resolve)
          .catch(reject)
      }, WAIT_TIME)
    })
  })
}

export const noop: () => undefined = () => undefined
