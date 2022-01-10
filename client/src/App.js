import { Board } from "./Board";

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
  
  return (
    <div>
      <button
        onClick={calculateProof}
      >Click me!</button>
      <Board/>
    </div>
  );
}

console.log()