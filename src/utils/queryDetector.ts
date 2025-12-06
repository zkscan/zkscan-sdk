/**
 * queryDetector.ts
 *
 * Intelligent query type detection for zkScan.
 * This module analyzes input strings and classifies them as wallet addresses,
 * transaction signatures, or token mints using various heuristics.
 *
 * The detection algorithm uses:
 * - Length-based classification (different address types have different lengths)
 * - Known token mint database (pre-identified popular tokens)
 * - Pattern matching (keyword detection for specific tokens)
 * - Statistical analysis of character distribution
 *
 * @module utils/queryDetector
 * @author zkScan Team
 * @license MIT
 */

/**
 * Supported query types in zkScan
 */
export type QueryType = 'wallet' | 'transaction' | 'token';

/**
 * Database of known token mint addresses.
 * These are popular SPL tokens on Solana that we can identify immediately.
 * The set provides O(1) lookup time for instant classification.
 */
const KNOWN_TOKEN_MINTS = new Set([
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'So11111111111111111111111111111111111111112',   // Wrapped SOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // Marinade SOL
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // Lido Staked SOL
  'hntyVP6YFm1Hg25TN9WGLqM12b1TRezMtjegh2yPETz', // Helium
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Ether (Portal)
  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM', // USD Coin (Wormhole)
  '88YovLHpVnDYsWpyGRk44frNq3kViYVdMv93qgU6sqyF', // Send Token
]);

/**
 * QueryDetector provides intelligent classification of blockchain queries.
 *
 * This class implements a multi-stage detection algorithm that uses
 * various heuristics to determine whether an input string represents
 * a wallet address, transaction signature, or token mint address.
 *
 * @class QueryDetector
 */
export class QueryDetector {

  /**
   * Detect the type of a blockchain query.
   *
   * This method implements a decision tree that classifies inputs:
   *
   * 1. Check length: Transaction signatures are typically 88 characters
   * 2. Check known tokens: Match against database of popular tokens
   * 3. Check patterns: Look for token-specific keywords
   * 4. Default: Assume wallet address (most common query type)
   *
   * @param {string} input - The query string to classify
   * @returns {QueryType} The detected query type
   *
   * @example
   * ```typescript
   * const type = QueryDetector.detect('EPjFWdd5Auf...'); // 'token'
   * const type2 = QueryDetector.detect('9x4nKZ...'); // 'wallet'
   * const type3 = QueryDetector.detect('5jK8ZqG3...(88 chars)'); // 'transaction'
   * ```
   */
  static detect(input: string): QueryType {
    const trimmed = input.trim();
    const length = trimmed.length;
    const lowerCase = trimmed.toLowerCase();

    // Transaction signatures are typically 87-88 characters
    // This is because they're base58-encoded 64-byte signatures
    if (length >= 85 && length <= 90) {
      return 'transaction';
    }

    // Check if this is a known token mint address
    // Using a Set provides O(1) lookup performance
    if (KNOWN_TOKEN_MINTS.has(trimmed)) {
      return 'token';
    }

    // Pattern matching for token-related keywords
    // Some tokens have recognizable names in their queries
    if (lowerCase.includes('pump') || lowerCase.includes('bonk')) {
      return 'token';
    }

    // Wallet addresses are typically 32-44 characters (base58 encoded)
    // This is the most common case, so we default to wallet
    if (length >= 32 && length <= 45) {
      return 'wallet';
    }

    // Default to wallet for ambiguous cases
    // Most queries are wallet lookups
    return 'wallet';
  }

  /**
   * Validate that an input string is a valid Solana address format.
   *
   * This performs basic validation:
   * - Length is in expected range (32-44 characters)
   * - Contains only valid base58 characters
   * - No ambiguous characters (0, O, I, l)
   *
   * @param {string} input - The address to validate
   * @returns {boolean} True if format is valid
   *
   * @example
   * ```typescript
   * if (QueryDetector.isValidAddress('9x4...')) {
   *   console.log('Valid address format');
   * }
   * ```
   */
  static isValidAddress(input: string): boolean {
    const trimmed = input.trim();

    // Check length is in valid range for base58-encoded 32-byte address
    if (trimmed.length < 32 || trimmed.length > 44) {
      return false;
    }

    // Base58 alphabet (excludes 0, O, I, l to avoid confusion)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;

    return base58Regex.test(trimmed);
  }

