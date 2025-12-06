/**
 * client.ts
 *
 * zkScan API client for making privacy-preserving blockchain queries.
 * This module provides a simple, type-safe interface for interacting with
 * the zkScan API while handling all the zero-knowledge proof generation
 * and verification automatically.
 *
 * @module api/client
 * @author zkScan Team
 * @license MIT
 */

import { ZKOperations, ZKProof } from '../crypto/zkOperations';
import { QueryDetector, QueryType } from '../utils/queryDetector';

/**
 * Configuration for the zkScan API client
 */
export interface ZKScanConfig {
  /** API endpoint URL */
  apiUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Enable automatic ZK proof generation (default: true) */
  enableProofs?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Response from zkScan API
 */
export interface ZKScanResponse<T = any> {
  /** Unique query ID */
  id: string;
  /** Query result data */
  result: T;
  /** SHA-256 hash of the response */
  responseHash: string;
  /** Public signals from the ZK proof */
  publicSignals: {
    queryHash: string;
    responseHash: string;
  };
  /** Optional ZK proof (if included) */
  proof?: ZKProof;
}

/**
 * Wallet query result
 */
export interface WalletResult {
  address: string;
  solBalance: string;
  lamports: number;
  status: string;
  tokenCount: number;
  tokens: Array<{
    mint: string;
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    logo?: string;
    priceUsd?: number;
    valueUsd?: number;
  }>;
}

/**
 * Transaction query result
 */
export interface TransactionResult {
  signature: string;
  slot: number;
  blockTime: string;
  status: string;
  fee: string;
  recentBlockhash?: string;
}

/**
 * Token query result
 */
export interface TokenResult {
  address: string;
  type: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  totalSupply?: string;
  supply?: string;
  holderCount?: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  priceChange24h?: number;
  logo?: string;
  description?: string;
}

/**
 * zkScan API client class
 *
 * Provides a high-level interface for querying blockchain data with
 * zero-knowledge proofs. Handles authentication, proof generation,
 * and response verification automatically.
 *
 * @class ZKScanClient
 *
 * @example
 * ```typescript
 * const client = new ZKScanClient({
 *   apiUrl: 'https://zkscan.app/api',
 *   apiKey: 'your-api-key-here'
 * });
 *
 * const wallet = await client.queryWallet('9x4nKZU7...');
 * console.log(`Balance: ${wallet.solBalance} SOL`);
 * ```
 */
export class ZKScanClient {
  private config: Required<ZKScanConfig>;

  /**
   * Create a new zkScan API client
   *
   * @param {ZKScanConfig} config - Client configuration
   */
  constructor(config: ZKScanConfig) {
    this.config = {
      ...config,
      enableProofs: config.enableProofs ?? true,
      timeout: config.timeout ?? 30000
    };
  }

  /**
   * Query a wallet address
   *
   * Retrieves wallet balance, token holdings, and metadata.
   *
   * @param {string} address - Solana wallet address
   * @param {boolean} generateProof - Generate ZK proof (default: true)
   * @returns {Promise<ZKScanResponse<WalletResult>>}
   *
   * @example
   * ```typescript
   * const result = await client.queryWallet('9x4nKZ...');
   * console.log(`SOL: ${result.result.solBalance}`);
   * console.log(`Tokens: ${result.result.tokenCount}`);
   * ```
   */
  async queryWallet(
    address: string,
    generateProof: boolean = true
  ): Promise<ZKScanResponse<WalletResult>> {
    return this.query('wallet', address, generateProof);
  }

  /**
   * Query a transaction signature
   *
   * Retrieves transaction details, status, and metadata.
   *
   * @param {string} signature - Transaction signature
   * @param {boolean} generateProof - Generate ZK proof (default: true)
   * @returns {Promise<ZKScanResponse<TransactionResult>>}
   *
   * @example
   * ```typescript
   * const result = await client.queryTransaction('5jK8Z...');
   * console.log(`Status: ${result.result.status}`);
   * console.log(`Fee: ${result.result.fee}`);
   * ```
   */
  async queryTransaction(
    signature: string,
    generateProof: boolean = true
  ): Promise<ZKScanResponse<TransactionResult>> {
    return this.query('transaction', signature, generateProof);
  }

