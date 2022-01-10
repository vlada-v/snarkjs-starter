include "mimcsponge.circom";

/*  
Hash a board (list) of n numbers, salted with a nonce
The output is a hash commitment which corresponds to the board.
*/

template BoardHasher(n) {
    signal private input board[n];
    signal private input nonce;

    signal output out;

    // Check that every number on the board is 0 or 1
    for (var i=0; i<n; i++) {
        board[i] === board[i]*board[i];
    }
    
    component mimc = MiMCSponge(n+1,220,1);

    mimc.ins[0] <== nonce;

    for (var i=0; i<n; i++) {
        mimc.ins[i+1] <== board[i];
    }
    mimc.k <== 0;


    out <== mimc.outs[0];
}

component main = BoardHasher(25);