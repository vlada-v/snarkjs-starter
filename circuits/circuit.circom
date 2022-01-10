include "mimcsponge.circom";
include "multiplexer.circom";

/*  
Hash a board (list) of n numbers, salted with a nonce
The output is a hash commitment which corresponds to the board.
*/

template BoardHasher(n) {
    signal private input board[n];
    //signal private input nonce;
  //  signal public input boardhash;
    signal input field;

    signal output out_field;
    signal output out_hash;
    component multiplexer = Multiplexer(1,n);

    for (var i=0; i<n; i++) {
        multiplexer.inp[i][0] <== board[i];
    }
    multiplexer.sel <== field;
    multiplexer.out[0] ==> out_field;

    // Check that every number on the board is 0 or 1
    for (var i=0; i<n; i++) {
        board[i] === board[i]*board[i];
    }
    
    component mimc = MiMCSponge(n,220,1);

   // mimc.ins[0] <== nonce;

    for (var i=0; i<n; i++) {
        mimc.ins[i+1] <== board[i];
    }
    mimc.k <== 0;


    out_hash <== mimc.outs[0];
   // boardhash === out;
}

component main = BoardHasher(25);