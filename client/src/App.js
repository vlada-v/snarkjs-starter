import { Board } from "./Board";
import { useState, useEffect } from "react";
import * as Circuit from "./Circuits";

/**
 * This is the root of the application.
 */
export function App() {
  const generateRandomNumber = () => {
    let rand1 = Math.floor(Math.random() * Math.pow(2, 30));
    let rand2 = Math.floor(Math.random() * Math.pow(2, 30));
    return rand1 * Math.pow(2, 30) + rand2;
  };

  const [boardState, setBoardState] = useState(makeBoard(5, 5));
  const [textState, setTextState] = useState("");
  const [playerIdState, setPlayerIdState] = useState("");
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

  const processBoardProof = (boardProof) => {
    Circuit.verifyBoardHash(boardProof.boardhash, boardProof.proof).then(
      (res) => console.log(res)
    );
  };

  const loadState = () => {
    fetch(url + "/get-game-state", {
      method: "GET",
      mode: "cors", // no-cors, cors, *same-origin
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.moves);
        setBoardHashesState(data.boardhashes);
        for (boardProof of data.boardhashes) {
          console.log(boardProof);
          processBoardProof(boardProof);
        }
        setMovesState(data.moves);
        setAnswersState(data.answers);
      })
      .catch((error) => {
        console.log({ error: error });
      });
  };

  useEffect(() => {
    loadState();
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
        />
      </div>

      <Board boardState={boardState} setBoardState={setBoardState} />
      <button onClick={sendBoard}>Send initial board</button>
      <div>{textState}</div>
      <div>{JSON.stringify(boardHashesState)}</div>
      <div>{JSON.stringify(movesState)}</div>
      <div>{JSON.stringify(answersState)}</div>
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
