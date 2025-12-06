/**
 * basic-usage.ts
 *
 * Basic examples of using zkScan for privacy-preserving blockchain queries.
 *
 * This file demonstrates the fundamental operations:
 * - Creating a client
 * - Querying wallets
 * - Querying tokens
 * - Querying transactions
 * - Generating and verifying ZK proofs
 *
 * @author zkScan Team
 * @license MIT
 */

import { ZKScanClient } from '../src/api/client';
import { ZKOperations } from '../src/crypto/zkOperations';

/**
 * Example 1: Basic Wallet Query
 *
 * Query a wallet address to get balance and token holdings.
 */
async function example1_BasicWalletQuery() {
  console.log('\n=== Example 1: Basic Wallet Query ===\n');

  // Create a zkScan client
  const client = new ZKScanClient({
    apiUrl: 'https://zkscan.app/api',
    apiKey: 'your-api-key-here'
  });

  // Query a wallet (example: Solana Foundation wallet)
  const walletAddress = '9x4nKZU7vHxMYzZ4Kb3h9xZ8YqPE2LVFPMJb3xFQaZ5K';

  try {
    const result = await client.queryWallet(walletAddress);

    console.log('Wallet Address:', result.result.address);
    console.log('SOL Balance:', result.result.solBalance, 'SOL');
    console.log('Token Count:', result.result.tokenCount);
    console.log('\nTop Tokens:');

    result.result.tokens.slice(0, 5).forEach(token => {
      console.log(`  ${token.symbol}: ${token.balance}`);
      if (token.valueUsd) {
        console.log(`    Value: $${token.valueUsd.toFixed(2)}`);
      }
    });

    console.log('\nResponse Hash:', result.responseHash);
    console.log('Query ID:', result.id);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

/**
 * Example 2: Token Query with Price Data
 *
 * Query a token to get metadata, supply, and market data.
 */
async function example2_TokenQuery() {
  console.log('\n=== Example 2: Token Query ===\n');

  const client = new ZKScanClient({
    apiUrl: 'https://zkscan.app/api',
    apiKey: 'your-api-key-here'
  });

  // Query USDC token
  const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  try {
    const result = await client.queryToken(usdcMint);

    console.log('Token:', result.result.name);
    console.log('Symbol:', result.result.symbol);
    console.log('Decimals:', result.result.decimals);
    console.log('Total Supply:', result.result.totalSupply);
    console.log('Holder Count:', result.result.holderCount);

    if (result.result.price) {
      console.log('\nMarket Data:');
      console.log('  Price: $' + result.result.price);
      console.log('  Market Cap: $' + result.result.marketCap?.toLocaleString());
      console.log('  24h Volume: $' + result.result.volume24h?.toLocaleString());
      console.log('  24h Change: ' + result.result.priceChange24h + '%');
    }
  } catch (error) {
    console.error('Query failed:', error);
  }
}

/**
 * Example 3: Transaction Query
 *
 * Query a transaction to get details and status.
 */
async function example3_TransactionQuery() {
  console.log('\n=== Example 3: Transaction Query ===\n');

  const client = new ZKScanClient({
    apiUrl: 'https://zkscan.app/api',
    apiKey: 'your-api-key-here'
  });

  // Example transaction signature
  const signature = '5jK8ZqG3tYpXqvZ8h2MzPvH6X9Y3yQ2KhRbBnWxzN5L4vC3mTx7nJ8kP9wY2zF6qL';

  try {
    const result = await client.queryTransaction(signature);

    console.log('Signature:', result.result.signature);
    console.log('Status:', result.result.status);
    console.log('Slot:', result.result.slot);
    console.log('Block Time:', result.result.blockTime);
    console.log('Fee:', result.result.fee);
  } catch (error) {
    console.error('Query failed:', error);
  }
}

/**
 * Example 4: Auto-Detect Query Type
 *
 * Let zkScan automatically detect what type of query you're making.
 */
async function example4_AutoDetect() {
  console.log('\n=== Example 4: Auto-Detect Query Type ===\n');

  const client = new ZKScanClient({
    apiUrl: 'https://zkscan.app/api',
    apiKey: 'your-api-key-here'
  });

  // Try different types of inputs
  const inputs = [
    '9x4nKZU7vHxMYzZ4Kb3h9xZ8YqPE2LVFPMJb3xFQaZ5K', // Wallet
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Token
  ];

  for (const input of inputs) {
    try {
      console.log(`\nQuerying: ${input.substring(0, 20)}...`);
      const result = await client.queryAuto(input);
      console.log('Detected type:', result.result.address ? 'Address' : 'Token');
      console.log('Success!');
    } catch (error) {
      console.error('Failed:', error);
    }
  }
}

/**
 * Example 5: Zero-Knowledge Proof Generation
 *
 * Generate and verify ZK proofs for queries.
 */
async function example5_ZKProofs() {
  console.log('\n=== Example 5: Zero-Knowledge Proofs ===\n');

  // Example query value
  const queryValue = 'mySecretQuery123';

  // Generate a Poseidon hash
  console.log('Generating Poseidon hash...');
  const hash = await ZKOperations.poseidonHash([queryValue]);
  console.log('Hash:', hash);

  // Create a Pedersen commitment
  console.log('\nCreating Pedersen commitment...');
  const randomness = ZKOperations.generateRandomScalar();
  const commitment = await ZKOperations.createPedersenCommitment(
    queryValue,
    randomness
  );
  console.log('Commitment:', commitment);
  console.log('(This hides the query value but proves we committed to it)');

  // Create a range proof
  console.log('\nCreating range proof...');
  const value = 50;
  const rangeProof = await ZKOperations.createRangeProof(value, 0, 100);
  console.log('Range proof generated!');
  console.log('Proves that value is between 0 and 100 without revealing it');

  // Verify the proof
  console.log('\nVerifying proof...');
  const isValid = await ZKOperations.verifyProof(rangeProof);
  console.log('Proof valid:', isValid);
}

/**
 * Example 6: Batch Queries
 *
 * Query multiple addresses efficiently.
 */
async function example6_BatchQueries() {
  console.log('\n=== Example 6: Batch Queries ===\n');

  const client = new ZKScanClient({
    apiUrl: 'https://zkscan.app/api',
    apiKey: 'your-api-key-here'
  });

  const queries = [
    { type: 'wallet' as const, value: '9x4nKZU...' },
    { type: 'token' as const, value: 'EPjFWdd...' },
    { type: 'wallet' as const, value: '8x3mKY...' }
  ];

  try {
    console.log(`Querying ${queries.length} addresses in parallel...`);
    const results = await client.batchQuery(queries);

    results.forEach((result, index) => {
      console.log(`\nQuery ${index + 1}:`);
      console.log('  Type:', queries[index].type);
      console.log('  ID:', result.id);
      console.log('  Status: Success');
    });
  } catch (error) {
    console.error('Batch query failed:', error);
  }
}

/**
 * Example 7: Privacy-Preserving Merkle Proofs
 *
 * Use Merkle trees to prove data membership without revealing the data.
 */
async function example7_MerkleProofs() {
  console.log('\n=== Example 7: Merkle Proofs ===\n');

  // Create a Merkle tree of query results
  const leafData = 'myQueryResult';
  const siblings = ['sibling1', 'sibling2', 'sibling3'];

  console.log('Generating Merkle proof...');
  const proof = await ZKOperations.generateMerkleProof(leafData, siblings);
  console.log('Proof path:', proof);

  // Verify the proof
  const root = proof[proof.length - 1];
  console.log('\nVerifying Merkle proof...');
  const isValid = await ZKOperations.verifyMerkleProof(leafData, root, siblings);
  console.log('Proof valid:', isValid);
  console.log('(This proves the query result is part of a committed dataset)');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   zkScan Basic Usage Examples         ║');
  console.log('╚════════════════════════════════════════╝');

  await example1_BasicWalletQuery();
  await example2_TokenQuery();
  await example3_TransactionQuery();
  await example4_AutoDetect();
  await example5_ZKProofs();
  await example6_BatchQueries();
  await example7_MerkleProofs();

  console.log('\n✅ All examples completed!\n');
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_BasicWalletQuery,
  example2_TokenQuery,
  example3_TransactionQuery,
  example4_AutoDetect,
  example5_ZKProofs,
  example6_BatchQueries,
  example7_MerkleProofs
};
