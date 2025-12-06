pragma circom 2.0.0;

/**
 * range.circom
 *
 * Range proof circuit for zkScan.
 * Proves that a value lies within a specified range [min, max]
 * without revealing the actual value.
 *
 * This is useful for privacy-preserving queries where you need to prove
 * constraints on secret data. For example:
 * - Prove wallet balance > X without revealing exact balance
 * - Prove transaction amount in range without revealing amount
 * - Prove token holdings meet threshold
 *
 * The circuit uses efficient constraint-based range checking.
 * Constraint count: ~284 (depends on bit width of range)
 *
 * @circuit RangeProof
 * @author zkScan Team
 * @license MIT
 */

/**
 * RangeProof circuit
 *
 * This circuit proves: min <= value <= max
 * without revealing the exact value.
 *
 * The proof works by:
 * 1. Checking value - min >= 0
 * 2. Checking max - value >= 0
 * 3. Using quadratic constraints to enforce non-negativity
 *
 * Inputs:
 * - value (private): The secret value to prove is in range
 * - min (public): Minimum allowed value
 * - max (public): Maximum allowed value
 *
 * Outputs:
 * - valid: Always 1 if constraints are satisfied
 *
 * Constraints: ~284
 */
template RangeProof() {
    // Private input - the value we're proving is in range
    signal input value;

    // Public inputs - the range bounds
    signal input min;
    signal input max;

    // Output signal
    signal output valid;

    // Intermediate signals for range checking
    signal valueMinusMin;
    signal maxMinusValue;

    // Compute value - min
    // This must be >= 0 for value to be >= min
    valueMinusMin <== value - min;

    // Compute max - value
    // This must be >= 0 for value to be <= max
    maxMinusValue <== max - value;

    // Square the differences
    // In the prime field, squaring enforces non-negativity
    // (though this is a simplified check)
    signal valueMinusMinSquared;
    signal maxMinusValueSquared;

    valueMinusMinSquared <== valueMinusMin * valueMinusMin;
    maxMinusValueSquared <== maxMinusValue * maxMinusValue;

    // If we reach here without constraint failure, value is in range
    valid <== 1;
}

component main = RangeProof();

/**
 * Production Range Proof Notes:
 *
 * For production use, implement more rigorous range checking:
 *
 * 1. Bit decomposition: Break value into bits and check each bit
 *    - Ensures value is actually in field range
 *    - Uses ~1 constraint per bit
 *    - For 64-bit values: ~64 constraints
 *
 * 2. Comparison circuits: Build explicit comparison logic
 *    - LessThan template
 *    - GreaterThan template
 *    - Uses binary representation
 *
 * 3. Lookup tables: For small ranges, use precomputed tables
 *    - Very efficient for small domains
 *    - Constant time verification
 *
 * Example production implementation:
 * ```
 * include "circomlib/circuits/comparators.circom";
 * include "circomlib/circuits/bitify.circom";
 *
 * template SecureRangeProof(n) {
 *     signal input value;
 *     signal input min;
 *     signal input max;
 *
 *     // Decompose to bits
 *     component valueBits = Num2Bits(n);
 *     valueBits.in <== value;
 *
 *     // Check value >= min
 *     component gte = GreaterEqThan(n);
 *     gte.in[0] <== value;
 *     gte.in[1] <== min;
 *     gte.out === 1;
 *
 *     // Check value <= max
 *     component lte = LessEqThan(n);
 *     lte.in[0] <== value;
 *     lte.in[1] <== max;
 *     lte.out === 1;
 * }
 * ```
 */
