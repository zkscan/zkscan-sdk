
pragma circom 2.0.0;

include "./poseidon.circom";
include "./range.circom";

template TransactionQuery() {
    signal input signatureInput;
    signal input version;
    signal output queryHash;

    component rangeCheck = RangeCheck(252);
    rangeCheck.in <== signatureInput;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== signatureInput;
    hasher.inputs[1] <== version;
    hasher.inputs[2] <== 2;
    queryHash <== hasher.out;
}
