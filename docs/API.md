# zkScan API Documentation

Complete API reference for zkScan's privacy-preserving blockchain explorer.

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Query Types](#query-types)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Code Examples](#code-examples)

## Authentication

All API requests require authentication using an API key. Include your API key in the `Authorization` header:

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

### Getting an API Key

1. Sign up at [https://zkscan.app](https://zkscan.app)
2. Navigate to the Dashboard
3. Click "Create API Key"
4. Copy your key (it will only be shown once!)

### Security Best Practices

- Never commit API keys to version control
- Use environment variables to store keys
- Rotate keys regularly
- Use different keys for development and production

## Endpoints

### POST /api

Main query endpoint for blockchain data.

**URL**: `https://zkscan.app/api`

**Method**: `POST`

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "type": "wallet" | "transaction" | "token",
  "value": "string",
  "proof": { ... } // Optional ZK proof
}
```

**Response**:
```json
{
  "id": "uuid",
  "result": { ... },
  "responseHash": "0x...",
  "publicSignals": {
    "queryHash": "0x...",
    "responseHash": "0x..."
  }
}
```

## Query Types

### Wallet Query

Query a Solana wallet address to get balance and token holdings.

**Type**: `wallet`

**Example Request**:
```bash
curl -X POST https://zkscan.app/api \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wallet",
    "value": "9x4nKZU7vHxMYzZ4Kb3h9xZ8YqPE2LVFPMJb3xFQaZ5K"
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "result": {
    "address": "9x4nKZU...",
    "solBalance": "123.4567",
    "lamports": 123456700000,
    "status": "active",
    "tokenCount": 5,
    "tokens": [
      {
        "mint": "EPjFWdd...",
        "symbol": "USDC",
        "name": "USD Coin",
        "balance": "1000.50",
        "decimals": 6,
        "logo": "https://...",
        "priceUsd": 1.00,
        "valueUsd": 1000.50
      }
    ]
  },
  "responseHash": "0xa1b2c3...",
  "publicSignals": {
    "queryHash": "0xd4e5f6...",
    "responseHash": "0xa1b2c3..."
  }
}
```

### Transaction Query

Query a transaction signature to get details.

**Type**: `transaction`

**Example Request**:
```bash
curl -X POST https://zkscan.app/api \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transaction",
    "value": "5jK8ZqG3tYpXqvZ8h2MzPvH6X9Y3yQ2KhRbBnWxzN5L4vC3mTx7nJ8kP9wY2zF6qL"
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "result": {
    "signature": "5jK8Zq...",
    "slot": 123456789,
    "blockTime": "2024-12-06T10:30:00.000Z",
    "status": "confirmed",
    "fee": "0.000005 SOL"
  },
  "responseHash": "0xb2c3d4...",
  "publicSignals": {
    "queryHash": "0xe5f6g7...",
    "responseHash": "0xb2c3d4..."
  }
}
```

### Token Query

Query a token mint address to get metadata and market data.

**Type**: `token`

**Example Request**:
```bash
curl -X POST https://zkscan.app/api \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type": application/json" \
  -d '{
    "type": "token",
    "value": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "result": {
    "address": "EPjFWdd...",
    "type": "Token Mint",
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 6,
    "totalSupply": "1,000,000,000",
    "holderCount": 50000,
    "price": 1.00,
    "marketCap": 1000000000,
    "volume24h": 50000000,
    "liquidity": 10000000,
    "priceChange24h": 0.01,
    "logo": "https://...",
    "description": "USD Coin is a fully-backed stablecoin"
  },
  "responseHash": "0xc3d4e5...",
  "publicSignals": {
    "queryHash": "0xf6g7h8...",
    "responseHash": "0xc3d4e5..."
  }
}
```

## Response Format

All successful responses follow this structure:

```typescript
interface ZKScanResponse {
  id: string;              // Unique query ID
  result: any;             // Query-specific data
  responseHash: string;    // SHA-256 hash of response
  publicSignals: {
    queryHash: string;     // Hash of the query
    responseHash: string;  // Hash of the response
  };
  proof?: ZKProof;         // Optional ZK proof
}
```

## Error Handling

Error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid query format |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - API key is disabled |
| 404 | Not Found - Address/transaction not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Examples

**Invalid API Key**:
```json
{
  "error": "Invalid API key"
}
```

**Address Not Found**:
```json
{
  "error": "Token mint not found"
}
```

**Rate Limit Exceeded**:
```json
{
  "error": "Rate limit exceeded. Please try again later."
}
```

## Rate Limits

Rate limits are applied per API key:

- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1,000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Code Examples

### JavaScript/TypeScript

```typescript
import { ZKScanClient } from '@zkscan/core';

const client = new ZKScanClient({
  apiUrl: 'https://zkscan.app/api',
  apiKey: process.env.ZKSCAN_API_KEY
});

// Query a wallet
const wallet = await client.queryWallet('9x4nKZ...');
console.log(`Balance: ${wallet.result.solBalance} SOL`);

// Query a token
const token = await client.queryToken('EPjFWdd...');
console.log(`Price: $${token.result.price}`);
```

### Python

```python
import requests

API_URL = "https://zkscan.app/api"
API_KEY = "your-api-key"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

data = {
    "type": "wallet",
    "value": "9x4nKZ..."
}

response = requests.post(API_URL, json=data, headers=headers)
result = response.json()

print(f"Balance: {result['result']['solBalance']} SOL")
```

### cURL

```bash
curl -X POST https://zkscan.app/api \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"wallet","value":"9x4nKZ..."}'
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    apiURL := "https://zkscan.app/api"
    apiKey := "your-api-key"

    data := map[string]string{
        "type":  "wallet",
        "value": "9x4nKZ...",
    }

    jsonData, _ := json.Marshal(data)

    req, _ := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
    req.Header.Set("Authorization", "Bearer "+apiKey)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()

    // Parse response...
}
```

## Zero-Knowledge Proofs

When `enableProofs` is true, queries can include ZK proofs:

```typescript
const proof = await ZKOperations.createQueryProof(
  queryValue,
  queryHash,
  responseHash
);

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'wallet',
    value: address,
    proof: proof
  })
});
```

The proof structure follows the Groth16 format:

```typescript
interface ZKProof {
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    protocol: "groth16";
    curve: "bn128";
  };
  publicSignals: string[];
}
```

## Changelog

### v1.0.0 (2024-12-06)
- Initial API release
- Support for wallet, transaction, and token queries
- Zero-knowledge proof integration
- Rate limiting and authentication
