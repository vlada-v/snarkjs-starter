include "mimcsponge.circom";
include "multiplexer.circom";
include "comparators.circom";

/*  
Hash a board (list) of n numbers, salted with a nonce
The output is a hash commitment which corresponds to the board.
*/


// WARNING: n=10 hardcoded

function ind(i,j) {
    return i*10+j;
}

function ind2(i,j) {
    return (i+5)*(10+10)+(j+5);
}

template BoardHasher(n) {


    signal private input board[n*n];
    signal private input nonce;
    signal input field;
    signal input known[n*n];

    signal output out_field;
    signal output out_hash;
    component multiplexer = Multiplexer(1,n*n);

    for (var i = 0; i < n*n; i++) {
        multiplexer.inp[i][0] <== board[i];
    }
    multiplexer.sel <== field;


    signal bigknown[(n+10)*(n+10)];
    signal bigboard[(n+10)*(n+10)];

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n; j++) {
            bigknown[ind2(i,j)] <== known[ind(i,j)];
            bigboard[ind2(i,j)] <== board[ind(i,j)];
        }
    }

    for(var i = 0; i < n+10; i++) {
        for(var j = 0; j < 5; j++) {
            bigknown[i*(n+10)+j] <== 0;
            bigknown[i*(n+10)+ n + 10 - 1 - j] <== 0;

            bigboard[i*(n+10)+j] <== 0;
            bigboard[i*(n+10)+ n + 10 - 1 - j] <== 0;
        }
    }
    for(var j = 5; j < n+5; j++) {
        for(var i = 0; i < 5; i++) {
            bigknown[i*(n+10)+j] <== 0;
            bigknown[(n + 10 - 1 - i)*(n+10)+ j] <== 0;

            bigboard[i*(n+10)+j] <== 0;
            bigboard[(n + 10 - 1 - i)*(n+10)+ j] <== 0;
        }
    }



    // board[i][j+k] = 1, known[i][j+k] = 0 before any board[i][j+l] = 0 means the ship is not sunk 
    // we want sunk_flag to be 0 if this occurs in any direction 
    // no_0 = 1, no_0 *= board[i][j+k]
    // sunk_flag = 1, sunk_flag *= ((1 - no_0) + known[i][j+k])
    // sunk_flag set to 0 if the whole expression is 0:
    // - if no_0 is 1, i.e. we are still inside the ship 
    // - if known[i][j+k] is 0, i.e. we haven't hit this field yet

    signal field_j <-- field%n;
    component remainderLT = LessThan(4);
    remainderLT.in[0] <== field_j;
    remainderLT.in[1] <== n;
    remainderLT.out === 1; 
    signal field_i <-- (field-field_j)/n;
    field_i * n + field_j === field;

    component board_multiplexers[16];
    component known_multiplexers[16];

    for(var k = 0; k < 16; k++) {
        board_multiplexers[k] = Multiplexer(1,(n+10)*(n+10));
        known_multiplexers[k] = Multiplexer(1,(n+10)*(n+10));
        for (var i = 0; i < (n+10)*(n+10); i++) {
            board_multiplexers[k].inp[i][0] <== bigboard[i];
            known_multiplexers[k].inp[i][0] <== bigknown[i];
        }
    }
    signal sunk_flags[17];

    sunk_flags[0] <== multiplexer.out[0]; // Is 0 if we didn't hit in this move
    
    signal no_0s[20];
    var currind = 0;
    var no0ind = 0;

    no_0s[no0ind] <== 1;
    no0ind++;


    for(var i = 1; i <= 4; i++) {
        board_multiplexers[currind].sel <== ind2(field_i,field_j+i);
        known_multiplexers[currind].sel <== ind2(field_i,field_j+i);
        no_0s[no0ind] <== no_0s[no0ind-1] * board_multiplexers[currind].out[0];
        sunk_flags[currind+1] <== sunk_flags[currind] * (1 - no_0s[no0ind] + known_multiplexers[currind].out[0]);
        no0ind++;
        currind++;
    }
    
    no_0s[no0ind] <== 1;
    no0ind++;
    
    for(var i = 1; i <= 4; i++) {
        board_multiplexers[currind].sel <== ind2(field_i,field_j-i);
        known_multiplexers[currind].sel <== ind2(field_i,field_j-i);
        no_0s[no0ind] <== no_0s[no0ind-1] * board_multiplexers[currind].out[0];
        sunk_flags[currind+1] <== sunk_flags[currind] * (1 - no_0s[no0ind] + known_multiplexers[currind].out[0]);
        no0ind++;
        currind++;
    }

    no_0s[no0ind] <== 1;
    no0ind++;
    
    for(var i = 1; i <= 4; i++) {
        board_multiplexers[currind].sel <== ind2(field_i+i, field_j);
        known_multiplexers[currind].sel <== ind2(field_i+i, field_j);
        no_0s[no0ind] <== no_0s[no0ind-1] * board_multiplexers[currind].out[0];
        sunk_flags[currind+1] <== sunk_flags[currind] * (1 - no_0s[no0ind] + known_multiplexers[currind].out[0]);
        no0ind++;
        currind++;
    }

    no_0s[no0ind] <== 1;
    no0ind++;
    
    for(var i = 1; i <= 4; i++) {
        board_multiplexers[currind].sel <== ind2(field_i-i, field_j);
        known_multiplexers[currind].sel <== ind2(field_i-i, field_j);
        no_0s[no0ind] <== no_0s[no0ind-1] * board_multiplexers[currind].out[0];
        sunk_flags[currind+1] <== sunk_flags[currind] * (1 - no_0s[no0ind] + known_multiplexers[currind].out[0]);
        no0ind++;
        currind++;
    }



    out_field <== multiplexer.out[0]+sunk_flags[currind];

    // There is no need to check for validity of the board, as it has been proved before
    // And the hash proves that the board hasn't changed, so it's still a legal setup
    




    component mimc = MiMCSponge(2,220,1);

    mimc.ins[0] <== nonce;

    signal board_roll_up[n*n];
    board_roll_up[0] <== board[0];
    for (var i = 1; i < n*n; i++) {
        board_roll_up[i] <== 2*board_roll_up[i-1] + board[i];
    }

    mimc.ins[1] <== board_roll_up[n*n-1];
    
    mimc.k <== 0;


    out_hash <== mimc.outs[0];

}

component main = BoardHasher(10);