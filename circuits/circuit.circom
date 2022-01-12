include "mimcsponge.circom";
include "multiplexer.circom";

/*  
Hash a board (list) of n numbers, salted with a nonce
The output is a hash commitment which corresponds to the board.
*/

template BoardHasher(n) {
    signal private input board[n];
    signal private input nonce;
    signal input field;

    signal output out_field;
    signal output out_hash;
    component multiplexer = Multiplexer(1,n);

    for (var i=0; i<n; i++) {
        multiplexer.inp[i][0] <== board[i];
    }
    multiplexer.sel <== field;
    out_field <== multiplexer.out[0];

    // There is no need to check for validity of the board, as it has been proved before
    // And the hash proves that the board hasn't changed, so it's still a legal setup
    
    component mimc = MiMCSponge(n+1,220,1);

    mimc.ins[0] <== nonce;

    for (var i=0; i<n; i++) {
        mimc.ins[i+1] <== board[i];
    }
    mimc.k <== 0;


    out_hash <== mimc.outs[0];

}

component main = BoardHasher(25);