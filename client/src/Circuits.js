export async function proveBoardHash(board, salt) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { board: board, nonce: salt },
    require("url:../public/battleship_circuit.wasm"),
    require("url:../public/battleship_circuit_final.zkey")
  );
  console.log(proof);
  console.log(publicSignals);
  return { proof: proof, boardhash: publicSignals[0] };
}

export async function verifyBoardHash(boardHash, proof) {
  console.log("started");
  const verificationKeyUrl = require("url:../public/battleship_verification_key.txt");
  const vkey = await fetch(verificationKeyUrl).then(function (res) {
    // console.log(res);
    return res.json();
  });
  console.log(vkey);
  const res = await snarkjs.groth16.verify(vkey, [boardHash], proof);
  console.log("finished");
  // console.log(res);
  return res;
}

export async function proveBoardAnswer(board, salt, field) {
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { board: board, nonce: salt, field: field },
    require("url:../public/move_circuit.wasm"),
    require("url:../public/move_circuit_final.zkey")
  );
  console.log(proof);
  console.log(publicSignals);
  return { proof: proof, value: publicSignals[0] };
}

export async function verifyBoardAnswer(boardHash, field, answer, proof) {
  console.log("started");
  const verificationKeyUrl = require("url:../public/move_verification_key.txt");
  const vkey = await fetch(verificationKeyUrl).then(function (res) {
    console.log(res);
    return res.json();
  });
  // console.log(vkey);
  const res = await snarkjs.groth16.verify(
    vkey,
    [answer, boardHash, field],
    proof
  );
  console.log("finished");
  // console.log(res);
  return res;
}
