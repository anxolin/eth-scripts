import { CommanderStatic } from 'commander'
import { writeJson } from 'util/file'
import chalk from 'chalk'
// import allClaimable from '../../../data/dx-all-claimable.json'
import allClaimable from '../../../claimable.json'
import { BigNumber } from 'ethers'
import { getDutchX } from './utils'

interface AuctionClaims {
  sellTokens: string[]
  buyTokens: string[]
  indices: string[]
}

interface UserClaimData {
  seller: AuctionClaims
  buyer: AuctionClaims
}

interface ClaimTx {
  user: string
  auctionClaims: AuctionClaims
  txData: string
}

function addIntoAuctionClaims(sellToken: string, buyToken: string, index: string, auctionClaims: AuctionClaims) {
  auctionClaims.sellTokens.push(sellToken)
  auctionClaims.buyTokens.push(buyToken)
  auctionClaims.indices.push(index)
}

function _getClaimableData(): Map<string, UserClaimData> {
  return allClaimable.reduce<Map<string, UserClaimData>>((acc, claimable) => {
    const {
      user,
      sellToken: sellToken,
      buyToken: buyToken,
      auctionIndex: index,
      sellerBalancesAtoms: sellerBalance,
      buyerBalancesAtoms: buyerBalance,
    } = claimable

    let claimableData = acc.get(user)
    if (!claimableData) {
      claimableData = {
        seller: {
          buyTokens: [],
          sellTokens: [],
          indices: [],
        },
        buyer: {
          buyTokens: [],
          sellTokens: [],
          indices: [],
        },
      }
      acc.set(user, claimableData)
    }

    const sellerBalanceBn = BigNumber.from(sellerBalance)
    if (!sellerBalanceBn.isZero()) {
      addIntoAuctionClaims(sellToken, buyToken, index.toString(), claimableData.seller)
    }

    const buyerBalanceBn = BigNumber.from(buyerBalance)
    if (!buyerBalanceBn.isZero()) {
      addIntoAuctionClaims(sellToken, buyToken, index.toString(), claimableData.buyer)
    }

    return acc
  }, new Map())
}

async function run(outputFilePath: string): Promise<void> {
  const dutchX = getDutchX()

  const claimableDataUsers = _getClaimableData()

  dutchX.getAbi

  const txs: ClaimTx[] = []
  for (const [user, claimableData] of claimableDataUsers.entries()) {
    if (claimableData.seller.indices.length > 0) {
      const { sellTokens, buyTokens, indices } = claimableData.seller
      const txData = dutchX.interface.encodeFunctionData('claimTokensFromSeveralAuctionsAsSeller', [
        sellTokens,
        buyTokens,
        indices,
        user,
      ])

      // _getClaimTx(user, claimableData.seller, dutchX)
      txs.push({ user, auctionClaims: claimableData.seller, txData })
    }
    if (claimableData.buyer.indices.length > 0) {
      const { sellTokens, buyTokens, indices } = claimableData.buyer
      const txData = dutchX.interface.encodeFunctionData('claimTokensFromSeveralAuctionsAsBuyer', [
        sellTokens,
        buyTokens,
        indices,
        user,
      ])

      // _getClaimTx(user, claimableData.seller, dutchX)
      txs.push({ user, auctionClaims: claimableData.buyer, txData })
    }
  }

  // for (const tx of txs) {
  //   console.log(tx)
  // }

  const file = outputFilePath.endsWith('.json') ? outputFilePath : outputFilePath + '.json'
  writeJson(file, txs)
  console.log(chalk`Written ${txs.length} txs in file {white ${file}}`)
}

export function registerCommand(program: CommanderStatic): void {
  program
    .command('dx-claim <output-json>')
    .description('Return DutchX claim tx data given some claimable information')
    .action(run)
}
