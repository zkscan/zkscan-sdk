#!/usr/bin/env node
/**
 * Command line interface for zkScan.
 *
 * Commands:
 *   zkscan query [--type wallet|transaction|token] [--no-proofs] "<value>"
 *   zkscan circuits
 *   zkscan benchmark "<value>"
 *   zkscan raw "<value>"
 */

import { ZKScanClient, QueryType } from '../api/client';
import { ZKOperations } from '../crypto/zkOperations';

type Command = 'query' | 'circuits' | 'benchmark' | 'raw';

interface ParsedArgs {
  command: Command;
  type?: QueryType;
  value?: string;
  proofs: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const parsed: ParsedArgs = {
    command: 'query',
    proofs: true
  };

  if (args[0] === 'circuits') {
    parsed.command = 'circuits';
    return parsed;
  }

  if (args[0] === 'benchmark') {
    parsed.command = 'benchmark';
    parsed.value = args[1];
    return parsed;
  }

  if (args[0] === 'raw') {
    parsed.command = 'raw';
    parsed.value = args[1];
    return parsed;
  }

  parsed.command = 'query';

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--type' && args[i + 1]) {
      parsed.type = args[i + 1] as QueryType;
      i += 1;
    } else if (arg === '--no-proofs') {
      parsed.proofs = false;
    } else if (!parsed.value) {
      parsed.value = arg;
    }
  }

  return parsed;
}

async function runQuery(parsed: ParsedArgs): Promise<void> {
  const apiUrl = process.env.ZKSCAN_API_URL || 'https://zkscan.app/api';
  const apiKey = process.env.ZKSCAN_API_KEY;

  if (!apiKey) {
    console.error('Missing ZKSCAN_API_KEY environment variable');
    process.exit(1);
  }

  if (!parsed.value) {
    console.error('Usage: zkscan query [--type wallet|transaction|token] [--no-proofs] "<address | signature | mint>"');
    process.exit(1);
  }

  const client = new ZKScanClient({
    apiUrl,
    apiKey
  });

  const result = parsed.type
    ? await client.query(parsed.type, parsed.value, parsed.proofs)
    : await client.queryAuto(parsed.value, parsed.proofs);

  console.log(JSON.stringify(result, null, 2));
}

async function runCircuits(): Promise<void> {
  const circuits = ZKOperations.getAvailableCircuits
    ? ZKOperations.getAvailableCircuits()
    : [];
  console.log(JSON.stringify(circuits, null, 2));
}

async function runBenchmark(parsed: ParsedArgs): Promise<void> {
  if (!parsed.value) {
    console.error('Usage: zkscan benchmark "<address | signature | mint>"');
    process.exit(1);
  }

  const stats = await ZKOperations.benchmarkQueryProof(parsed.value);
  console.log(JSON.stringify(stats, null, 2));
}

async function runRaw(parsed: ParsedArgs): Promise<void> {
  const apiUrl = process.env.ZKSCAN_API_URL || 'https://zkscan.app/api';
  const apiKey = process.env.ZKSCAN_API_KEY;

  if (!apiKey) {
    console.error('Missing ZKSCAN_API_KEY environment variable');
    process.exit(1);
  }

  if (!parsed.value) {
    console.error('Usage: zkscan raw "<address | signature | mint>"');
    process.exit(1);
  }

  const client = new ZKScanClient({
    apiUrl,
    apiKey,
    enableProofs: false,
    proofPolicy: 'none'
  });

  const result = await client.queryAuto(parsed.value, false);
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  try {
    switch (parsed.command) {
      case 'circuits':
        await runCircuits();
        break;
      case 'benchmark':
        await runBenchmark(parsed);
        break;
      case 'raw':
        await runRaw(parsed);
        break;
      case 'query':
      default:
        await runQuery(parsed);
    }
  } catch (error: any) {
    console.error('Command failed:', error?.message ?? String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
