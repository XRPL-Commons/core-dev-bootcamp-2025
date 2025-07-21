import { Client, ServerInfoRequest, SubscribeRequest } from 'xrpl'
import 'dotenv/config'

export async function rpc() {
  try {
    const client = new Client(process.env.WSS_ENDPOINT || '')
    await client.connect()
    const request: ServerInfoRequest = {
      command: 'server_info',
    }
    const response = await client.request(request)
    console.log(JSON.stringify(response, null, 2))

    await client.disconnect()
    return response
  } catch (error) {
    console.error(error)
  }
}

export async function subscribe() {
  try {
    const client = new Client('wss://xrplcluster.com')
    await client.connect()

    client.on('ledgerClosed', (tx: any) => {
      console.log(`ledger: ${JSON.stringify(tx, null, 2)}`)
    })
    const subscribeRequest: SubscribeRequest = {
      command: 'subscribe',
      streams: ['ledger'],
    }
    const response = await client.request(subscribeRequest)
    console.log(JSON.stringify(response, null, 2))

    // await client.disconnect()
    return response
  } catch (error) {
    console.error(error)
  }
}

// rpc()
subscribe()
