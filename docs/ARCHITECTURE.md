# zkScan Architecture

This document describes the technical architecture of zkScan's privacy-preserving blockchain explorer.

## System Overview

zkScan combines zero-knowledge cryptography with blockchain data indexing to enable private, verifiable queries. The system consists of several key components working together to provide privacy-preserving access to Solana blockchain data.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Web App    │  │   API Client │  │   CLI Tool   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   ZK Circuit    │
                    │   Generation    │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼──────────┐  ┌────▼──────┐  ┌──────▼────────┐
│   Edge Functions   │  │  Database │  │  RPC Nodes    │
│                    │  │           │  │               │
│  - API Gateway     │  │ - Queries │  │ - Helius RPC  │
│  - Authentication  │  │ - API Keys│  │ - Solana RPC  │
│  - Rate Limiting   │  │ - Logs    │  │ - DexScreener │
└────────────────────┘  └───────────┘  └───────────────┘
```

## Core Components

### 1. Cryptographic Primitives

#### Poseidon Hash Function

Poseidon is the primary hash function used throughout zkScan. It's specifically designed for zero-knowledge proofs with minimal constraint counts.

**Properties**:
- Constraint count: ~156 per hash
- Security level: 128 bits
- Field: BN254 scalar field
- State size: 3 elements (for 2 inputs)

**Implementation**: See `src/crypto/zkOperations.ts::poseidonHash()`

#### Pedersen Commitments

We use Pedersen commitments on the Baby Jubjub elliptic curve for hiding values while maintaining binding properties.

**Construction**: `C = vG + rH`
- `v`: Value to commit to
- `r`: Random blinding factor
- `G, H`: Curve generators

**Security**:
- Computationally binding
- Information-theoretically hiding
- Homomorphic (supports addition)

**Implementation**: See `src/crypto/zkOperations.ts::createPedersenCommitment()`

#### Groth16 Proof System

Groth16 is our zkSNARK protocol for generating and verifying proofs.

**Advantages**:
- Constant proof size (~200 bytes)
- Fast verification (O(1))
- Strong security guarantees

**Proof Structure**:
```
π = (A, B, C)
where:
  A ∈ G1 (pi_a)
  B ∈ G2 (pi_b)
  C ∈ G1 (pi_c)
```

**Verification Equation**:
```
e(A, B) = e(α, β) · e(L, γ) · e(C, δ)
```

### 2. Circuit Architecture

#### Query Circuit

The main circuit for proving query knowledge.

**Inputs**:
- Private: `queryValue` - The actual query
- Public: `queryHash` - Expected hash
- Public: `responseHash` - Response hash

**Constraints**: ~170

**Logic**:
1. Compute `h = Poseidon(queryValue)`
2. Assert `h == queryHash`
3. Output `valid = 1`

**File**: `circuits/query.circom`

#### Range Proof Circuit

Proves a value is within bounds without revealing it.

**Inputs**:
- Private: `value` - Secret value
- Public: `min`, `max` - Range bounds

**Constraints**: ~284

**Logic**:
1. Compute `diff1 = value - min`
2. Compute `diff2 = max - value`
3. Assert both differences are non-negative
4. Output `valid = 1`

**File**: `circuits/range.circom`

### 3. API Layer

#### Edge Functions

We use Deno Edge Functions for the API layer, providing:
- Low latency (edge deployment)
- TypeScript support
- Secure environment
- Auto-scaling

**Main Endpoints**:

```typescript
// /api - Main query endpoint
POST /api
{
  "type": "wallet" | "transaction" | "token",
  "value": "string",
  "proof": { ... } // Optional
}

// Response
{
  "id": "uuid",
  "result": { ... },
  "responseHash": "sha256",
  "publicSignals": { ... }
}
```

#### Authentication Flow

```
1. Client sends request with API key in Authorization header
2. Edge function hashes the API key (SHA-256)
3. Lookup hashed key in database
4. Verify key is active
5. Process request
6. Log query with user_id
7. Return response
```

#### Rate Limiting

We implement token bucket rate limiting:

```typescript
interface RateLimitBucket {
  tokens: number;
  lastRefill: timestamp;
  capacity: number;
  refillRate: number;
}
```

**Algorithm**:
1. Calculate tokens to add: `(now - lastRefill) * refillRate`
2. Refill bucket: `tokens = min(tokens + toAdd, capacity)`
3. Check if `tokens >= 1`
4. If yes: Decrement tokens, allow request
5. If no: Reject with 429

### 4. Database Schema

#### Tables

**user_api_keys**
```sql
CREATE TABLE user_api_keys (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  api_key text UNIQUE NOT NULL, -- SHA-256 hashed
  key_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);
