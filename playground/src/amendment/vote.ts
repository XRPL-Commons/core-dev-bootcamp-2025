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

const amendmentHash = '3B95AC1581B355A45AC47DDFA65BE283519CD444B455A9719A1CAE6DE5A1E7A4';
const ipAddress: string = '79.110.60.100';
const port: number = 5205;
enableNodeAmendment(amendmentHash, ipAddress, port);
