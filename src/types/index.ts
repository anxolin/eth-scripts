// export interface Result<T> {
//   value?: T
//   isError: boolean
//   errorMsg?: string
// }

export type Result<T> = Success<T> | ErrorResult

export interface Success<T> {
  isError: false
  value: T
}

export interface ErrorResult {
  isError: true
  errorMsg: string
}

export interface TokenDetails {
  address: string
  decimals: number
  label: string
  symbol?: string
  name?: string
}
