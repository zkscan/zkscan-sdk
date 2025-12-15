# CLI

The zkScan SDK ships with a small command line interface called `zkscan`.

## Commands

### query

```bash
zkscan query [--type wallet|transaction|token] [--no-proofs] "<value>"
```

Runs a single query using either automatic detection or an explicit type.

### circuits

```bash
zkscan circuits
```

Prints available circuits as JSON.

### benchmark

```bash
zkscan benchmark "<value>"
```

Benchmarks the proof pipeline for a given query string and prints
timing information as JSON.

### raw

```bash
zkscan raw "<value>"
```

Sends a query with proofs disabled. This is mainly intended for
debugging or quick checks where you want to inspect the underlying
API result without ZK details.
