import { Client, ECDSA, Payment, Wallet } from 'xrpl'
import 'dotenv/config'

async function sendAmount(client: Client, seed: string, destination: string, amount: string) {
  const master: Wallet = Wallet.fromSeed(seed, { algorithm: ECDSA.secp256k1 })
  const tx: Payment = {
    Account: master.classicAddress as string,
    TransactionType: 'Payment',
    Destination: destination,
    Amount: amount,
    Fee: '12',
  }
  const preparedTxn = await client.autofill(tx)
  const signed = master.sign(preparedTxn)
  const response = await client.request({
    command: 'submit',
    tx_blob: signed.tx_blob,
  })
  return response
}

async function main() {
  try {
    const client = new Client(process.env.WSS_ENDPOINT || '')
    await client.connect()
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
      '100000000'
    )
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      '100000000'
    )
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rH4KEcG9dEwGwpn6AyoWK9cZPLL4RLSmWW',
      '100000000'
    )
    if (client.connection.getUrl() === 'ws://localhost:6008') {
      await client.request({
        // @ts-ignore -- ignore
        command: 'ledger_accept',
      })
    }
    await client.disconnect()
  } catch (error) {
    console.error(error)
  }
}

main()
