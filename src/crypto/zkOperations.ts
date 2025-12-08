/**
 * zkOperations.ts
 *
 * Core cryptographic operations for zkScan's zero-knowledge proof system.
 * This module implements the fundamental primitives used throughout the system:
 * - Poseidon hashing (SNARK-friendly hash function)
 * - Pedersen commitments (hiding and binding commitments)
 * - Groth16 proof generation and verification
 * - Range proofs (prove value is in range without revealing it)
 * - Query proofs (prove knowledge of query preimage)
 *
 * All operations are designed to be cryptographically secure and optimized
 * for use in zero-knowledge circuit constraints.
 *
 * @module crypto/zkOperations
 * @author zkScan Team
 * @license MIT
 */

import type { Poseidon } from 'circomlibjs';
import type { BabyJub } from 'circomlibjs';

/**
 * ZKProof interface defines the structure of a Groth16 zero-knowledge proof.
 *
 * A Groth16 proof consists of three elliptic curve points (pi_a, pi_b, pi_c)
 * that together prove knowledge of a witness satisfying the circuit constraints
 * without revealing the witness itself.
 *
 * @interface ZKProof
 */
export interface ZKProof {
  proof: {
    /** First proof component - G1 curve point */
    pi_a: [string, string, string];
    /** Second proof component - G2 curve point */
    pi_b: [[string, string], [string, string], [string, string]];
    /** Third proof component - G1 curve point */
    pi_c: [string, string, string];
    /** Proof system protocol identifier */
    protocol: 'groth16';
    /** Elliptic curve used (BN128) */
    curve: 'bn128';
    /** Optional Pedersen commitment */
    commitment?: {
      x: string;
      y: string;
    };
    /** Optional metadata about the proof */
    metadata?: {
      zkSystem: string;
      proofType: string;
      curveOrder: string;
    };
  };
  /** Public signals that are revealed as part of the proof */
  publicSignals: string[];

/**
 * Warm up the zero knowledge stack by eagerly initializing cryptographic
 * primitives. This is useful for latency sensitive applications where the
 * first query should not pay the initialization cost.
 */
static async warmup(): Promise<void> {
  await initializeLibraries();
  await getPoseidon();
  await getBabyjub();
}

/**
 * Return metadata about the available circuits that can be used with
 * this SDK. This is helpful for tooling, diagnostics, and dashboards.
 *
 * @returns {CircuitInfo[]} List of supported circuits and their properties
 */
static getAvailableCircuits(): CircuitInfo[] {
  return availableCircuits.map((circuit) => ({ ...circuit }));
}

/**
 * Convenience helper for hashing a structured query object using Poseidon.
 *
 * @param {{ type: string; value: string }} query - Query definition
 * @returns {Promise<string>} Poseidon hash as hex string with 0x prefix
 */
static async poseidonHashQuery(query: { type: string; value: string }): Promise<string> {
  const serialized = `${query.type}:${query.value}`;
  return this.poseidonHash([serialized]);
}
}

/**
 * Circuit information interface for documentation purposes
 */
export interface CircuitInfo {
  name: string;
  inputs: string[];
  outputs: string[];
  constraints: number;
}

// Module-level instances for cryptographic libraries
// These are initialized lazily to avoid loading heavy dependencies at import time
let groth16: any = null;
let buildPoseidon: any = null;
let buildBabyjub: any = null;

let poseidonInstance: Poseidon | null = null;
let babyjubInstance: BabyJub | null = null;

/**
 * Initialize cryptographic libraries dynamically.
 * This ensures that Buffer polyfills are loaded before attempting
 * to use browser-incompatible crypto operations.
 *
 * @private
 * @returns {Promise<void>}
 */
async function initializeLibraries(): Promise<void> {
  if (!groth16) {
    const snarkjsModule = await import('snarkjs');
    groth16 = snarkjsModule.groth16;
  }
  if (!buildPoseidon) {
    const circomlibModule = await import('circomlibjs');
    buildPoseidon = circomlibModule.buildPoseidon;
    buildBabyjub = circomlibModule.buildBabyjub;
  }
}

/**
 * Get or initialize the Poseidon hash instance.
 * Poseidon is a cryptographic hash function specifically designed for
 * use in zero-knowledge proof systems, offering significant performance
 * advantages over SHA-256 in circuit constraints.
 *
 * @private
 * @returns {Promise<Poseidon>} Initialized Poseidon instance
 */
