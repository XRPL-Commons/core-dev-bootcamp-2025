import { PublisherClient, ValidatorClient, fromDateToEffective,
  fromDaysToExpiration } from '@transia/xrpld-publisher'

export async function buildVL() {
    const client = new PublisherClient()
    await client.createKeys()
    const addManifest = await buildValidator()
    client.addValidator(addManifest)
    const effective: number = fromDateToEffective('01/01/2024')
    const expiration: number = fromDaysToExpiration(effective, 30) // Days
    client.signUnl('myvl.json', { effective, expiration })
}

export async function buildValidator(): Promise<string> {
    const client = new ValidatorClient('test-v')
    await client.createKeys()
    await client.setDomain('domain.com')
    await client.createToken()
    return await client.readManifest()
}

buildVL()