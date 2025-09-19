import { Client, ECDSA, Payment, Wallet } from 'xrpl'
import 'dotenv/config'

interface AccountInfo {
  address: string
  seed: string
  publicKey: string
  privateKey: string
}

async function fundAccount(client: Client, masterSeed: string, destinationAddress: string, amount: string) {
  const masterWallet: Wallet = Wallet.fromSeed(masterSeed, { algorithm: ECDSA.secp256k1 })
  
  const tx: Payment = {
    Account: masterWallet.classicAddress,
    TransactionType: 'Payment',
    Destination: destinationAddress,
    Amount: amount,
    Fee: '12',
  }
  
  const preparedTxn = await client.autofill(tx)
  const signed = masterWallet.sign(preparedTxn)
  const response = await client.request({
    command: 'submit',
    tx_blob: signed.tx_blob,
  })
  
  return response
}

async function createAndFundAccount(client: Client, masterSeed: string, fundingAmount: string = '20000000'): Promise<AccountInfo> {
  const newWallet = Wallet.generate(ECDSA.secp256k1)
  await fundAccount(client, masterSeed, newWallet.classicAddress, fundingAmount)
  
  return {
    address: newWallet.classicAddress,
    seed: newWallet.seed!,
    publicKey: newWallet.publicKey,
    privateKey: newWallet.privateKey
  }
}

async function main() {
  try {
    const client = new Client(process.env.WSS_ENDPOINT || 'ws://localhost:6006')
    await client.connect()
    
    const masterSeed = 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb'
    const accounts: AccountInfo[] = []
    const numberOfAccounts = 3
    
    for (let i = 1; i <= numberOfAccounts; i++) {
      const account = await createAndFundAccount(client, masterSeed, '20000000')
      accounts.push(account)
      
      if (client.connection.getUrl().includes('localhost')) {
        await client.request({
          // @ts-ignore -- ignore
          command: 'ledger_accept',
        })
      }
    }
    
    console.log('Accounts:')
    accounts.forEach((account, index) => {
      console.log(`Account ${index + 1}: ${account.address} | Seed: ${account.seed}`)
    })
    
    console.log('\nSeed Phrases:')
    accounts.forEach((account, index) => {
      console.log(`${account.seed}`)
    })
    
    await client.disconnect()
    
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