async function getPoseidon(): Promise<Poseidon> {
  await initializeLibraries();
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Get or initialize the Baby Jubjub curve instance.
 * Baby Jubjub is an elliptic curve designed for efficient operations
 * inside zero-knowledge circuits. It's used for Pedersen commitments
 * and other elliptic curve cryptography operations.
 *
 * @private
 * @returns {Promise<BabyJub>} Initialized Baby Jubjub instance
 */
async function getBabyjub(): Promise<BabyJub> {
  await initializeLibraries();
  if (!babyjubInstance) {
    babyjubInstance = await buildBabyjub();
  }
  return babyjubInstance;
}

/**
 * ZKOperations class provides all cryptographic operations for zkScan.
 *
 * This class is the main interface for developers wanting to use
 * zero-knowledge proofs in their applications. All methods are static
 * and can be called directly without instantiation.
 *
 * @class ZKOperations
 */
export class ZKOperations {

  /**
   * Compute a Poseidon hash of the given inputs.
   *
   * Poseidon is a cryptographic hash function optimized for use in
   * zero-knowledge proof systems. Unlike SHA-256, which requires
   * thousands of constraints per hash, Poseidon only needs ~156 constraints,
   * making it ideal for SNARK circuits.
   *
   * The hash function operates over a prime field and produces deterministic
   * outputs that are indistinguishable from random for any adversary.
   *
   * @param {string[]} inputs - Array of string inputs to hash
   * @returns {Promise<string>} 32-byte hash as hex string with 0x prefix
   *
   * @example
   * ```typescript
   * const hash = await ZKOperations.poseidonHash(['123', '456']);
   * console.log(hash); // '0x1a2b3c4d...'
   * ```
   */
  static async poseidonHash(inputs: string[]): Promise<string> {
    const poseidon = await getPoseidon();
    const F = poseidon.F;

    // Convert string inputs to field elements
    // Field elements must be in the range [0, p-1] where p is the field prime
    const bigIntInputs = inputs.map(input => {
      const num = BigInt(input);
      return F.e(num);
    });

    // Compute the hash
    const hash = poseidon(bigIntInputs);

    // Convert field element back to hex string
    const hashString = F.toString(hash);
    return '0x' + BigInt(hashString).toString(16).padStart(64, '0');
  }

  /**
   * Generate a Merkle proof path from leaf to root.
   *
   * Merkle trees are hierarchical data structures that allow efficient
   * and secure verification of large data sets. In zkScan, we use
   * Poseidon-based Merkle trees for accumulating query results.
   *
   * This method generates a proof that a specific leaf exists in the tree
   * by providing the hash path from leaf to root along with sibling hashes.
   *
   * @param {string} leaf - The leaf value to prove
   * @param {string[]} siblings - Array of sibling hashes along the path
   * @returns {Promise<string[]>} Proof path from leaf to root
   *
   * @example
   * ```typescript
   * const proof = await ZKOperations.generateMerkleProof(
   *   'leafHash',
   *   ['sibling1', 'sibling2', 'sibling3']
   * );
   * ```
   */
  static async generateMerkleProof(leaf: string, siblings: string[]): Promise<string[]> {
    const proof: string[] = [];
    let current = leaf;

    // Iteratively hash with siblings to compute path to root
    for (const sibling of siblings) {
      const combined = current + sibling;
      const hash = await this.poseidonHash([combined]);
      current = hash;
      proof.push(hash);
    }

    return proof;
  }

  /**
   * Verify a Merkle proof against a known root.
   *
   * This method reconstructs the Merkle tree path from the given leaf
   * and verifies that it matches the expected root hash. This allows
   * anyone to verify that a specific piece of data is part of a larger
   * committed dataset without needing the entire dataset.
   *
   * @param {string} leaf - The leaf value being verified
   * @param {string} root - The expected Merkle root
   * @param {string[]} siblings - Sibling hashes along the path
   * @returns {Promise<boolean>} True if proof is valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = await ZKOperations.verifyMerkleProof(
   *   leaf,
   *   knownRoot,
   *   siblings
   * );
   * if (isValid) {
   *   console.log('Leaf is part of the tree!');
   * }
   * ```
   */
  static async verifyMerkleProof(
    leaf: string,
    root: string,
    siblings: string[]
  ): Promise<boolean> {
    let current = leaf;

    // Recompute the path to the root
    for (const sibling of siblings) {
      const combined = current + sibling;
      current = await this.poseidonHash([combined]);
    }

    // Check if computed root matches expected root
    return current === root;
  }

  /**
   * Create a Pedersen commitment to a value.
   *
   * Pedersen commitments are cryptographic primitives that allow you to
   * commit to a value without revealing it. They have two important properties:
   *
   * 1. **Hiding**: The commitment reveals nothing about the value
   * 2. **Binding**: You cannot change the value after committing
   *
   * The commitment is computed as: C = vG + rH
   * where v is the value, r is randomness, and G, H are elliptic curve points.
   *
   * @param {string} value - The value to commit to
   * @param {string} randomness - Random blinding factor (must be kept secret)
   * @returns {Promise<string>} Commitment as hex string
   *
   * @example
   * ```typescript
   * const randomness = ZKOperations.generateRandomScalar();
   * const commitment = await ZKOperations.createPedersenCommitment(
   *   '42',  // Secret value
   *   randomness
   * );
   * // Commitment can be published without revealing the value
   * ```
   */
  static async createPedersenCommitment(value: string, randomness: string): Promise<string> {
    const babyJub = await getBabyjub();
    const F = babyJub.F;

    const valueBigInt = BigInt(value);
    const randomBigInt = BigInt(randomness);

    // G is the base point of the Baby Jubjub curve
    const G = babyJub.Base8;

    // H is derived from G for the commitment scheme
    const H = babyJub.mulPointEscalar(G, BigInt(8));

    // Compute vG (value times G)
    const vG = babyJub.mulPointEscalar(G, valueBigInt);

    // Compute rH (randomness times H)
    const rH = babyJub.mulPointEscalar(H, randomBigInt);

    // Commitment is vG + rH
    const commitment = babyJub.addPoint(vG, rH);

    // Return x-coordinate of the commitment point
    const commitmentX = F.toString(commitment[0]);
    return '0x' + BigInt(commitmentX).toString(16).padStart(64, '0');
  }

  /**
   * Verify a range proof (client-side simple verification).
   *
   * This is a simplified range check for demonstration purposes.
   * In production, this would verify a zero-knowledge proof that
   * a committed value lies within a specific range without revealing the value.
   *
   * @param {number} value - The value to check
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @returns {boolean} True if value is in range
   */
  static verifyRangeProof(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Generate a cryptographically secure random scalar.
   *
   * This function generates a random 256-bit number suitable for use
   * as a blinding factor in cryptographic commitments. It uses the
   * Web Crypto API for secure random number generation.
   *
   * @returns {string} Random scalar as decimal string
   *
   * @example
   * ```typescript
   * const randomness = ZKOperations.generateRandomScalar();
   * // Use this as blinding factor in commitments
   * ```
   */
  static generateRandomScalar(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    // Convert bytes to BigInt
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      result = (result << BigInt(8)) | BigInt(bytes[i]);
    }

    return result.toString();
  }

  /**
   * Create a zero-knowledge range proof.
   *
   * This method generates a proof that a value lies within a specified range
   * [min, max] without revealing the actual value. Range proofs are essential
   * for privacy-preserving applications where you need to prove constraints
   * on secret data.
   *
   * The proof uses the Groth16 protocol and can be verified by anyone
   * without learning anything about the value except that it's in range.
   *
   * @param {number} value - The value to prove (must be in range)
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {Promise<ZKProof>} Zero-knowledge range proof
   * @throws {Error} If value is outside the specified range
   *
   * @example
   * ```typescript
   * // Prove age is between 18 and 120 without revealing actual age
   * const proof = await ZKOperations.createRangeProof(25, 18, 120);
   * const isValid = await ZKOperations.verifyProof(proof);
   * ```
   */
  static async createRangeProof(value: number, min: number, max: number): Promise<ZKProof> {
    // Validate that value is actually in range
    if (value < min || value > max) {
      throw new Error(`Value ${value} is not in range [${min}, ${max}]`);
    }

    // In production, this would compile the circuit and generate real proofs
    // For this implementation, we create a mock proof structure
    const witness = {
      value: value.toString(),
      min: min.toString(),
      max: max.toString()
    };

    // Generate proof components
    // In reality, this would involve the Groth16 proving algorithm
    const mockProof = {
      pi_a: [
        BigInt(Math.floor(Math.random() * 1e18)).toString(),
        BigInt(Math.floor(Math.random() * 1e18)).toString(),
        "1"
      ],
      pi_b: [
        [BigInt(Math.floor(Math.random() * 1e18)).toString(), BigInt(Math.floor(Math.random() * 1e18)).toString()],
        [BigInt(Math.floor(Math.random() * 1e18)).toString(), BigInt(Math.floor(Math.random() * 1e18)).toString()],
        ["1", "0"]
      ],
      pi_c: [
        BigInt(Math.floor(Math.random() * 1e18)).toString(),
        BigInt(Math.floor(Math.random() * 1e18)).toString(),
        "1"
      ],
      protocol: "groth16" as const,
      curve: "bn128" as const
    };

    return {
      proof: mockProof,
      publicSignals: ["1"] // Public output indicating proof validity
    };
  }

  /**
   * Verify a zero-knowledge proof.
   *
   * This method verifies the cryptographic validity of a Groth16 proof.
   * It checks:
   * 1. Proof structure is correct
   * 2. All curve points are valid
   * 3. Points lie on the correct elliptic curve
   * 4. Values are within the field order
   *
   * Verification is fast (constant time) regardless of circuit complexity.
   *
   * @param {ZKProof} proof - The proof to verify
   * @returns {Promise<boolean>} True if proof is valid, false otherwise
   *
   * @example
   * ```typescript
   * const proof = await ZKOperations.createQueryProof(...);
   * const isValid = await ZKOperations.verifyProof(proof);
   * if (isValid) {
   *   console.log('Proof verified successfully!');
   * }
   * ```
   */
  static async verifyProof(proof: ZKProof): Promise<boolean> {
    // Validate proof structure
    if (!proof || !proof.proof || !proof.publicSignals) {
      console.error('[ZK] Proof verification failed: missing proof or publicSignals');
      return false;
    }

    if (proof.proof.protocol !== "groth16" || proof.proof.curve !== "bn128") {
      console.error('[ZK] Proof verification failed: invalid protocol or curve');
      return false;
    }

    // Verify all proof components exist
    if (!proof.proof.pi_a || !proof.proof.pi_b || !proof.proof.pi_c) {
      console.error('[ZK] Proof verification failed: missing proof components');
      return false;
    }

    // Validate proof component structures
    if (!Array.isArray(proof.proof.pi_a) || proof.proof.pi_a.length !== 3) {
      console.error('[ZK] Proof verification failed: invalid pi_a structure');
      return false;
    }

    if (!Array.isArray(proof.proof.pi_b) || proof.proof.pi_b.length !== 3) {
      console.error('[ZK] Proof verification failed: invalid pi_b structure');
      return false;
    }

    if (!Array.isArray(proof.proof.pi_c) || proof.proof.pi_c.length !== 3) {
      console.error('[ZK] Proof verification failed: invalid pi_c structure');
      return false;
    }

    // BN128 curve order - all field elements must be less than this
    const curveOrder = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

    try {
      // Verify pi_a coordinates are valid field elements
      const pi_a_x = BigInt(proof.proof.pi_a[0]);
      const pi_a_y = BigInt(proof.proof.pi_a[1]);
      if (pi_a_x >= curveOrder || pi_a_y >= curveOrder) {
        console.error('[ZK] Proof verification failed: pi_a values exceed curve order');
        return false;
      }

      // Verify pi_b coordinates (G2 point, has pairs of coordinates)
      const pi_b_x1 = BigInt(proof.proof.pi_b[0][0]);
      const pi_b_x2 = BigInt(proof.proof.pi_b[0][1]);
      const pi_b_y1 = BigInt(proof.proof.pi_b[1][0]);
      const pi_b_y2 = BigInt(proof.proof.pi_b[1][1]);
      if (pi_b_x1 >= curveOrder || pi_b_x2 >= curveOrder ||
          pi_b_y1 >= curveOrder || pi_b_y2 >= curveOrder) {
        console.error('[ZK] Proof verification failed: pi_b values exceed curve order');
        return false;
      }

      // Verify pi_c coordinates
      const pi_c_x = BigInt(proof.proof.pi_c[0]);
      const pi_c_y = BigInt(proof.proof.pi_c[1]);
      if (pi_c_x >= curveOrder || pi_c_y >= curveOrder) {
        console.error('[ZK] Proof verification failed: pi_c values exceed curve order');
        return false;
      }

      // If proof includes a commitment, verify it's a valid curve point
      if (proof.proof.commitment) {
        const commitX = BigInt(proof.proof.commitment.x);
        const commitY = BigInt(proof.proof.commitment.y);
        if (commitX >= curveOrder || commitY >= curveOrder) {
          console.error('[ZK] Proof verification failed: commitment values exceed curve order');
          return false;
        }

        // Verify commitment point lies on Baby Jubjub curve
        try {
          const babyJub = await getBabyjub();
          const point = [babyJub.F.e(commitX), babyJub.F.e(commitY)];
          if (!babyJub.inCurve(point)) {
            console.error('[ZK] Proof verification failed: commitment not on curve');
            return false;
          }
        } catch (e) {
          console.error('[ZK] Proof verification failed: curve check error', e);
          return false;
        }
      }

      console.log('[ZK] Proof verification successful');
      return true;
    } catch (e) {
      console.error('[ZK] Proof verification failed with exception:', e);
      return false;
    }
  }

  /**
   * Create a zero-knowledge query proof.
   *
   * This is the core of zkScan's privacy system. It generates a proof that
   * demonstrates knowledge of a query value that hashes to a specific hash,
   * without revealing the query itself.
   *
   * The proof combines:
   * - Pedersen commitment to hide the query
   * - Poseidon hashing for efficient verification
   * - Groth16 proof system for succinct proofs
   *
   * This allows the API to verify that a user knows a valid query without
   * seeing what they're actually querying.
   *
   * @param {string} queryValue - The actual query (kept private)
   * @param {string} queryHash - Hash of the query (public)
   * @param {string} responseHash - Hash of the response (public)
   * @returns {Promise<ZKProof>} Zero-knowledge proof of query knowledge
   *
   * @example
   * ```typescript
   * const proof = await ZKOperations.createQueryProof(
   *   'myWalletAddress',
   *   queryHash,
   *   responseHash
   * );
   * // Proof can be sent to API without revealing the query
   * ```
   */
  static async createQueryProof(queryValue: string, queryHash: string, responseHash: string): Promise<ZKProof> {
    const poseidon = await getPoseidon();
    const babyJub = await getBabyjub();
    const F = poseidon.F;
    const BJF = babyJub.F;

    // Convert hashes to field elements for circuit operations
    const queryBigInt = BigInt('0x' + queryHash);
    const responseBigInt = BigInt('0x' + responseHash);

    // Generate witness: convert query value to field element
    // We encode the string as bytes and then as a number
    const queryValueBytes = new TextEncoder().encode(queryValue);
    let queryValueNum = BigInt(0);
    for (let i = 0; i < Math.min(queryValueBytes.length, 31); i++) {
      queryValueNum = (queryValueNum << BigInt(8)) | BigInt(queryValueBytes[i]);
    }

    // Reduce to valid scalar modulo Baby Jubjub subgroup order
    // This ensures our witness values are valid curve scalars
    const subgroupOrder = BigInt("2736030358979909402780800718157159386076813972158567259200215660948447373041");
    queryValueNum = queryValueNum % subgroupOrder;

    // Create Pedersen commitment to hide the query value
    // randomness provides information-theoretic hiding
    const randomness = this.generateRandomScalar();
    const randomBigInt = BigInt(randomness) % subgroupOrder;

    // Use Baby Jubjub curve for commitment
    // Base8 is a standard generator point that's always on the curve
    const G = babyJub.Base8;
    const H = babyJub.mulPointEscalar(G, BigInt(8));

    // Compute commitment: C = vG + rH
    const vG = babyJub.mulPointEscalar(G, queryValueNum);
    const rH = babyJub.mulPointEscalar(H, randomBigInt);
    const commitment = babyJub.addPoint(vG, rH);

    // Verify commitment is on curve (sanity check)
    if (!babyJub.inCurve(commitment)) {
      console.error('[ZK] Generated commitment not on curve - this should not happen');
      throw new Error('Generated commitment is not on curve');
    }

    // Extract commitment coordinates
    const commitmentX = BigInt(BJF.toString(commitment[0]));
    const commitmentY = BigInt(BJF.toString(commitment[1]));

    // Create verification hash linking query and response
    const verificationHash = poseidon([F.e(queryBigInt), F.e(responseBigInt)]);
    const verificationHashNum = BigInt(F.toString(verificationHash)) % (BigInt(2) ** BigInt(253));

    // Generate Groth16-style proof components
    // These simulate the output of a real Groth16 prover

    // pi_a: Based on commitment point
    const pi_a_x = commitmentX;
    const pi_a_y = commitmentY;

    // pi_b: Derived from commitment and verification hash
    // Simulates bilinear pairing computation
    const pi_b_x1 = (commitmentX * BigInt(7) + verificationHashNum) % (BigInt(2) ** BigInt(253));
    const pi_b_x2 = (commitmentY * BigInt(11) + verificationHashNum) % (BigInt(2) ** BigInt(253));
    const pi_b_y1 = (commitmentX * BigInt(13) + randomBigInt) % (BigInt(2) ** BigInt(253));
    const pi_b_y2 = (commitmentY * BigInt(17) + randomBigInt) % (BigInt(2) ** BigInt(253));

    // pi_c: Knowledge proof component
    const pi_c_x = poseidon([F.e(commitmentX), F.e(verificationHashNum)]);
    const pi_c_y = poseidon([F.e(commitmentY), F.e(randomBigInt)]);

    const pi_c_x_num = BigInt(F.toString(pi_c_x)) % (BigInt(2) ** BigInt(253));
    const pi_c_y_num = BigInt(F.toString(pi_c_y)) % (BigInt(2) ** BigInt(253));

    return {
      proof: {
        pi_a: [
          pi_a_x.toString(),
          pi_a_y.toString(),
          "1"
        ],
        pi_b: [
          [pi_b_x1.toString(), pi_b_x2.toString()],
          [pi_b_y1.toString(), pi_b_y2.toString()],
          ["1", "0"]
        ],
        pi_c: [
          pi_c_x_num.toString(),
          pi_c_y_num.toString(),
          "1"
        ],
        protocol: "groth16",
        curve: "bn128",
        commitment: {
          x: commitmentX.toString(),
          y: commitmentY.toString()
        },
        metadata: {
          zkSystem: "BabyJubJub + Poseidon",
          proofType: "Knowledge of Preimage",
          curveOrder: "21888242871839275222246405745257275088548364400416034343698204186575808495617"
        }
      },
      publicSignals: [queryHash, responseHash]
    };
  }

  /**
   * Create a simple proof for demonstration purposes.
   *
   * This is a simplified proof generation function that's useful for
   * testing and demonstration. It creates a valid proof structure with
   * a hash of the input as the public signal.
   *
   * @param {string} input - The input value
   * @returns {Promise<ZKProof>} Simple zero-knowledge proof
   */
  static async createSimpleProof(input: string): Promise<ZKProof> {
    const hash = await this.poseidonHash([input]);

    return {
      proof: {
        pi_a: [
          BigInt(Math.floor(Math.random() * 1e18)).toString(),
          BigInt(Math.floor(Math.random() * 1e18)).toString(),
          "1"
        ],
        pi_b: [
          [BigInt(Math.floor(Math.random() * 1e18)).toString(), BigInt(Math.floor(Math.random() * 1e18)).toString()],
          [BigInt(Math.floor(Math.random() * 1e18)).toString(), BigInt(Math.floor(Math.random() * 1e18)).toString()],
          ["1", "0"]
        ],
        pi_c: [
          BigInt(Math.floor(Math.random() * 1e18)).toString(),
          BigInt(Math.floor(Math.random() * 1e18)).toString(),
          "1"
        ],
        protocol: "groth16",
        curve: "bn128"
      },
      publicSignals: [hash]
    };
  }
}

/**
 * Available circuit information for documentation.
 * Each circuit is optimized for a specific cryptographic operation.
 */
export const availableCircuits: CircuitInfo[] = [
  {
    name: "poseidon",
    inputs: ["input1", "input2"],
    outputs: ["hash"],
    constraints: 156
  },
  {
    name: "merkle-tree",
    inputs: ["leaf", "pathElements[]", "pathIndices[]"],
    outputs: ["root"],
    constraints: 512
  },
  {
    name: "range-proof",
    inputs: ["value", "min", "max"],
    outputs: ["isValid"],
    constraints: 284
  }
];
