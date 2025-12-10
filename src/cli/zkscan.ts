#!/usr/bin/env node
/**
 * Command line interface for zkScan.
 *
 * Supports automatic query detection, explicit query types and an option
 * to disable proof generation for debugging or rapid iteration.
 */

import { ZKScanClient, QueryType } from '../api/client';

interface ParsedArgs {
  type?: QueryType;
  value?: string;
  proofs: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const parsed: ParsedArgs = {
    proofs: true
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--type' && args[i + 1]) {
      const t = args[i + 1] as QueryType;
      parsed.type = t;
      i += 1;
    } else if (arg === '--no-proofs') {
      parsed.proofs = false;
    } else if (!parsed.value) {
      parsed.value = arg;
    }
  }

  return parsed;
}

async function main(): Promise<void> {
  const apiUrl = process.env.ZKSCAN_API_URL || 'https://zkscan.app/api';
  const apiKey = process.env.ZKSCAN_API_KEY;

  if (!apiKey) {
    console.error('Missing ZKSCAN_API_KEY environment variable');
    process.exit(1);
  }

  const parsed = parseArgs(process.argv);

  if (!parsed.value) {
    console.error('Usage: zkscan [--type wallet|transaction|token] [--no-proofs] "<address | signature | mint>"');
    process.exit(1);
  }

  const client = new ZKScanClient({
    apiUrl,
    apiKey
  });

  try {
    const result = parsed.type
      ? await client.query(parsed.type, parsed.value, parsed.proofs)
      : await client.queryAuto(parsed.value, parsed.proofs);

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
