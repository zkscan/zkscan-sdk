
pragma circom 2.0.0;

include "./poseidon.circom";
include "./range.circom";

template MultiFieldQuery() {
    signal input typeField;
    signal input valueField;
    signal input chainId;
    signal input version;
    signal output queryHash;

    component typeCheck = RangeCheck(8);
    typeCheck.in <== typeField;

    component chainCheck = RangeCheck(32);
    chainCheck.in <== chainId;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== typeField;
    hasher.inputs[1] <== valueField;
    hasher.inputs[2] <== chainId;
    hasher.inputs[3] <== version;

    queryHash <== hasher.out;
}
