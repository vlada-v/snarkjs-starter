import { Board } from "./Board";
import { useState } from 'react';

/**
 * This is the root of the application.
 */
export function App() {
  const calculateProof = async () => {
    const { proof, publicSignals } =
    await snarkjs.groth16.fullProve( { a: 3, b: 11}, require("url:../public/circuit.wasm"), require("url:../public/circuit_final.zkey"));
    console.log(proof);
    console.log(publicSignals);
    
    const verificationKeyUrl = require("url:../public/verification_key.txt");
    const vkey = await fetch(verificationKeyUrl).then( function(res) {
      console.log(res);
      return res.json();
    });
    const res = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    console.log(res);
  }

  const [boardState, setBoardState] = useState(makeBoard(5, 5))
  console.log(boardState)
  return (
    <div>
      <button
        onClick={calculateProof}
      >Click me!</button>
      <Board boardState={boardState} setBoardState={setBoardState}/>
    </div>
  );
}

function makeBoard(width, height) {
  let result = [];

  for (let i = 0; i < width * height; i++) {
    result.push(false);
  }

  return result;
}

console.log()