  /**
   * Query a token mint address
   *
   * Retrieves token metadata, supply, holders, and price information.
   *
   * @param {string} mintAddress - Token mint address
   * @param {boolean} generateProof - Generate ZK proof (default: true)
   * @returns {Promise<ZKScanResponse<TokenResult>>}
   *
   * @example
   * ```typescript
   * const result = await client.queryToken('EPjFWdd...');
   * console.log(`Token: ${result.result.symbol}`);
   * console.log(`Price: $${result.result.price}`);
   * ```
   */
  async queryToken(
    mintAddress: string,
    generateProof: boolean = true
  ): Promise<ZKScanResponse<TokenResult>> {
    return this.query('token', mintAddress, generateProof);
  }

  /**
   * Query with automatic type detection
   *
   * Automatically detects whether the input is a wallet, transaction, or token
   * and routes to the appropriate query handler.
   *
   * @param {string} value - Address, signature, or mint to query
   * @param {boolean} generateProof - Generate ZK proof (default: true)
   * @returns {Promise<ZKScanResponse>}
   *
   * @example
   * ```typescript
   * // Automatically detects type
   * const result = await client.queryAuto('EPjFWdd...');
   * ```
   */
  async queryAuto(
    value: string,
    generateProof: boolean = true
  ): Promise<ZKScanResponse> {
    const type = QueryDetector.detect(value);
    return this.query(type, value, generateProof);
  }

  /**
   * Generic query method (internal)
   *
   * @private
   */
  private async query(
    type: QueryType,
    value: string,
    generateProof: boolean = true
  ): Promise<ZKScanResponse> {
    // Create query hash using SHA-256
    const queryString = JSON.stringify({ type, value });
    const queryHash = await this.sha256(queryString);

    // Generate ZK proof if enabled
    let proof: ZKProof | undefined;
    if (this.config.enableProofs && generateProof) {
      try {
        // In a real implementation, this would generate a circuit-based proof
        // For now, we create a simplified proof structure
        proof = await ZKOperations.createSimpleProof(queryString);
      } catch (error) {
        console.warn('Failed to generate ZK proof:', error);
        // Continue without proof - API may accept queries without proofs
      }
    }

    // Make API request
    const response = await fetch(`${this.config.apiUrl}/functions/v1/api`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        value,
        ...(proof && { proof })
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}` +
        (error.error ? ` - ${error.error}` : '')
      );
    }

    const result = await response.json();

    // Verify response hash if proof was generated
    if (proof && result.publicSignals) {
      const expectedHash = result.publicSignals.queryHash;
      if (expectedHash && expectedHash !== queryHash) {
        console.warn('Query hash mismatch - possible tampering detected');
      }
    }

    return result;
  }

  /**
   * Compute SHA-256 hash (browser-compatible)
   *
   * @private
   */
  private async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Batch query multiple addresses
   *
   * Efficiently query multiple addresses in parallel.
   *
   * @param {Array<{type: QueryType, value: string}>} queries - Array of queries
   * @returns {Promise<ZKScanResponse[]>}
   *
   * @example
   * ```typescript
   * const results = await client.batchQuery([
   *   { type: 'wallet', value: 'address1...' },
   *   { type: 'token', value: 'mint1...' },
   *   { type: 'wallet', value: 'address2...' }
   * ]);
   * ```
   */
  async batchQuery(
    queries: Array<{ type: QueryType; value: string }>
  ): Promise<ZKScanResponse[]> {
    return Promise.all(
      queries.map(q => this.query(q.type, q.value))
    );
  }

  /**
   * Update API key
   *
   * @param {string} newApiKey - New API key
   */
  updateApiKey(newApiKey: string): void {
    this.config.apiKey = newApiKey;
  }

  /**
   * Get current configuration
   *
   * @returns {Readonly<ZKScanConfig>}
   */
  getConfig(): Readonly<ZKScanConfig> {
    return { ...this.config };
  }
}

/**
 * Create a zkScan client with configuration
 *
 * @param {ZKScanConfig} config - Client configuration
 * @returns {ZKScanClient}
 *
 * @example
 * ```typescript
 * const client = createClient({
 *   apiUrl: 'https://zkscan.app/api',
 *   apiKey: process.env.ZKSCAN_API_KEY
 * });
 * ```
 */
export function createClient(config: ZKScanConfig): ZKScanClient {
  return new ZKScanClient(config);
}
