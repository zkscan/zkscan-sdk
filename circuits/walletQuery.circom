
pragma circom 2.0.0;

include "./poseidon.circom";
include "./range.circom";

template WalletQuery() {
    signal input addressInput;
    signal input version;
    signal output queryHash;

    component rangeCheck = RangeCheck(252);
    rangeCheck.in <== addressInput;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== addressInput;
    hasher.inputs[1] <== version;
    hasher.inputs[2] <== 1;
    queryHash <== hasher.out;
}
