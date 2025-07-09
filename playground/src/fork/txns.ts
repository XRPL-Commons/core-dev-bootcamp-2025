import {
  Client,
  encode,
  encodeForSigning,
  EscrowCreate,
  EscrowFinish,
  IssuedCurrencyAmount,
  Wallet,
} from 'xrpl'
import { sign } from 'ripple-keypairs'

export async function escrowCreate(
  ctx: Client,
  account: Wallet,
  destination: string,
  amount: IssuedCurrencyAmount
): Promise<number> {
  try {
    const CLOSE_TIME: number = (
      await ctx.request({
        command: 'ledger',
        ledger_index: 'validated',
      })
    ).result.ledger.close_time
    const builtTx: EscrowCreate = {
      TransactionType: 'EscrowCreate',
      Account: account.classicAddress as string,
      Destination: destination,
      // @ts-expect-error -- invalid amount
      Amount: amount,
      // NetworkID: ctx.networkID,
      SigningPubKey: account.publicKey,
      FinishAfter: CLOSE_TIME + 20,
    }
    const preparedTxn = await ctx.autofill(builtTx, 0)
    const encoded = encodeForSigning(preparedTxn)
    const signed = sign(encoded, account.privateKey)
    preparedTxn.TxnSignature = signed
    const txBlob = encode(preparedTxn)

    const submit = await ctx.request({
      command: 'submit',
      tx_blob: txBlob,
    })
    console.log(`EscrowCreate submitted: ${JSON.stringify(submit, null, 2)}`)
    return submit.result.tx_json.Sequence
  } catch (error: any) {
    throw error
  }
}

export async function escrowFinish(
  ctx: Client,
  account: Wallet,
  owner: string,
  sequence: number
): Promise<void> {
  try {
    const builtTx: EscrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: account.classicAddress as string,
      Owner: owner,
      OfferSequence: sequence,
      // NetworkID: ctx.networkID,
      SigningPubKey: account.publicKey,
    }
    const preparedTxn = await ctx.autofill(builtTx, 0)
    const encoded = encodeForSigning(preparedTxn)
    const signed = sign(encoded, account.privateKey)
    preparedTxn.TxnSignature = signed
    const txBlob = encode(preparedTxn)

    const submit = await ctx.request({
      command: 'submit',
      tx_blob: txBlob,
    })
    console.log(`EscrowCreate submitted: ${JSON.stringify(submit, null, 2)}`)
  } catch (error: any) {
    throw error
  }
}
