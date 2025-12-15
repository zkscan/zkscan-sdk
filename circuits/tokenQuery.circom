
pragma circom 2.0.0;

include "./poseidon.circom";
include "./range.circom";

template TokenQuery() {
    signal input mintInput;
    signal input version;
    signal output queryHash;

    component rangeCheck = RangeCheck(252);
    rangeCheck.in <== mintInput;

    component hasher = Poseidon(3);
    hasher.inputs[0] <== mintInput;
    hasher.inputs[1] <== version;
    hasher.inputs[2] <== 3;
    queryHash <== hasher.out;
}
