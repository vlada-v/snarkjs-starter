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
  

  const [boardState, setBoardState] = useState(makeBoard(5, 5));
  const [textState, setTextState] = useState("");
  console.log(boardState);
  const url = "http://localhost:8000";

  const sendBoard = () => {
    setTextState("Sending board...");
    fetch(url, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(boardState)
    })
      .then(response => {
        if(response.status == 200) {
          setTextState("Board sent successfully");          
        } else {
          setTextState("Sending board failed");
        }
      }).catch(error => {setTextState("Sending board failed");});
  };

  const loadBoard = () => {
    setTextState("Loading board...");
    fetch(url,
    {
      mode: "cors" // no-cors, cors, *same-origin
    })
      .then(response => response.json())
      .then(data => {
        setTextState(JSON.stringify(data));
      })
      .catch(error => {
        setTextState("Loading board failed");
        console.log({ error: error });
      });
  };


  return (
    <div>
      <button
        onClick={sendBoard}
      >Send board</button>
      <button
        onClick={loadBoard}
      >Load board</button>
      <Board boardState={boardState} setBoardState={setBoardState}/>
      <div>{textState}</div>
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