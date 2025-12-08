#!/usr/bin/env node
/**
 * Simple command line interface for zkScan.
 */

import { ZKScanClient } from '../api/client';

async function main(): Promise<void> {
  const apiUrl = process.env.ZKSCAN_API_URL || 'https://zkscan.app/api';
  const apiKey = process.env.ZKSCAN_API_KEY;

  if (!apiKey) {
    console.error('Missing ZKSCAN_API_KEY environment variable');
    process.exit(1);
  }

  const client = new ZKScanClient({
    apiUrl,
    apiKey
  });

  const input = process.argv[2];

  if (!input) {
    console.error('Usage: zkscan "<address | signature | mint>"');
    process.exit(1);
  }

  try {
    const result = await client.queryAuto(input, true);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Query failed:', error?.message ?? String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
