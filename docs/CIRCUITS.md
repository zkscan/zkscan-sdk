# Circuits

This document describes the Circom circuits used by the zkScan SDK.

The core ideas:
- Each circuit binds a specific query type and version.
- Poseidon is used as the ZK friendly hash function.
- Range checks ensure inputs are valid for the underlying field.

## walletQuery.circom

Verifies a wallet style query and produces a Poseidon hash based on:
- addressInput
- version
- static type field (1 for wallet)

## transactionQuery.circom

Verifies a transaction signature style query:
- signatureInput
- version
- static type field (2 for transaction)

## tokenQuery.circom

Verifies a token mint query:
- mintInput
- version
- static type field (3 for token)

## multiQuery.circom

Generic circuit that includes:
- typeField
- valueField
- chainId
- version

This allows you to tie a concrete chain and version to the query hash.

## aggregateQuery.circom

Accepts an array of query hashes and compresses them into a single
aggregate hash using Poseidon. This is the basis for aggregated proofs
across multiple queries.