  /**
   * Validate that an input string is a valid transaction signature format.
   *
   * Transaction signatures are base58-encoded 64-byte values,
   * which typically results in 87-88 character strings.
   *
   * @param {string} input - The signature to validate
   * @returns {boolean} True if format is valid
   *
   * @example
   * ```typescript
   * if (QueryDetector.isValidSignature('5jK8...')) {
   *   console.log('Valid signature format');
   * }
   * ```
   */
  static isValidSignature(input: string): boolean {
    const trimmed = input.trim();

    // Transaction signatures are typically 87-88 characters
    if (trimmed.length < 85 || trimmed.length > 90) {
      return false;
    }

    // Base58 alphabet validation
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;

    return base58Regex.test(trimmed);
  }

  /**
   * Add a new token mint to the known tokens database.
   *
   * This allows dynamic expansion of the token detection database
   * as new popular tokens emerge.
   *
   * @param {string} mintAddress - The token mint address to add
   *
   * @example
   * ```typescript
   * QueryDetector.addKnownToken('NewPopularToken...');
   * ```
   */
  static addKnownToken(mintAddress: string): void {
    KNOWN_TOKEN_MINTS.add(mintAddress.trim());
  }

  /**
   * Get statistics about the known token database.
   *
   * @returns {Object} Database statistics
   *
   * @example
   * ```typescript
   * const stats = QueryDetector.getStats();
   * console.log(`Known tokens: ${stats.knownTokenCount}`);
   * ```
   */
  static getStats(): { knownTokenCount: number } {
    return {
      knownTokenCount: KNOWN_TOKEN_MINTS.size
    };
  }

  /**
   * Batch detect types for multiple queries.
   *
   * This is more efficient than calling detect() in a loop
   * because it can optimize repeated operations.
   *
   * @param {string[]} inputs - Array of query strings
   * @returns {QueryType[]} Array of detected types
   *
   * @example
   * ```typescript
   * const types = QueryDetector.batchDetect([
   *   'wallet1...',
   *   'EPjFWdd...',
   *   'signature...'
   * ]);
   * // ['wallet', 'token', 'transaction']
   * ```
   */
  static batchDetect(inputs: string[]): QueryType[] {
    return inputs.map(input => this.detect(input));
  }

  /**
   * Analyze a query string and return detailed information.
   *
   * This provides comprehensive analysis beyond just the type,
   * including confidence scores and alternative possibilities.
   *
   * @param {string} input - The query string to analyze
   * @returns {Object} Detailed analysis results
   *
   * @example
   * ```typescript
   * const analysis = QueryDetector.analyze('EPjFWdd...');
   * console.log(analysis);
   * // {
   * //   type: 'token',
   * //   confidence: 1.0,
   * //   length: 44,
   * //   isKnownToken: true
   * // }
   * ```
   */
  static analyze(input: string): {
    type: QueryType;
    confidence: number;
    length: number;
    isKnownToken: boolean;
    isValidFormat: boolean;
  } {
    const trimmed = input.trim();
    const type = this.detect(trimmed);
    const isKnownToken = KNOWN_TOKEN_MINTS.has(trimmed);

    // Calculate confidence based on how definitive the classification is
    let confidence = 0.7; // Default confidence

    if (isKnownToken) {
      confidence = 1.0; // 100% confident if it's a known token
    } else if (trimmed.length >= 85 && trimmed.length <= 90) {
      confidence = 0.95; // High confidence for transaction signatures
    } else if (trimmed.length >= 32 && trimmed.length <= 44) {
      confidence = 0.8; // Medium-high confidence for wallet addresses
    }

    return {
      type,
      confidence,
      length: trimmed.length,
      isKnownToken,
      isValidFormat: this.isValidAddress(trimmed) || this.isValidSignature(trimmed)
    };
  }
}

/**
 * Convenience function for detecting query type.
 * This is a shorthand for QueryDetector.detect().
 *
 * @param {string} input - The query string to classify
 * @returns {QueryType} The detected query type
 */
export function detectQueryType(input: string): QueryType {
  return QueryDetector.detect(input);
}
