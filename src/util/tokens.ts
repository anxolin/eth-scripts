import { Erc20__factory } from 'contracts/gen'
import { DEFAULT_DECIMALS } from 'const'
import { providers } from 'ethers'
import { TokenDetails } from 'types'

export async function getTokenDetails(address: string, provider: providers.Provider): Promise<TokenDetails> {
  const token = Erc20__factory.connect(address, provider)

  const [name, symbol, decimals] = await Promise.all([
    token.name().catch(() => undefined),
    token.symbol().catch(() => undefined),
    token.decimals().catch(() => DEFAULT_DECIMALS),
  ])
  const label = symbol || name || address

  return { label, name, symbol, decimals, address }
}

export async function getTokensDetails(addresses: string[], provider: providers.Provider): Promise<TokenDetails[]> {
  const tokenDetailPromises = addresses.map((token) => getTokenDetails(token, provider))
  return Promise.all(tokenDetailPromises)
}
