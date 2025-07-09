import { Client, decodeAccountID, IssuedCurrencyAmount, Wallet } from 'xrpl'
import { sign } from 'ripple-keypairs'
import { encode, encodeForSigning, XrplDefinitions } from 'ripple-binary-codec'
import 'dotenv/config'

import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/dist/utils'

const HASH_BYTES = 32
function sha512Half(hex: string): string {
  return bytesToHex(sha512(hexToBytes(hex)).slice(0, HASH_BYTES))
}

function addressToHex(address: string): string {
  return bytesToHex(decodeAccountID(address))
}
const HEX = 16
export function hashRecurringPaymentId(address: string, sequence: number): string {
  const hexPrefix = 'w'.charCodeAt(0).toString(HEX).padStart(2, '0')
  const hexSequence = sequence.toString(HEX).padStart(8, '0')
  const prefix = `00${hexPrefix}`
  return sha512Half(prefix + addressToHex(address) + hexSequence)
}

export async function recurringPaymentSet(
  client: Client,
  wallet: Wallet,
  dest: string,
  amount: IssuedCurrencyAmount,
  frequency: number,
  publicKey: string
): Promise<string> {
  const liveDefinitions = await client.request({
    command: 'server_definitions',
  })
  const _liveDefinitions = JSON.parse(JSON.stringify(liveDefinitions.result))
  const definitions = new XrplDefinitions(_liveDefinitions)

  const txn = {
    TransactionType: 'RecurringPaymentSet',
    Account: wallet.classicAddress,
    Destination: dest,
    Amount: amount,
    Frequency: frequency, // 2592000, // 30 days in seconds
  }
  if (publicKey) {
    // @ts-ignore -- ignore
    txn.PublicKey = publicKey
  }

  // @ts-ignore -- ignore
  txn.SigningPubKey = wallet.publicKey

  // @ts-ignore -- ignore
  const preparedTxn = await client.autofill(txn)
  console.log(JSON.stringify(preparedTxn, null, 2))
  // console.log(definitions)

  const encoded = encodeForSigning(preparedTxn, definitions)
  const signed = sign(encoded, wallet.privateKey)
  preparedTxn.TxnSignature = signed
  const txBlob = encode(preparedTxn, definitions)

  const submit = await client.request({
    command: 'submit',
    tx_blob: txBlob,
  })

  console.log(submit)
  if (client.connection.getUrl() === 'ws://localhost:6008') {
    await client.request({
      // @ts-ignore -- ignore
      command: 'ledger_accept',
    })
  }

  return hashRecurringPaymentId(wallet.classicAddress, preparedTxn.Sequence)
}

export async function recurringPaymentClaim(
  client: Client,
  wallet: Wallet,
  recurringPaymentID: string,
  amount: IssuedCurrencyAmount,
  destination?: string,
  signature?: string,
) {
  const liveDefinitions = await client.request({
    command: 'server_definitions',
  })
  const _liveDefinitions = JSON.parse(JSON.stringify(liveDefinitions.result))
  const definitions = new XrplDefinitions(_liveDefinitions)

  const txn = {
    TransactionType: 'RecurringPaymentClaim',
    Account: wallet.classicAddress,
    RecurringPaymentID: recurringPaymentID,
    Amount: amount,
  }

  if (destination && signature) {
    // @ts-ignore -- ignore
    txn.Destination = destination
    // @ts-ignore -- ignore
    txn.Signature = signature
  }

  // @ts-ignore -- ignore
  txn.SigningPubKey = wallet.publicKey

  // @ts-ignore -- ignore
  const preparedTxn = await client.autofill(txn)
  // console.log(JSON.stringify(preparedTxn, null, 2))

  const encoded = encodeForSigning(preparedTxn, definitions)
  const signed = sign(encoded, wallet.privateKey)
  preparedTxn.TxnSignature = signed
  const txBlob = encode(preparedTxn, definitions)

  const submit = await client.request({
    command: 'submit',
    tx_blob: txBlob,
  })
  console.log(submit)

  if (client.connection.getUrl() === 'ws://localhost:6008') {
    await client.request({
      // @ts-ignore -- ignore
      command: 'ledger_accept',
    })
  }
}