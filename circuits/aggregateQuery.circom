
pragma circom 2.0.0;

include "./poseidon.circom";

template AggregateQuery(n) {
    signal input queryHashes[n];
    signal output aggregateHash;

    component hasher = Poseidon(n);
    for (var i = 0; i < n; i++) {
        hasher.inputs[i] <== queryHashes[i];
    }

    aggregateHash <== hasher.out;
}
