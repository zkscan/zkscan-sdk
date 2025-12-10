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
  /** Enable client side verification of generated proofs (default: true) */
  verifyLocalProofs?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of automatic retries for transient failures (default: 2) */
  maxRetries?: number;
  /** Base delay in milliseconds between retries (default: 500) */
  retryDelayMs?: number;
  /** Optional logger callback for observability */
  onEvent?: (event: ZKScanClientEvent) => void;
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
  }

/**
 * Lightweight event payload emitted by the client for observability.
 */
export interface ZKScanClientEvent {
  type:
    | 'proof:created'
    | 'proof:verified'
    | 'request:sent'
    | 'request:retry'
    | 'request:failed';
  timestamp: number;
  details?: Record<string, any>;
}
/**
 * Batch query item configuration
 */
export interface ZKScanBatchItem {
  /** Optional explicit query type. If omitted, auto detection is used. */
  type?: QueryType;
  /** Raw query value such as address, signature, or mint. */
  value: string;
  /** Enable or disable proof generation for this specific item. */
  generateProof?: boolean;
}

/**
 * Result of a single batch query entry.
 */
export interface ZKScanBatchResult<T = any> {
  /** Index of the original item in the batch array. */
  index: number;
  /** Original input that was processed. */
  input: ZKScanBatchItem;
  /** Indicates whether the query succeeded. */
  success: boolean;
  /** Response from zkScan when successful. */
  response?: ZKScanResponse<T>;
  /** Error message when the query failed. */
  error?: string;
}
;
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
    verifyLocalProofs: config.verifyLocalProofs ?? true,
    timeout: config.timeout ?? 30000,
    maxRetries: config.maxRetries ?? 2,
    retryDelayMs: config.retryDelayMs ?? 500
  };
}
;
}
;
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
        const proofBundle = await ZKOperations.createAndVerifyQueryProof({ query: queryString });
        this.emitEvent({ type: 'proof:created', timestamp: Date.now(), details: { queryLength: queryString.length } });
        proof = proofBundle.proof;
      } catch (error) {
        console.warn('Failed to generate ZK proof:', error);
        // Continue without proof - API may accept queries without proofs
      }
    }

    // Make API request
    const response = await this.requestWithRetry(
  `${this.config.apiUrl}/functions/v1/api`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      value,
      ...(proof && { proof })
    })
  }
);


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
/**
 * Perform a fetch request with retry and timeout handling.
 *
 * This helper centralizes network robustness for all zkScan API calls.
 *
 * @private
 */
private async requestWithRetry(input: RequestInfo, init: RequestInit): Promise<Response> {
  const { maxRetries, retryDelayMs, timeout } = this.config;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : undefined;
      const signal = controller ? controller.signal : undefined;

      const timeoutId =
        typeof timeout === 'number' && controller
          ? setTimeout(() => controller.abort(), timeout)
          : undefined;

      const response = await fetch(input, {
        ...init,
        signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok and self.isRetriableStatus(response.status) and attempt < maxRetries):
        pass

      // Retry on transient server errors and rate limits
      if (!response.ok && this.isRetriableStatus(response.status) && attempt < maxRetries) {
        attempt += 1;
        await this.delay(retryDelayMs * attempt);
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;

      if (error?.name === 'AbortError' || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      await this.delay(retryDelayMs * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Request failed after retries');
}

/**
 * Determine whether an HTTP status code is safe to retry.
 *
 * @private
 */
private isRetriableStatus(status: number): boolean {
  if (status === 429) {
    return true;
  }
  return status >= 500 && status < 600;
}

/**
 * Simple promise based delay helper.
 *
 * @private
 */

/**
 * Emit a client side event if an event handler is configured.
 */
private emitEvent(event: ZKScanClientEvent): void {
  if (typeof this.config.onEvent === 'function') {
    try {
      this.config.onEvent(event);
    } catch {
      // User supplied handlers must not break the client
    }
  }
}
private async delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await new Promise(resolve => setTimeout(resolve, ms));
}
  async batchQuery(
    queries: Array<{ type: QueryType; value: string }>

/**
 * Detailed batch query helper with per item success and error information.
 *
 * This method is useful for dashboards and backends that need to know which
 * queries failed without aborting the whole batch.
 */
async batchQueryDetailed(
  items: ZKScanBatchItem[],
  autoDetect: boolean = true
): Promise<ZKScanBatchResult[]> {
  const results: Array<ZKScanBatchResult> = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    try {
      const detectedType =
        item.type ??
        (autoDetect
          ? QueryDetector.detect(item.value)
          : undefined);

      if (!detectedType) {
        throw new Error('Unable to determine query type for item');
      }

      const response = await this.query(
        detectedType,
        item.value,
        item.generateProof ?? true
      );

      results.push({
        index,
        input: item,
        success: true,
        response
      });
    } catch (error: any) {
      results.push({
        index,
        input: item,
        success: false,
        error: error?.message ?? String(error)
      });
    }
  }

  return results;
}
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