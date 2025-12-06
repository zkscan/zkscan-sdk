pragma circom 2.1.0;

/**
 * query.circom
 *
 * Main query verification circuit for zkScan.
 * This circuit proves knowledge of a query value that hashes to a specific hash,
 * without revealing the query itself.
 *
 * The circuit uses Poseidon hashing for efficiency (only 156 constraints per hash)
 * compared to SHA-256 (thousands of constraints).
 *
 * @circuit QueryProof
 * @author zkScan Team
 * @license MIT
 */

include "./poseidon.circom";

/**
 * QueryProof circuit
 *
 * This circuit implements the core zero-knowledge proof for query privacy.
 * It proves: "I know a queryValue that hashes to queryHash"
 * without revealing what queryValue is.
 *
 * Inputs:
 * - queryValue (private): The actual query being made
 * - queryHash (public): Expected hash of the query
 * - responseHash (public): Hash of the response from server
 *
 * Outputs:
 * - valid: 1 if proof is correct, constraint fails otherwise
 *
 * Constraints: ~170 (mostly from Poseidon hash)
 */
template QueryProof() {
    // Private input - this is what we want to keep secret
    signal input queryValue;

    // Public inputs - these are revealed as part of the proof
    signal input queryHash;
    signal input responseHash;

    // Output signal
    signal output valid;

    // Hash the private query value using Poseidon
    // Poseidon is optimized for ZK circuits with minimal constraints
    component hasher = Poseidon(1);
    hasher.inputs[0] <== queryValue;

    // Verify that the computed hash matches the public queryHash
    // This proves we know a value that hashes to queryHash
    signal hashDiff;
    hashDiff <== hasher.out - queryHash;

    // Constrain that hashDiff must be 0
    // If this constraint fails, the proof is invalid
    hashDiff * hashDiff === 0;

    // Output valid = 1 to indicate successful verification
    valid <== 1;
}

// Main component definition
// Marks queryHash and responseHash as public inputs
component main {public [queryHash, responseHash]} = QueryProof();
