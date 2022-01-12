import { Board } from "./Board";
import { useState, useEffect } from "react";
import * as Circuit from "./Circuits";

function generateRandomNumber() {
  let rand1 = Math.floor(Math.random() * Math.pow(2, 30));
  let rand2 = Math.floor(Math.random() * Math.pow(2, 30));
  return rand1 * Math.pow(2, 30) + rand2;
}

/**
 * This is the root of the application.
 */
export function App() {
  const [boardState, setBoardState] = useState(makeBoard(5, 5));
  const [textState, setTextState] = useState("");
  const [playerIdState, setPlayerIdState] = useState("");
  const [opponentIdState, setOpponentIdState] = useState("");
  const [boardSaltState, setBoardSaltState] = useState(generateRandomNumber());

  const [boardHashesState, setBoardHashesState] = useState([]);
  const [movesState, setMovesState] = useState([]);
  const [answersState, setAnswersState] = useState([]);

  //console.log(boardState);
  const url = "http://localhost:3000";

  const sendBoard = () => {
    setTextState("Sending board...");
    const boardHash = 123;
    const proof = 345;
    Circuit.proveBoardHash(boardState, boardSaltState).then(
      (boardHashProof) => {
        fetch(url + "/post-board-hash/" + playerIdState, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(boardHashProof),
        })
          .then((response) => {
            if (response.status == 200) {
              setTextState("Board sent successfully");
            } else {
              setTextState("Sending board failed");
            }
          })
          .catch((error) => {
            setTextState("Sending board failed");
          });
      }
    );
  };

  const loadBoard = () => {
    /*console.log(movesState);
    console.log(boardHashesState);
    console.log(answersState);*/
    setTextState("Loading board...");
    fetch(url + "/get-board", {
      method: "GET",
      mode: "cors", // no-cors, cors, *same-origin
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setTextState("Board loaded successfully");
        setBoardState(data.board);
      })
      .catch((error) => {
        setTextState("Loading board failed");
        console.log({ error: error });
      });
  };

  const processBoardProof = async (boardProof) => {
    return Circuit.verifyBoardHash(boardProof.boardhash, boardProof.proof);
  };

  const loadState = () => {
    // console.log();
    fetch(url + "/get-game-state", {
      method: "GET",
      mode: "cors", // no-cors, cors, *same-origin
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log(data.moves);
        setBoardHashesState(data.boardhashes);
        /*for (boardProof of data.boardhashes) {
          // console.log(boardProof);
          processBoardProof(boardProof);
        }*/
        setMovesState(data.moves);
        setAnswersState(data.answers);
      })
      .catch((error) => {
        console.log({ error: error });
      });
  };

  const verifyOpponentBoard = () => {
    setTextState("Verifying opponent's board...");
    for (boardProof of boardHashesState) {
      if (boardProof.player == opponentIdState) {
        let proofValidity = processBoardProof(boardProof);
        proofValidity.then((res) => {
          console.log(res);
          if (res) {
            setTextState("Opponent's board verified to be legal");
          } else {
            setTextState("Opponent's board is illegal");
          }
        });
        return;
      }
    }
    setTextState("Opponent's board not found");
  };

  useEffect(() => {
    setInterval(loadState, 5000);
  }, []);

  return (
    <div>
      <div>
        <input
          type="text"
          id="player-id"
          placeholder="Your Player ID"
          value={playerIdState}
          onChange={(event) => setPlayerIdState(event.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          id="opponent-id"
          placeholder="Opponent's Player ID"
          value={opponentIdState}
          onChange={(event) => setOpponentIdState(event.target.value)}
        />
      </div>

      <Board boardState={boardState} setBoardState={setBoardState} isOpponent={false}/>
      <button onClick={sendBoard}>Send initial board</button>
      <div>
        <button onClick={verifyOpponentBoard}>Verify opponent's board</button>
      </div>
      <div>{textState}</div>
      <div>{JSON.stringify(boardHashesState)}</div>
      <div>{JSON.stringify(movesState)}</div>
      <div>{JSON.stringify(answersState)}</div>
      <div>Your Opponent's Board:</div>
      <Board boardState={makeBoard(5, 5)} setBoardState={makeBoard(5, 5)} isOpponent={true}/>
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
