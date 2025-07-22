import axios from 'axios';

async function enableNodeAmendment(
    amendmentHash: string,
    idAddress: string,
    port: number,
): Promise<void> {
    const command: Record<string, any> = {
        method: "feature",
        params: [
            {
                feature: amendmentHash,
                vetoed: false,
            }
        ],
    };
    
    try {
        const response = await axios.post(`http://${idAddress}:${port}`, command, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
        
    } catch (error) {
        console.error(`Failed to enable amendment for node ${idAddress}:`, error);
        throw error;
    }
}

const amendmentHash = '138B968F25822EFBF54C00F97031221C47B1EAB8321D93C7C2AEAF85F04EC5DF';
// const ipAddress: string = '79.110.60.100';
// const port: number = 5205;
// enableNodeAmendment(amendmentHash, ipAddress, port);

const ipList = [
    '79.110.60.100',
    '79.110.60.101',
    '79.110.60.102',
    '79.110.60.103',
    '79.110.60.104',
]
const portList = [
    5205,
    5305,
    5405,
    5505,
    5605,
]
// for loop with i
for (let i = 0; i < ipList.length; i++) {
    const ip = ipList[i];
    const port = portList[i % portList.length];
    enableNodeAmendment(amendmentHash, ip, port);
}
