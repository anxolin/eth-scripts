import { Command, CommanderStatic } from 'commander'
import { readAddressesFromFile, writeJson } from 'util/file'
import { dxHelperAddress } from 'const'
import { DutchxHelper__factory } from 'contracts/gen/factories/DutchxHelper__factory'
import { getProvider } from 'util/ethers'
import chalk from 'chalk'
import { Dutchx, DutchxHelper } from 'contracts/gen'
import { breakInBatches, withRetry } from 'util/misc'
import tokenDetailsJson from '../../../data/dx-token-details.json'
import allAuctions from '../../../data/dx-all-auctions.json'
import { TokenDetails } from 'types'
import { BigNumber, ethers } from 'ethers'
import { CsvHeaders, writeCsvFile } from 'util/csv'
import { Auction } from 'commands/dutchX/auctions'
import { getDutchX } from './utils'
import { BigNumber as BigNum } from 'bignumber.js'

const BATCH_SIZE = 50
const DEFAULT_DECIMALS = 18
const ZERO = new BigNum('0')

type ClaimableType = 'seller' | 'buyer'

interface ClaimableDetails {
  type: ClaimableType
  user: string
  auctionIndex: number
  lastAuctionIndex: number

  closingPrice?: string

  claimableInputBalancesAtoms?: string
  claimableInputBalances?: string
  inputTokenSymbol?: string

  claimableOutputBalancesAtoms?: string
  claimableOutputBalances?: string
  outputTokenSymbol?: string

  sellToken: string
  sellTokenName?: string
  sellTokenSymbol?: string
  sellTokenDecimals?: string

  buyToken: string
  buyTokenName?: string
  buyTokenSymbol?: string
  buyTokenDecimals?: string

  // sellerBalancesAtoms?: string
  // sellerBalances?: string

  // buyerBalancesAtoms?: string
  // buyerBalances?: string
}

interface Price {
  num: BigNum
  den: BigNum
}

interface LastAuction {
  sellToken: string
  buyToken: string
  auctionIndex: number
}

function _getClaimableDetails(params: {
  type: ClaimableType
  user: string
  sellToken: string
  buyToken: string
  indices: BigNumber[]
  usersBalances: BigNumber[]
  tokenMap: Map<string, TokenDetails>
  closingPrice: BigNum
  auctionIndex: number
}): ClaimableDetails[] {
  const claimableFunds: ClaimableDetails[] = []
  const { type, user, indices, usersBalances, tokenMap, sellToken, buyToken, closingPrice, auctionIndex } = params
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
        type,
        auctionIndex: indices[i].toNumber(),
        sellToken,
        buyToken,
        user,
        closingPrice: closingPrice.toString(),
        lastAuctionIndex: auctionIndex,
      }

      // Sell token
      const sellTokenDetails = tokenMap.get(sellToken.toLowerCase())
      if (sellTokenDetails) {
        const { decimals, symbol, name } = sellTokenDetails
        Object.assign(claimableFund, {
          sellTokenDecimals: decimals,
          sellTokenName: name,
          sellTokenSymbol: symbol,
        })
      }

      // Buy token
      const buyTokenDetails = tokenMap.get(buyToken.toLowerCase())
      if (buyTokenDetails) {
        const { decimals, symbol, name } = buyTokenDetails
        Object.assign(claimableFund, {
          buyTokenDecimals: decimals,
          buyTokenName: name,
          buyTokenSymbol: symbol,
        })
      }

      // Calculate output tokens
      let claimableOutputBalancesAtoms: BigNum,
        decimals: string,
        inputTokenSymbol: string | undefined,
        outputTokenSymbol: string | undefined
      if (type === 'seller') {
        inputTokenSymbol = claimableFund.sellTokenSymbol
        outputTokenSymbol = claimableFund.buyTokenSymbol
        claimableOutputBalancesAtoms = new BigNum(usersBalances[i].toString()).multipliedBy(closingPrice)
        decimals = claimableFund.sellTokenDecimals ?? DEFAULT_DECIMALS.toString()
      } else {
        inputTokenSymbol = claimableFund.buyTokenSymbol
        outputTokenSymbol = claimableFund.sellTokenSymbol
        claimableOutputBalancesAtoms = closingPrice.isZero()
          ? ZERO
          : new BigNum(usersBalances[i].toString()).div(closingPrice)
        decimals = claimableFund.buyTokenDecimals ?? DEFAULT_DECIMALS.toString()
      }

      // Assign input output
      Object.assign(claimableFund, {
        // Input
        claimableInputBalancesAtoms: usersBalances[i].toString(),
        claimableInputBalances: ethers.utils.formatUnits(usersBalances[i], decimals),
        inputTokenSymbol,

        // Output at closing price
        claimableOutputBalancesAtoms: claimableOutputBalancesAtoms.toString(),
        claimableOutputBalances: ethers.utils.formatUnits(
          claimableOutputBalancesAtoms.toFixed(0, BigNum.ROUND_DOWN),
          decimals,
        ),
        outputTokenSymbol,
      })

      claimableFunds.push(claimableFund)
    }
  }

  return claimableFunds
}

async function getClaimableFunds(
  user: string,
  lastAuction: LastAuction,
  dxHelper: DutchxHelper,
  dutchX: Dutchx,
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

    const closingPriceFraction = await dutchX.getPriceInPastAuction(sellToken, buyToken, auctionIndex)
    const closingPrice = new BigNum(closingPriceFraction.num.toString()).div(
      new BigNum(closingPriceFraction.den.toString()),
    )

    const sellerClaimable = _getClaimableDetails({
      type: 'seller',
      user,
      sellToken,
      buyToken,
      indices: indicesSeller,
      usersBalances: usersBalancesSeller,
      tokenMap,
      closingPrice,
      auctionIndex,
    })
    const buyerClaimable = _getClaimableDetails({
      type: 'buyer',
      user,
      sellToken,
      buyToken,
      indices: indicesBuyer,
      usersBalances: usersBalancesBuyer,
      tokenMap,
      closingPrice,
      auctionIndex,
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
  const dutchX = getDutchX()

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
        usersBatch.map((user) => getClaimableFunds(user, lastAuction, dxHelperContract, dutchX, tokensMap)),
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
      { id: 'type', title: 'Claim Type' },
      { id: 'user', title: 'User' },
      { id: 'closingPrice', title: 'Closing Price' },

      { id: 'claimableInputBalances', title: 'Claimable Input' },
      { id: 'inputTokenSymbol', title: 'Output Token' },

      { id: 'claimableOutputBalances', title: 'Receivable Output' },
      { id: 'outputTokenSymbol', title: 'Output Token' },

      { id: 'auctionIndex', title: 'Auction Index' },
      { id: 'sellTokenSymbol', title: 'Sell Token' },
      { id: 'buyTokenSymbol', title: 'Buy Token' },
      { id: 'lastAuctionIndex', title: 'Last Auction Index' },

      { id: 'sellToken', title: 'Sell Token Address' },
      { id: 'buyToken', title: 'Buy Token Address' },
      { id: 'claimableInputBalancesAtoms', title: 'Claimable Input Balance Atoms' },
      { id: 'claimableOutputBalancesAtoms', title: 'Claimable Input Balance Atoms' },

      // { id: 'buyTokenName', title: 'Sell Token Name' },
      // { id: 'sellTokenName', title: 'Sell Token Name' },
      // { id: 'sellTokenDecimals', title: 'Sell Token Decimals' },
      // { id: 'buyTokenDecimals', title: 'Sell Token Decimals' },
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
