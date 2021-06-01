import { Command, CommanderStatic } from 'commander'
import { readAddressesFromFile, writeJson } from 'util/file'
import { dxHelperAddress } from 'const'
import { DutchxHelper__factory } from 'contracts/gen/factories/DutchxHelper__factory'
import { getProvider } from 'util/ethers'
import chalk from 'chalk'
import { DutchxHelper } from 'contracts/gen'
import { breakInBatches, withRetry } from 'util/misc'
import tokenDetailsJson from '../../../data/dx-token-details.json'
import allAuctions from '../../../data/dx-all-auctions.json'
import { TokenDetails } from 'types'
import { BigNumber, ethers } from 'ethers'
import { CsvHeaders, writeCsvFile } from 'util/csv'
import { Auction } from 'commands/dutchX/auctions'

const BATCH_SIZE = 50
const DEFAULT_DECIMALS = 18

interface ClaimableDetails {
  user: string
  auctionIndex: number
  sellToken: string
  sellTokenName?: string
  sellTokenSymbol?: string
  sellTokenDecimals?: string
  buyToken: string
  buyTokenName?: string
  buyTokenSymbol?: string
  buyTokenDecimals?: string
  sellerBalancesAtoms?: string
  sellerBalances?: string
  buyerBalancesAtoms?: string
  buyerBalances?: string
}

interface LastAuction {
  sellToken: string
  buyToken: string
  auctionIndex: number
}

function _getClaimableDetails(params: {
  user: string
  sellToken: string
  buyToken: string
  indices: BigNumber[]
  usersBalances: BigNumber[]
  tokenMap: Map<string, TokenDetails>
  isSeller: boolean
}) {
  const claimableFunds: ClaimableDetails[] = []
  const { user, indices, usersBalances, tokenMap, sellToken, buyToken, isSeller } = params
  if (usersBalances.length > 0) {
    if (usersBalances.length > 0) {
      console.log(
        chalk`\tFound {yellow ${
          usersBalances.length
        }} unclaimed balances for user ${user} in ${sellToken}-${buyToken}: ${indices.join(', ')}`,
      )
    }

    for (let i = 0; i < usersBalances.length; i++) {
      const claimableFund: ClaimableDetails = {
        auctionIndex: indices[i].toNumber(),
        sellToken,
        buyToken,
        user,
      }

      const sellTokenDetails = tokenMap.get(sellToken.toLowerCase())
      if (sellTokenDetails) {
        const { decimals, symbol, name } = sellTokenDetails
        Object.assign(claimableFund, {
          sellTokenDecimals: decimals,
          sellTokenName: name,
          sellTokenSymbol: symbol,
        })
      }

      const buyTokenDetails = tokenMap.get(buyToken.toLowerCase())
      if (buyTokenDetails) {
        const { decimals, symbol, name } = buyTokenDetails
        Object.assign(claimableFund, {
          buyTokenDecimals: decimals,
          buyTokenName: name,
          buyTokenSymbol: symbol,
        })
      }

      if (isSeller) {
        Object.assign(claimableFund, {
          sellerBalancesAtoms: usersBalances[i].toString(),
          sellerBalances: ethers.utils.formatUnits(
            usersBalances[i],
            claimableFund.sellTokenDecimals ?? DEFAULT_DECIMALS,
          ),
          buyerBalancesAtoms: '0',
          buyerBalances: '0',
        })
      } else {
        claimableFund.buyerBalancesAtoms = usersBalances[i].toString()
        claimableFund.buyerBalances = ethers.utils.formatUnits(
          usersBalances[i],
          claimableFund.buyTokenDecimals ?? DEFAULT_DECIMALS,
        )
        Object.assign(claimableFund, {
          buyerBalancesAtoms: usersBalances[i].toString(),
          buyerBalances: ethers.utils.formatUnits(
            usersBalances[i],
            claimableFund.sellTokenDecimals ?? DEFAULT_DECIMALS,
          ),
          sellerBalancesAtoms: '0',
          sellerBalances: '0',
        })
      }

      claimableFunds.push(claimableFund)
    }
  }

  return claimableFunds
}

async function getClaimableFunds(
  user: string,
  lastAuction: LastAuction,
  dxHelper: DutchxHelper,
  tokenMap: Map<string, TokenDetails>,
): Promise<ClaimableDetails[]> {
  const { auctionIndex, sellToken, buyToken } = lastAuction

  let claimableFunds: ClaimableDetails[] = []
  await withRetry(async () => {
    // Get unclaimed seller balances
    const {
      indices: indicesSeller,
      usersBalances: usersBalancesSeller,
    } = await dxHelper.getIndicesWithClaimableTokensForSellers(sellToken, buyToken, user, auctionIndex)
    const {
      indices: indicesBuyer,
      usersBalances: usersBalancesBuyer,
    } = await dxHelper.getIndicesWithClaimableTokensForBuyers(sellToken, buyToken, user, auctionIndex)

    const sellerClaimable = _getClaimableDetails({
      user,
      sellToken,
      buyToken,
      indices: indicesSeller,
      usersBalances: usersBalancesSeller,
      tokenMap,
      isSeller: true,
    })
    const buyerClaimable = _getClaimableDetails({
      user,
      sellToken,
      buyToken,
      indices: indicesBuyer,
      usersBalances: usersBalancesBuyer,
      tokenMap,
      isSeller: false,
    })

    // Concat all claimable amounts
    claimableFunds = claimableFunds.concat(sellerClaimable).concat(buyerClaimable)
  })

  return claimableFunds
}

