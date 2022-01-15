include "mimcsponge.circom";

/*  
Hash a board (list) of n numbers, salted with a nonce
Also prove that the board satisfies the rules of battleship:
No two ships are adjacent (corner adjacency isn't allowed either)
There are:
- n1 1 sized ships
- n2 2 sized ships
- n3 3 sized ships
- n6 4 sized ships
- n6 5 sized ships
on a board of n by n

The output is a hash commitment which corresponds to the board.
*/

template BoardHasher(n, n1, n2, n3, n4, n5) {
    signal private input board[n*n];
    signal private input nonce;

    signal output out_hash;


    // Check that every number on the board is 0 or 1
    for (var i = 0; i < n*n; i++) {
        board[i] === board[i]*board[i];
    }

    
    // Check that there are no two filled cells which are diagonally adjacent
    // (Note that this is equivalent to only having non-touching horizontal and vertical ships(?))

    // Main diagonal 
    for (var i = 0; i < n-1; i++) {
        for(var j = 0; j < n-1; j++) {
            board[i*n+j] * board[(i+1)*n+(j+1)] === 0;
        }
    }

    // Anti diagonal
    for (var i = 0; i < n-1; i++) {
        for(var j = 1; j < n; j++) {
            board[i*n+j] * board[(i+1)*n+(j-1)] === 0;
        }
    }


    signal n1count[n*n+1];
    n1count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n; j++) {
            n1count[(i*n+j)+1] <== n1count[(i*n+j)] + board[i*n+j];
        }
    }

    n1count[n*n] === n1 + 2*n2 +3*n3 + 4*n4 +5*n5;


    signal n2count[n*(n-1)*2+1];
    n2count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-1; j++) {
            n2count[(i*(n-1)+j)+1] <== n2count[(i*(n-1)+j)] + board[i*n+j] * board[i*n + j + 1];
        }
    }

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-1; j++) {
            n2count[(n*(n-1) + i*(n-1) + j ) +1] <== n2count[(n*(n-1) + i*(n-1) + j)] + board[j*n+i] * board[(j+1)*n+i];
        }
    }

    n2count[n*(n-1)*2] === n2+2*n3+3*n4+4*n5;




    signal n3count[n*(n-2)*2+1];
    signal n3intermediate[n*(n-2)*2];
    n3count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-2; j++) {
            n3intermediate[(i*(n-2)+j)] <== board[i*n+j] * board[i*n + j + 1];
            n3count[(i*(n-2)+j)+1] <== n3count[(i*(n-2)+j)] + n3intermediate[(i*(n-2)+j)] * board[i*n + j + 2];
        }
    }

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-2; j++) {
            n3intermediate[(n*(n-2) + i*(n-2) + j)] <== board[j*n+i] * board[(j+1)*n+i];
            n3count[(n*(n-2) + i*(n-2) + j ) +1] <== n3count[(n*(n-2) + i*(n-2) + j)] + n3intermediate[(n*(n-2) + i*(n-2) + j)] * board[(j+2)*n+i];
        }
    }

    n3count[n*(n-2)*2] === n3+2*n4+3*n5;



    signal n4count[n*(n-3)*2+1];
    signal n4intermediate[n*(n-3)*2];
    signal n4intermediate2[n*(n-3)*2];
    n4count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-3; j++) {
            n4intermediate[(i*(n-3)+j)] <== board[i*n+j] * board[i*n + j + 1];
            n4intermediate2[(i*(n-3)+j)] <==  n4intermediate[(i*(n-3)+j)] * board[i*n + j + 2];
            n4count[(i*(n-3)+j)+1] <== n4count[(i*(n-3)+j)] + n4intermediate2[(i*(n-3)+j)] * board[i*n + j + 3];
        }
    }

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-3; j++) {
            n4intermediate[(n*(n-3) + i*(n-3) + j)] <== board[j*n+i] * board[(j+1)*n+i];
            n4intermediate2[(n*(n-3) + i*(n-3) + j)] <== n4intermediate[(n*(n-3) + i*(n-3) + j)] * board[(j+2)*n+i];
            n4count[(n*(n-3) + i*(n-3) + j ) +1] <== n4count[(n*(n-3) + i*(n-3) + j)] + n4intermediate2[(n*(n-3) + i*(n-3) + j)] * board[(j+3)*n+i];
        }
    }

    n4count[n*(n-3)*2] === n4+2*n5;
    


    signal n5count[n*(n-4)*2+1];
    signal n5intermediate[n*(n-4)*2];
    signal n5intermediate2[n*(n-4)*2];
    signal n5intermediate3[n*(n-4)*2];
    n5count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-4; j++) {
            n5intermediate[(i*(n-4)+j)] <== board[i*n+j] * board[i*n + j + 1];
            n5intermediate2[(i*(n-4)+j)] <==  n5intermediate[(i*(n-4)+j)] * board[i*n + j + 2];
            n5intermediate3[(i*(n-4)+j)] <==  n5intermediate2[(i*(n-4)+j)] * board[i*n + j + 3];
            n5count[(i*(n-4)+j)+1] <== n5count[(i*(n-4)+j)] + n5intermediate3[(i*(n-4)+j)] * board[i*n + j + 4];
        }
    }

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-4; j++) {
            n5intermediate[(n*(n-4) + i*(n-4) + j)] <== board[j*n+i] * board[(j+1)*n+i];
            n5intermediate2[(n*(n-4) + i*(n-4) + j)] <== n5intermediate[(n*(n-4) + i*(n-4) + j)] * board[(j+2)*n+i];
            n5intermediate3[(n*(n-4) + i*(n-4) + j)] <== n5intermediate2[(n*(n-4) + i*(n-4) + j)] * board[(j+3)*n+i];
            n5count[(n*(n-4) + i*(n-4) + j ) +1] <== n5count[(n*(n-4) + i*(n-4) + j)] + n5intermediate3[(n*(n-4) + i*(n-4) + j)] * board[(j+4)*n+i];
        }
    }

    n5count[n*(n-4)*2] === n5;



    signal n6count[n*(n-5)*2+1];
    signal n6intermediate[n*(n-5)*2];
    signal n6intermediate2[n*(n-5)*2];
    signal n6intermediate3[n*(n-5)*2];
    signal n6intermediate4[n*(n-5)*2];
    n6count[0] <== 0;
    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-5; j++) {
            n6intermediate[(i*(n-5)+j)] <== board[i*n+j] * board[i*n + j + 1];
            n6intermediate2[(i*(n-5)+j)] <==  n6intermediate[(i*(n-5)+j)] * board[i*n + j + 2];
            n6intermediate3[(i*(n-5)+j)] <==  n6intermediate2[(i*(n-5)+j)] * board[i*n + j + 3];
            n6intermediate4[(i*(n-5)+j)] <==  n6intermediate3[(i*(n-5)+j)] * board[i*n + j + 4];
            n6count[(i*(n-5)+j)+1] <== n6count[(i*(n-5)+j)] + n6intermediate4[(i*(n-5)+j)] * board[i*n + j + 5];
        }
    }

    for(var i = 0; i < n; i++) {
        for(var j = 0; j < n-5; j++) {
            n6intermediate[(n*(n-5) + i*(n-5) + j)] <== board[j*n+i] * board[(j+1)*n+i];
            n6intermediate2[(n*(n-5) + i*(n-5) + j)] <== n6intermediate[(n*(n-5) + i*(n-5) + j)] * board[(j+2)*n+i];
            n6intermediate3[(n*(n-5) + i*(n-5) + j)] <== n6intermediate2[(n*(n-5) + i*(n-5) + j)] * board[(j+3)*n+i];
            n6intermediate4[(n*(n-5) + i*(n-5) + j)] <== n6intermediate3[(n*(n-5) + i*(n-5) + j)] * board[(j+4)*n+i];
            n6count[(n*(n-5) + i*(n-5) + j ) +1] <== n6count[(n*(n-5) + i*(n-5) + j)] + n6intermediate4[(n*(n-5) + i*(n-5) + j)] * board[(j+5)*n+i];
        }
    }

    n6count[n*(n-5)*2] === 0;





    //Calculate the board hash
   
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

component main = BoardHasher(10,1,2,1,0,0);