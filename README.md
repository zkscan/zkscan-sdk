# zkScan: Privacy-Preserving Blockchain Explorer
<div>

**A next-generation blockchain explorer that uses zero-knowledge proofs to enable private, verifiable queries on Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Circom](https://img.shields.io/badge/Circom-2.1-purple)](https://docs.circom.io/)
[![Solana](https://img.shields.io/badge/Solana-Web3.js-9945FF)](https://solana.com/)

[Documentation](./docs) · [API Reference](./docs/API.md) · [Examples](./examples) · [Contributing](./CONTRIBUTING.md)

</div>

## Overview

zkScan is a revolutionary blockchain explorer that leverages **zero-knowledge cryptography** to enable users to query blockchain data without revealing their query patterns. By combining **Groth16 proofs**, **Poseidon hashing**, and **Pedersen commitments**, zkScan provides verifiable, privacy-preserving access to Solana blockchain data.

### Key Features

- **Privacy-First Design**: Query blockchain data without revealing what you're looking for
- **Cryptographic Verification**: All queries are backed by zero-knowledge proofs
- **High Performance**: Optimized circuits with minimal constraint counts
- **Production-Ready API**: RESTful API with comprehensive rate limiting and monitoring
- **Secure Architecture**: API key management with SHA-256 hashing and row-level security
- **Rich Data Sources**: Integrates Helius, DexScreener, and native Solana RPC
- **Type-Safe**: Full TypeScript implementation with comprehensive types

## Architecture

```
┌─────────────────┐
│   Client App    │
│  (TypeScript)   │
└────────┬────────┘
         │
         │ API Request + ZK Proof
         ▼
┌─────────────────┐
│   Edge API      │◄───────┐
│  (Deno Runtime) │        │ Verify Proof
└────────┬────────┘        │
         │                 │
         │ Fetch Data   ┌──┴──────────┐
         ▼              │  ZK Circuit  │
┌─────────────────┐    │  (Circom)    │
│ Solana Mainnet  │    └─────────────┘
│  + Helius RPC   │
└─────────────────┘
```

### Zero-Knowledge Components

1. **Poseidon Hash Function**: Efficient hash optimized for ZK circuits (156 constraints)
2. **Pedersen Commitments**: Binding commitments using Baby Jubjub elliptic curve
3. **Range Proofs**: Prove values lie within bounds without revealing them (284 constraints)
4. **Query Proofs**: Demonstrate knowledge of query preimage without exposure (512 constraints)

## Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm
node --version  # v18.0.0 or higher

# Circom compiler for ZK circuits
npm install -g circom

# snarkjs for proof generation/verification
npm install -g snarkjs
```

### Installation

```bash
# Clone the repository
git clone https://github.com/zkscan/zkscan-sdk.git
cd zkscan-core

# Install dependencies
npm install

# Build ZK circuits
npm run build:circuits

# Compile TypeScript
npm run build

# Run tests
npm test
```

### Basic Usage

```typescript
import { ZKOperations, ZKProof } from './src/crypto/zkOperations';
import { QueryDetector } from './src/utils/queryDetector';

// Detect query type (wallet/transaction/token)
const queryType = QueryDetector.detect('9x...abc123');

// Generate a Poseidon hash
const hash = await ZKOperations.poseidonHash(['input1', 'input2']);
console.log('Hash:', hash);

// Create a Pedersen commitment
const commitment = await ZKOperations.createPedersenCommitment(
  'secretValue',
  'randomBlinding'
);

// Generate a zero-knowledge proof for a query
const proof = await ZKOperations.createQueryProof(
  'myQuery',
  queryHash,
  responseHash
);

// Verify the proof
const isValid = await ZKOperations.verifyProof(proof);
console.log('Proof valid:', isValid);
```

## Documentation

### Core Modules

#### 1. **ZK Operations** (`src/crypto/zkOperations.ts`)

The heart of the cryptographic system. Implements:

- **Poseidon Hash**: SNARK-friendly hash function
- **Pedersen Commitments**: Cryptographic commitments on Baby Jubjub curve
- **Range Proofs**: Zero-knowledge range verification
- **Query Proofs**: Privacy-preserving query verification

```typescript
// Create a range proof (prove value is between min and max)
const rangeProof = await ZKOperations.createRangeProof(50, 0, 100);

// Verify a ZK proof
const valid = await ZKOperations.verifyProof(rangeProof);
```

#### 2. **Query Detection** (`src/utils/queryDetector.ts`)

Intelligent query type detection using heuristics:

- Length-based classification
- Known token mint identification
- Pattern matching for addresses

```typescript
// Automatically detect query type
const type = QueryDetector.detect('EPjFWdd...'); // Returns 'token'
const type2 = QueryDetector.detect('9x4...abc'); // Returns 'wallet'
```

#### 3. **Edge Functions** (`edge-functions/`)

Production-ready API endpoints:

- **`/api`**: Main query endpoint with authentication and ZK verification
- **`/zk-explorer`**: Public explorer for demo purposes
- **`/token-prices`**: Token price aggregation and caching

#### 4. **Circom Circuits** (`circuits/`)

Custom ZK circuits implemented in Circom:

- `query.circom`: Main query verification circuit
- `query_proof.circom`: SHA256-based query proof
- `poseidon.circom`: Poseidon hash implementation
- `range.circom`: Range proof circuit

## Cryptographic Primitives

### Poseidon Hashing

Poseidon is a hash function optimized for zero-knowledge proofs, using significantly fewer constraints than SHA-256.

```typescript
// Hash multiple inputs
const hash = await ZKOperations.poseidonHash([
  '12345',
  '67890'
]);

// Result is a 32-byte hex string
// '0x1a2b3c4d...'
```

**Circuit Constraints**: 156 per hash operation

### Pedersen Commitments

Cryptographically binding commitments using the Baby Jubjub elliptic curve.

```typescript
// Create commitment: C = vG + rH
const commitment = await ZKOperations.createPedersenCommitment(
  value,      // Secret value
  randomness  // Random blinding factor
);

// Commitment hides the value but is binding
```

**Properties**:
- **Binding**: Cannot change value without detection
- **Hiding**: Commitment reveals nothing about value
- **Homomorphic**: Supports addition of commitments

### Groth16 Proofs

Industry-standard zkSNARK protocol with:
- **Constant proof size**: ~200 bytes regardless of circuit complexity
- **Fast verification**: O(1) verification time
- **Strong security**: Based on computational hardness assumptions

```typescript
// Proof structure
interface ZKProof {
  proof: {
    pi_a: [string, string, string],      // G1 point
    pi_b: [[string, string], [string, string], [string, string]], // G2 point
    pi_c: [string, string, string],      // G1 point
    protocol: "groth16",
    curve: "bn128"
  },
  publicSignals: string[]
}
```

## API Reference

### Authentication

All API requests require an API key:

```bash
curl -X POST https://zkscan.app/api \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "wallet", "value": "9x4..."}'
```

### Endpoints

#### Query Blockchain Data

```http
POST /api
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "type": "wallet" | "transaction" | "token",
  "value": "string"
}
```

**Response**:
```json
{
  "id": "uuid",
  "result": {
    ...
  },
  "responseHash": "0x...",
  "publicSignals": {
    "queryHash": "0x...",
    "responseHash": "0x..."
  }
}
```

### Query Types

| Type | Description | Example |
|------|-------------|---------|
| `wallet` | Solana wallet address | `9x4nKZU7vhx...` |
| `transaction` | Transaction signature | `5jK8ZqG3...` (88 chars) |
| `token` | Token mint address | `EPjFWdd5Auf...` |

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test zkOperations

# Run with coverage
npm run test:coverage

# Benchmark cryptographic operations
npm run benchmark
```

## Development

### Project Structure

```
zkscan-core/
├── src/
│   ├── crypto/           # Cryptographic primitives
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
├── circuits/             # Circom ZK circuits
├── edge-functions/       # API endpoints
├── examples/             # Usage examples
├── tests/                # Test suites
└── docs/                 # Documentation
```

## Security

### Threat Model

zkScan is designed to protect against:

1. **Query Pattern Analysis**: Adversaries cannot determine what users are querying
2. **Data Leakage**: Proofs reveal nothing beyond validity
3. **Replay Attacks**: Each proof is tied to specific query/response hashes
4. **Forgery**: Cryptographically impossible to forge valid proofs

### Security Considerations

- All API keys are SHA-256 hashed before storage
- Row-level security (RLS) enforced on all database tables
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- Constant-time operations prevent timing attacks

## Performance

### Benchmarks

| Operation | Time | Constraints |
|-----------|------|-------------|
| Poseidon Hash (2 inputs) | 5ms | 156 |
| Pedersen Commitment | 8ms | N/A |
| Range Proof Generation | 120ms | 284 |
| Query Proof Generation | 250ms | 512 |
| Proof Verification | 15ms | N/A |

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- **Circom & SnarkJS**: Zero-knowledge circuit framework by iden3
- **Poseidon Hash**: Design by Grassi et al.
- **Baby Jubjub Curve**: Elliptic curve optimized for ZK
- **Solana Foundation**: Blockchain infrastructure
- **Helius**: Enhanced RPC services

## Contact

- **Website**: https://zkscan.app
- **Twitter**: [@zkscanapp](https://x.com/zkscanapp)
- **GitHub**: [github.com/zkscan](https://github.com/zkscan)

---

<div align="center">

**Built for the Solana ecosystem**

*Making blockchain data private, verifiable, and accessible to everyone*

</div>


## Changelog

### 1.1.0

- Added public SDK entrypoint (src/index.ts) for cleaner imports.
- Introduced configurable retry logic and network robustness in the API client.
- Added detailed batch query support with per item success and error reporting.
- Exposed ZK warmup and circuit metadata helpers in ZKOperations.
- Introduced a minimal CLI (zkscan) for shell based exploration.
- Updated package metadata to reflect the new version.

### 1.2.0

- Introduced circuit artifact caching to avoid repeated circuit loading.
- Added high level `createAndVerifyQueryProof` helper in ZKOperations.
- Extended client config with event hooks and local proof verification toggle.
- Added lightweight client side observability through `ZKScanClientEvent`.
- Improved CLI with query type flags and a `--no-proofs` option.
- Bumped SDK version to 1.2.0.