```

**query_logs**
```sql
CREATE TABLE query_logs (
  id uuid PRIMARY KEY,
  query_hash text NOT NULL,
  response_hash text NOT NULL,
  query_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  api_key_id uuid REFERENCES user_api_keys(id),
  source text,
  created_at timestamptz DEFAULT now()
);
```

**external_api_keys**
```sql
CREATE TABLE external_api_keys (
  id uuid PRIMARY KEY,
  service_name text UNIQUE NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

#### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
  ON user_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only see their own query logs
CREATE POLICY "Users can view own query logs"
  ON query_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### 5. Data Flow

#### Query Execution Flow

```
1. User submits query
   ├─> Client generates query hash
   └─> Client creates ZK proof (optional)

2. API receives request
   ├─> Validate API key
   ├─> Verify ZK proof (if present)
   └─> Check rate limits

3. Fetch blockchain data
   ├─> Determine query type
   ├─> Route to appropriate handler
   │   ├─> Wallet: Get balance + tokens
   │   ├─> Transaction: Get tx details
   │   └─> Token: Get metadata + price
   └─> Aggregate data from multiple sources

4. Process response
   ├─> Generate response hash
   ├─> Log query
   └─> Return result with proof signals

5. Client receives response
   ├─> Verify response hash
   └─> Process data
```

### 6. Security Architecture

#### Threat Model

**Adversary Capabilities**:
- Can observe API traffic
- Can query the API
- Cannot break cryptographic primitives
- Cannot forge ZK proofs

**Security Goals**:
- Query privacy: Adversary cannot determine what user is querying
- Response integrity: Cannot tamper with responses
- Availability: Service remains available under load

#### Defense Mechanisms

**1. API Key Security**
- Keys are SHA-256 hashed before storage
- Never logged or exposed
- Can be revoked instantly
- Rate limited per key

**2. Query Privacy**
- Queries can include ZK proofs
- Proofs hide query content
- Only hash is revealed publicly
- Response linkable only to hash

**3. Input Validation**
- All inputs sanitized
- Type checking enforced
- Length limits applied
- Injection prevention

**4. Database Security**
- Row-level security enabled
- Prepared statements used
- Minimal permissions granted
- Audit logging enabled

## Performance Characteristics

### Latency Breakdown

```
Total Query Time: ~500-1500ms

├─ ZK Proof Generation: 250ms
│  ├─ Witness computation: 50ms
│  ├─ FFT operations: 150ms
│  └─ Proof encoding: 50ms
│
├─ Network Request: 100-500ms
│  ├─ TLS handshake: 50-100ms
│  ├─ Request transmission: 20-50ms
│  └─ Response transmission: 30-350ms
│
└─ API Processing: 150-750ms
   ├─ Authentication: 10ms
   ├─ Proof verification: 15ms
   ├─ RPC calls: 100-700ms
   └─ Response generation: 25ms
```

### Optimization Strategies

1. **Circuit Optimization**: Minimize constraints where possible
2. **Proof Caching**: Cache proofs for repeated queries
3. **Parallel Fetching**: Fetch data from multiple sources concurrently
4. **Response Caching**: Cache frequently requested data
5. **Edge Deployment**: Reduce network latency

## Scalability

### Horizontal Scaling

- Edge functions auto-scale based on demand
- Database uses connection pooling
- RPC calls distributed across multiple nodes
- CDN for static assets

### Vertical Scaling Limits

- Proof generation: CPU-bound, ~250ms per proof
- Verification: Fast, ~15ms per proof
- Database queries: Indexed, <10ms typically

## Future Enhancements

1. **Recursive Proofs**: Enable proof aggregation
2. **Circuit Optimization**: Reduce constraint counts further
3. **Batch Verification**: Verify multiple proofs at once
4. **State Channels**: Enable instant queries
5. **Cross-Chain Support**: Extend to other blockchains
