import {
  AccountInfoRequest,
  AccountSet,
  AccountSetAsfFlags,
  Client,
  encode,
  encodeForSigning,
  IssuedCurrencyAmount,
  Payment,
  TrustSet,
  Wallet,
} from 'xrpl'
import { sign } from 'ripple-keypairs'

export async function pay(
  ctx: Client,
  amount: IssuedCurrencyAmount,
  signer: Wallet,
  ...accts: string[]
): Promise<void> {
  for (const acct of accts) {
    try {
      const builtTx: Payment = {
        TransactionType: 'Payment',
        Account: signer.classicAddress,
        Destination: acct as string,
        Amount: amount,
      }
      const result = await ctx.submit(builtTx, {
        autofill: true,
        failHard: true,
        wallet: signer,
      })
      console.log(`Payment submitted: ${JSON.stringify(result, null, 2)}`)
    } catch (error: any) {
      throw error
    }
  }
}

export async function trust(
  ctx: Client,
  amount: IssuedCurrencyAmount,
  ...accts: Wallet[]
): Promise<any> {
  for (const acct of accts) {
    try {
      const builtTx: TrustSet = {
        TransactionType: 'TrustSet',
        Account: acct.classicAddress as string,
        LimitAmount: amount,
        // NetworkID: ctx.networkID,
      }
      const result = await ctx.submit(builtTx, {
        autofill: true,
        failHard: true,
        wallet: acct,
      })
      console.log(`TrustSet submitted: ${JSON.stringify(result, null, 2)}`)
    } catch (error: any) {
      throw error
    }
  }
}

export async function accountSet(
  ctx: Client,
  account: Wallet,
  flag: AccountSetAsfFlags
): Promise<void> {
  try {
    const builtTx: AccountSet = {
      TransactionType: 'AccountSet',
      Account: account.classicAddress as string,
      TransferRate: 0,
      SetFlag: flag,
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
    console.log(`AccountSet submitted: ${JSON.stringify(submit, null, 2)}`)
  } catch (error: any) {
    throw error
  }
}

export async function isFunded(ctx: Client, account: string): Promise<boolean> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: account as string,
  }
  try {
    const response = await ctx.request(request)
    return Number(response.result.account_data.Balance) > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // appLogger.debug(error.message)
    return false
  }
}

export async function isSetup(ctx: Client, account: string): Promise<boolean> {
  const request: AccountInfoRequest = {
    command: 'account_info',
    account: account as string,
  }
  try {
    const response = await ctx.request(request)
    return response.result.account_flags.defaultRipple === true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // appLogger.debug(error.message)
    return false
  }
}