function _getTokensMap(): Map<string, TokenDetails> {
  return tokenDetailsJson.reduce<Map<string, TokenDetails>>(
    (acc, token) => acc.set(token.address.toLowerCase(), token),
    new Map(),
  )
}

function _getLastAuctions(auctions: Auction[], token?: string): LastAuction[] {
  const tokenLower = token?.toLowerCase()
  const auctionFiltered = tokenLower
    ? auctions.filter((a) => a.sellToken.toLowerCase() == tokenLower || a.buyToken.toLowerCase() == tokenLower)
    : auctions

  // Get last auction for each
  const lastAuctionsMap = auctionFiltered.reduce<Map<string, LastAuction>>((acc, auction) => {
    const { sellToken, buyToken } = auction

    const key = `${auction.sellToken}_${auction.buyToken}`
    const lastAuction = acc.get(key) || { sellToken, buyToken, auctionIndex: 0 }
    lastAuction.auctionIndex = Math.max(lastAuction.auctionIndex, auction.auctionIndex)
    acc.set(key, lastAuction)
    return acc
  }, new Map())

  return Array.from(lastAuctionsMap.values())
}

async function run(usersFilePath: string, outputFilePath: string, program: Command): Promise<void> {
  const { token } = program.opts()

  const usersResult = readAddressesFromFile(usersFilePath)
  if (usersResult.isError) {
    console.error(usersResult.errorMsg)
    return
  }

  const provider = getProvider()
  const dxHelperContract = DutchxHelper__factory.connect(dxHelperAddress, provider)

  const lastAuctions = _getLastAuctions(allAuctions, token)
  console.log(
    'Last auctions',
    lastAuctions.map((a) => `${a.sellToken}-${a.buyToken}: ${a.auctionIndex}`),
  )

  // Break users in batches, to do some parallel work
  const usersBatches = breakInBatches(usersResult.value, BATCH_SIZE)

  const tokensMap = _getTokensMap()

  let claimableFunds: ClaimableDetails[] = []
  for (const lastAuction of lastAuctions) {
    const { sellToken, buyToken, auctionIndex } = lastAuction
    console.log(
      chalk`\nGet Claimable auctions for: pair {yellow ${sellToken}}-{yellow ${buyToken}}, auction ${auctionIndex}`,
    )

    for (const usersBatch of usersBatches) {
      console.log(chalk`\tGet Claimable auctions for users {yellow ${usersBatch.join(', ')}}`)
      // Fetch a few users in parallel
      const claimableFundsBatch = await Promise.all(
        usersBatch.map((user) => getClaimableFunds(user, lastAuction, dxHelperContract, tokensMap)),
      )

      // Flatten claimable funds, and concat
      claimableFunds = claimableFunds.concat(
        claimableFundsBatch.reduce((acc, claimables) => acc.concat(claimables), []),
      )
    }
  }

  console.log(
    chalk`\t User has {white ${claimableFunds.length}} tokens with balance. Total {white ${claimableFunds.length}}`,
  )

  if (outputFilePath.endsWith('.csv')) {
    const headers: CsvHeaders = [
      { id: 'user', title: 'user' },
      { id: 'sellerBalances', title: 'Seller Balance' },
      { id: 'sellTokenSymbol', title: 'Sell Token' },
      { id: 'buyerBalances', title: 'Buyer Balance' },
      { id: 'buyTokenSymbol', title: 'Buy Token' },
      { id: 'auctionIndex', title: 'Auction Index' },
      { id: 'sellTokenName', title: 'Sell Token Name' },
      { id: 'buyTokenName', title: 'Sell Token Name' },
      { id: 'sellToken', title: 'Sell Token Address' },
      { id: 'buyToken', title: 'Buy Token Address' },
      { id: 'sellTokenDecimals', title: 'Sell Token Decimals' },
      { id: 'buyTokenDecimals', title: 'Sell Token Decimals' },
      { id: 'sellerBalancesAtoms', title: 'Seller Balance Atoms' },
      { id: 'buyerBalancesAtoms', title: 'Buyer Balance Atoms' },
    ]
    writeCsvFile(outputFilePath, claimableFunds, headers)
    console.log(chalk`Written users in file {white ${outputFilePath}}`)
  } else {
    const file = outputFilePath.endsWith('.json') ? outputFilePath : outputFilePath + '.json'
    writeJson(file, claimableFunds)
    console.log(chalk`Written users in file {white ${file}}`)
  }
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-claimable <address-list-json-file> <output-csv-file>')
    .option('-t --token <address>', 'Filter by token (sell or buy)')
    .description('Get the DutchX claimable funds for a set of addresses for all DutchX auctions')
    .action(run)
}
