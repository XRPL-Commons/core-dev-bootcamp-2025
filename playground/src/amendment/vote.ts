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
        await axios.post(`http://${idAddress}:${port}`, command, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(`Failed to enable amendment for node ${idAddress}:`, error);
        throw error;
    }
}

const amendmentHash = '138B968F25822EFBF54C00F97031221C47B1EAB8321D93C7C2AEAF85F04EC5DF';
const ipAddress: string = '79.110.60.100';
const port: number = 5205;
enableNodeAmendment(amendmentHash, ipAddress, port);
