# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of zkScan seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly

Please do not create a public GitHub issue for security vulnerabilities. This helps protect users while we work on a fix.

### 2. Report Via Email

Email us at: **security@zkscan.app**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information (optional, for follow-up)

### 3. Response Timeline

- **24 hours**: Initial response acknowledging receipt
- **72 hours**: Preliminary assessment
- **7 days**: Detailed response with mitigation plan
- **30 days**: Security patch released (for critical issues)

### 4. Coordinated Disclosure

We follow coordinated disclosure:
1. We verify the vulnerability
2. We develop and test a fix
3. We release the patch
4. After 90 days (or when >95% of users have upgraded), we publish details

## Security Measures

### Cryptographic Security

- **Groth16 zkSNARKs**: Industry-standard zero-knowledge proof system
- **BN254 Curve**: 128-bit security level
- **Poseidon Hash**: Proven security properties
- **Baby Jubjub**: Secure elliptic curve for commitments

### API Security

- **API Key Hashing**: SHA-256 hashed before storage
- **Rate Limiting**: Token bucket algorithm
- **Input Validation**: All inputs sanitized
- **CORS**: Properly configured headers
- **TLS**: All traffic encrypted in transit

### Database Security

- **Row-Level Security (RLS)**: Enforced on all tables
- **Prepared Statements**: Prevent SQL injection
- **Minimal Permissions**: Least privilege principle
- **Audit Logging**: All queries logged

### Code Security

- **TypeScript Strict Mode**: Type safety enforced
- **Dependency Scanning**: Automated vulnerability checks
- **Code Review**: All changes reviewed
- **Static Analysis**: ESLint + custom rules

## Known Limitations

### 1. Trusted Setup

Groth16 requires a trusted setup ceremony. We use publicly-available parameters from:
- Perpetual Powers of Tau ceremony
- Audited by multiple parties
- Transparent process

### 2. Side-Channel Attacks

While zkScan provides cryptographic privacy, side channels may exist:
- **Timing attacks**: Verification time is constant
- **Network analysis**: Use Tor/VPN for maximum privacy
- **Browser fingerprinting**: Beyond our scope

### 3. Quantum Resistance

Current cryptography is NOT quantum-resistant:
- Elliptic curves vulnerable to Shor's algorithm
- Hash functions vulnerable to Grover's algorithm
- Migration plan exists for post-quantum algorithms

## Security Best Practices for Users

### API Key Security

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.ZKSCAN_API_KEY;

// ❌ Bad: Hardcode in source
const apiKey = "zk_live_1234567890";

// ✅ Good: Never log keys
console.log('Making request...'); // Don't include key

// ❌ Bad: Log keys
console.log(`Using key: ${apiKey}`); // Exposes key
```

### Proof Generation

```typescript
// ✅ Good: Generate proofs client-side
const proof = await ZKOperations.createQueryProof(query, hash1, hash2);

// ❌ Bad: Send query plaintext to server
fetch('/api', { body: { query: 'mySecretQuery' } });
```

### Input Validation

```typescript
// ✅ Good: Validate inputs
if (!QueryDetector.isValidAddress(address)) {
  throw new Error('Invalid address');
}

// ❌ Bad: Trust user input
await client.queryWallet(userInput); // Could be malicious
```

## Security Audits

### Completed Audits

- **Cryptographic Review** (2024-Q4): Internal review of ZK circuits
- **Smart Contract Audit** (Planned 2025-Q1): Third-party audit

### Ongoing Monitoring

- Automated dependency scanning (Snyk)
- Static code analysis (ESLint, SonarQube)
- Penetration testing (quarterly)
- Bug bounty program (coming soon)

## Incident Response

In case of a security incident:

1. **Detection**: Automated monitoring + user reports
2. **Assessment**: Severity classification (Critical/High/Medium/Low)
3. **Containment**: Immediate mitigation deployed
4. **Eradication**: Root cause fixed
5. **Recovery**: Services restored
6. **Post-Mortem**: Detailed report published

## Security Updates

Subscribe to security updates:
- **X**: [@zkscanapp](https://x.com/zkscanapp)

## Acknowledgments

We thank the following researchers for responsible disclosure:

- (No vulnerabilities reported yet)

## Hall of Fame

Contributors who have significantly improved zkScan's security will be listed here (with permission).

---

**Last Updated**: 2025-12-06
**Version**: 1.0.0
