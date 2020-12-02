import { Erc20__factory } from 'contracts/gen'
import { DEFAULT_DECIMALS } from 'const'
import { ethers, providers } from 'ethers'
import { TokenDetails } from 'types'
import { noop } from './misc'

export async function getTokenDetails(address: string, provider: providers.Provider): Promise<TokenDetails> {
  const addressNormalized = ethers.utils.getAddress(address)
  const token = Erc20__factory.connect(addressNormalized, provider)

  const [name, symbol, decimals] = await Promise.all([
    token.name().catch(noop),
    token.symbol().catch(noop),
    token.decimals().catch(() => DEFAULT_DECIMALS),
  ])
  const label = symbol || name || address

  return { address: addressNormalized, label, name, symbol, decimals }
}

export async function getTokensDetails(addresses: string[], provider: providers.Provider): Promise<TokenDetails[]> {
  const tokenDetailPromises = addresses.map((token) => getTokenDetails(token, provider))
  return Promise.all(tokenDetailPromises)
}
