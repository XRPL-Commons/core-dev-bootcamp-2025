import { AccountSetAsfFlags, Client, ECDSA, IssuedCurrencyAmount, Payment, Wallet } from 'xrpl'
import 'dotenv/config'
import { accountSet, isFunded, isSetup, pay, trust } from './helpers'

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

async function fund(client: Client) {
  try {
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rURHHrZ6Xdui8meH3SkTTpa4BtJUgQgPet',
      '100000000'
    )
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rhdzhB5W91CeW4E7pb6C7EWPTQgECmPyYd',
      '100000000'
    )
    await sendAmount(
      client,
      'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
      'rsX7XkefStEwm4W47tMdiaj7MwFMnnV3bj',
      '100000000'
    )
  } catch (error) {
    console.error(error)
  }
}

export async function setup(client: Client) {
  const alice: Wallet = Wallet.fromSeed("sEd7zAuRv5zW4UGnGXvgftjeUMBMcAS");
  const bob: Wallet = Wallet.fromSeed("sEd7VAUn5GcVVAZ9FFvgZzFWPsSGHyc");
  const gw: Wallet = Wallet.fromSeed("sEdThN7Lx5oaXcQcYYEkLNFVGVYd8Fa");

  await accountSet(client, gw, AccountSetAsfFlags.asfDefaultRipple);

  // SetTrust for alice and bob
  const limit: IssuedCurrencyAmount = {
    currency: "USD",
    issuer: gw.classicAddress,
    value: "1000000",
  };
  await trust(client, limit, ...[alice, bob]);

  // Send some USD to alice and bob
  const amount: IssuedCurrencyAmount = {
    currency: "USD",
    issuer: gw.classicAddress,
    value: "10000",
  };
  await pay(client, amount, gw, ...[alice.classicAddress, bob.classicAddress]);
}

export async function main() {
  const client = new Client("wss://batch.nerdnest.xyz");
  await client.connect();
  const gw: Wallet = Wallet.fromSeed("sEdThN7Lx5oaXcQcYYEkLNFVGVYd8Fa");

  if (!(await isFunded(client, gw.classicAddress))) {
    await fund(client);
  }

  if (!(await isSetup(client, gw.classicAddress))) {
    await setup(client);
  }

  await client.disconnect();
}
