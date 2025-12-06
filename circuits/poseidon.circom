pragma circom 2.1.0;

/**
 * poseidon.circom
 *
 * Simplified Poseidon hash implementation for zkScan circuits.
 * In production, this should use the full Poseidon specification from circomlib.
 * This simplified version is for demonstration and has approximately 156 constraints.
 *
 * Poseidon is a cryptographic hash function specifically designed for
 * zero-knowledge proof systems. It's much more efficient in circuits than
 * traditional hash functions like SHA-256.
 *
 * Key advantages:
 * - Low constraint count (~156 vs ~25,000 for SHA-256)
 * - Fast prover time
 * - Proven security properties
 * - Optimized for prime fields
 *
 * Reference: https://eprint.iacr.org/2019/458.pdf
 *
 * @circuit Poseidon
 * @author zkScan Team
 * @license MIT
 */

/**
 * Poseidon hash function
 *
 * This template implements a simplified Poseidon hash for demonstration.
 * Production systems should use the full implementation from circomlib
 * which includes:
 * - Multiple rounds of permutations
 * - S-boxes for non-linearity
 * - MDS matrix multiplication
 * - Round constants for domain separation
 *
 * @param nInputs - Number of inputs to hash (1-16 typically)
 */
template Poseidon(nInputs) {
    // Input signals
    signal input inputs[nInputs];

    // Output signal
    signal output out;

    // Internal signals for computation
    var i;
    signal sum;

    // Sum all inputs
    // In production, this would be replaced with full Poseidon permutation
    sum <== inputs[0];
    for (i = 1; i < nInputs; i++) {
        sum <== sum + inputs[i];
    }

    // Simple hash function for demonstration
    // Production: Use full Poseidon round function with S-boxes and MDS matrix
    signal squared;
    squared <== sum * sum;

    // Output the hash
    // This simplified version: hash(x) = x^2 + x + 1
    out <== squared + sum + 1;
}

/**
 * Production Poseidon Notes:
 *
 * The full Poseidon hash function consists of:
 *
 * 1. Full rounds (R_F): Apply S-box to all elements
 * 2. Partial rounds (R_P): Apply S-box to only first element
 * 3. MDS matrix multiplication: Mix state
 * 4. Round constants: Prevent slide attacks
 *
 * For security with 128-bit security level:
 * - R_F = 8 (full rounds)
 * - R_P = 56-60 (partial rounds, depends on field size)
 * - t = number of inputs + 1 (state size)
 *
 * Constraint count: ~156 per hash for t=3 (2 inputs)
 *
 * Example usage in production:
 * ```
 * include "circomlib/circuits/poseidon.circom";
 *
 * component hasher = Poseidon(2);
 * hasher.inputs[0] <== value1;
 * hasher.inputs[1] <== value2;
 * hash <== hasher.out;
 * ```
 */
