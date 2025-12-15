import { ZKScanClient } from '../src/api/client';

async function main() {
  const client = new ZKScanClient({
    apiUrl: process.env.ZKSCAN_API_URL || 'https://zkscan.app/api',
    apiKey: process.env.ZKSCAN_API_KEY as string
  });

  const address = process.argv[2];
  if (!address) {
    console.error('Usage: ts-node wallet-lookup.ts <address>');
    process.exit(1);
  }

  const result = await client.queryAuto(address, true);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
