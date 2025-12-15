import { ZKScanClient, ZKScanClientEvent } from '../src/api/client';

function logEvent(event: ZKScanClientEvent) {
  console.log('[event]', event.type, new Date(event.timestamp).toISOString(), event.details || {});
}

async function main() {
  const client = new ZKScanClient({
    apiUrl: process.env.ZKSCAN_API_URL || 'https://zkscan.app/api',
    apiKey: process.env.ZKSCAN_API_KEY as string,
    onEvent: logEvent
  });

  const value = process.argv[2];
  if (!value) {
    console.error('Usage: ts-node with-events.ts <address|signature|mint>');
    process.exit(1);
  }

  const result = await client.queryAuto(value, true);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
