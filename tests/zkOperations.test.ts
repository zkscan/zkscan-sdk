/**
 * zkOperations.test.ts
 *
 * Comprehensive test suite for zkScan's cryptographic operations.
 * Tests cover all zero-knowledge primitives including hashing,
 * commitments, proofs, and verification.
 *
 * @author zkScan Team
 * @license MIT
 */

import { ZKOperations, ZKProof } from '../src/crypto/zkOperations';

describe('ZKOperations', () => {
  describe('Poseidon Hashing', () => {
    it('should generate consistent hashes for same input', async () => {
      // Arrange
      const input = ['123', '456'];

      // Act
      const hash1 = await ZKOperations.poseidonHash(input);
      const hash2 = await ZKOperations.poseidonHash(input);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should generate different hashes for different inputs', async () => {
      // Arrange
      const input1 = ['123'];
      const input2 = ['456'];

      // Act
      const hash1 = await ZKOperations.poseidonHash(input1);
      const hash2 = await ZKOperations.poseidonHash(input2);

      // Assert
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty array', async () => {
      // This test verifies edge case handling
      const hash = await ZKOperations.poseidonHash([]);
      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should handle large numbers', async () => {
      // Test with very large BigInt values
      const largeNum = (BigInt(2) ** BigInt(252)).toString();
      const hash = await ZKOperations.poseidonHash([largeNum]);
      expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe('Pedersen Commitments', () => {
    it('should create valid commitments', async () => {
      // Arrange
      const value = '42';
      const randomness = ZKOperations.generateRandomScalar();

      // Act
      const commitment = await ZKOperations.createPedersenCommitment(value, randomness);

      // Assert
      expect(commitment).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('should create different commitments for different randomness', async () => {
      // Arrange
      const value = '42';
      const randomness1 = ZKOperations.generateRandomScalar();
      const randomness2 = ZKOperations.generateRandomScalar();

      // Act
      const commitment1 = await ZKOperations.createPedersenCommitment(value, randomness1);
      const commitment2 = await ZKOperations.createPedersenCommitment(value, randomness2);

      // Assert
      expect(commitment1).not.toBe(commitment2);
    });

    it('should create same commitment for same value and randomness', async () => {
      // Arrange
      const value = '42';
      const randomness = '12345';

      // Act
      const commitment1 = await ZKOperations.createPedersenCommitment(value, randomness);
      const commitment2 = await ZKOperations.createPedersenCommitment(value, randomness);

      // Assert
      expect(commitment1).toBe(commitment2);
    });

    it('should handle zero value', async () => {
      // Arrange
      const value = '0';
      const randomness = ZKOperations.generateRandomScalar();

      // Act
      const commitment = await ZKOperations.createPedersenCommitment(value, randomness);

      // Assert
      expect(commitment).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe('Random Scalar Generation', () => {
    it('should generate different scalars each time', () => {
      // Act
      const scalar1 = ZKOperations.generateRandomScalar();
      const scalar2 = ZKOperations.generateRandomScalar();

      // Assert
      expect(scalar1).not.toBe(scalar2);
    });

    it('should generate scalars of appropriate length', () => {
      // Act
      const scalar = ZKOperations.generateRandomScalar();
      const bigIntValue = BigInt(scalar);

      // Assert - Should be a 256-bit number
      expect(bigIntValue).toBeGreaterThan(0);
      expect(bigIntValue).toBeLessThan(BigInt(2) ** BigInt(256));
    });
  });

  describe('Range Proofs', () => {
    it('should create proof for value in range', async () => {
      // Arrange
      const value = 50;
      const min = 0;
      const max = 100;

      // Act
      const proof = await ZKOperations.createRangeProof(value, min, max);

      // Assert
      expect(proof).toBeDefined();
      expect(proof.proof.protocol).toBe('groth16');
      expect(proof.proof.curve).toBe('bn128');
    });

    it('should throw error for value below range', async () => {
      // Arrange
      const value = -1;
      const min = 0;
      const max = 100;

      // Act & Assert
      await expect(
        ZKOperations.createRangeProof(value, min, max)
      ).rejects.toThrow();
    });

    it('should throw error for value above range', async () => {
      // Arrange
      const value = 101;
      const min = 0;
      const max = 100;

      // Act & Assert
      await expect(
        ZKOperations.createRangeProof(value, min, max)
      ).rejects.toThrow();
    });

    it('should verify valid range proof', async () => {
      // Arrange
      const value = 50;
      const proof = await ZKOperations.createRangeProof(value, 0, 100);

      // Act
      const isValid = await ZKOperations.verifyProof(proof);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should accept boundary values', async () => {
      // Test min boundary
      const proofMin = await ZKOperations.createRangeProof(0, 0, 100);
      expect(proofMin).toBeDefined();

      // Test max boundary
      const proofMax = await ZKOperations.createRangeProof(100, 0, 100);
      expect(proofMax).toBeDefined();
    });
  });

  describe('Query Proofs', () => {
    it('should create valid query proof', async () => {
      // Arrange
      const queryValue = 'testQuery';
      const queryHash = await ZKOperations.poseidonHash([queryValue]);
      const responseHash = await ZKOperations.poseidonHash(['response']);

      // Act
      const proof = await ZKOperations.createQueryProof(
        queryValue,
        queryHash,
        responseHash
      );

      // Assert
      expect(proof).toBeDefined();
      expect(proof.proof.protocol).toBe('groth16');
      expect(proof.proof.commitment).toBeDefined();
      expect(proof.publicSignals).toHaveLength(2);
    });

    it('should verify valid query proof', async () => {
      // Arrange
      const queryValue = 'testQuery';
      const queryHash = await ZKOperations.poseidonHash([queryValue]);
      const responseHash = await ZKOperations.poseidonHash(['response']);
      const proof = await ZKOperations.createQueryProof(
        queryValue,
        queryHash,
        responseHash
      );

      // Act
      const isValid = await ZKOperations.verifyProof(proof);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should include commitment in proof', async () => {
      // Arrange
      const queryValue = 'testQuery';
      const queryHash = await ZKOperations.poseidonHash([queryValue]);
      const responseHash = await ZKOperations.poseidonHash(['response']);

      // Act
      const proof = await ZKOperations.createQueryProof(
        queryValue,
        queryHash,
        responseHash
      );

      // Assert
      expect(proof.proof.commitment).toBeDefined();
      expect(proof.proof.commitment?.x).toBeDefined();
      expect(proof.proof.commitment?.y).toBeDefined();
    });
  });

  describe('Proof Verification', () => {
    it('should reject proof with invalid structure', async () => {
      // Arrange
      const invalidProof = {
        proof: {
          pi_a: ['1', '2'], // Invalid - should have 3 elements
          pi_b: [['1', '2'], ['3', '4'], ['5', '6']],
          pi_c: ['7', '8', '9'],
          protocol: 'groth16' as const,
          curve: 'bn128' as const
        },
        publicSignals: []
      };

      // Act
      const isValid = await ZKOperations.verifyProof(invalidProof);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject proof with values exceeding curve order', async () => {
      // Arrange
      const curveOrder = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
      const tooLarge = (curveOrder + BigInt(1)).toString();

      const invalidProof = {
        proof: {
          pi_a: [tooLarge, '2', '1'],
          pi_b: [['1', '2'], ['3', '4'], ['1', '0']],
          pi_c: ['7', '8', '1'],
          protocol: 'groth16' as const,
          curve: 'bn128' as const
        },
        publicSignals: []
      };

      // Act
      const isValid = await ZKOperations.verifyProof(invalidProof);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject proof with wrong protocol', async () => {
      // Arrange
      const invalidProof = {
        proof: {
          pi_a: ['1', '2', '1'],
          pi_b: [['1', '2'], ['3', '4'], ['1', '0']],
          pi_c: ['7', '8', '1'],
          protocol: 'plonk' as any,
          curve: 'bn128' as const
        },
        publicSignals: []
      };

      // Act
      const isValid = await ZKOperations.verifyProof(invalidProof);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('Merkle Proofs', () => {
    it('should generate merkle proof', async () => {
      // Arrange
      const leaf = 'leafData';
      const siblings = ['sibling1', 'sibling2'];

      // Act
      const proof = await ZKOperations.generateMerkleProof(leaf, siblings);

      // Assert
      expect(proof).toHaveLength(siblings.length);
      proof.forEach(hash => {
        expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
      });
    });

    it('should verify valid merkle proof', async () => {
      // Arrange
      const leaf = 'leafData';
      const siblings = ['sibling1', 'sibling2'];
      const proof = await ZKOperations.generateMerkleProof(leaf, siblings);
      const root = proof[proof.length - 1];

      // Act
      const isValid = await ZKOperations.verifyMerkleProof(leaf, root, siblings);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid merkle proof', async () => {
      // Arrange
      const leaf = 'leafData';
      const siblings = ['sibling1', 'sibling2'];
      const fakeRoot = await ZKOperations.poseidonHash(['fake']);

      // Act
      const isValid = await ZKOperations.verifyMerkleProof(leaf, fakeRoot, siblings);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});

// Test suite for performance benchmarking
describe('Performance Benchmarks', () => {
  it('should hash in reasonable time', async () => {
    const start = Date.now();
    await ZKOperations.poseidonHash(['test']);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should take < 100ms
  });

  it('should create commitment in reasonable time', async () => {
    const start = Date.now();
    const randomness = ZKOperations.generateRandomScalar();
    await ZKOperations.createPedersenCommitment('42', randomness);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200); // Should take < 200ms
  });

  it('should create range proof in reasonable time', async () => {
    const start = Date.now();
    await ZKOperations.createRangeProof(50, 0, 100);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500); // Should take < 500ms
  });
});
