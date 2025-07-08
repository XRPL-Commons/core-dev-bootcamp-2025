import { Client, ServerInfoRequest } from 'xrpl'
import 'dotenv/config'

async function main() {
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

main()
