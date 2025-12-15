import { ZKScanClient, ZKScanBatchItem } from '../src/api/client';

async function main() {
  const client = new ZKScanClient({
    apiUrl: process.env.ZKSCAN_API_URL || 'https://zkscan.app/api',
    apiKey: process.env.ZKSCAN_API_KEY as string
  });

  const items: ZKScanBatchItem[] = process.argv.slice(2).map((value) => ({
    value,
    generateProof: true
  }));

  if (items.length === 0) {
    console.error('Usage: ts-node batch-detailed.ts <value1> <value2> ...');
    process.exit(1);
  }

  const results = await client.batchQueryDetailed(items, true);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
