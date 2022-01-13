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
  const [boardState, setBoardState] = useState(makeBoard(10, 10, false));
  const [textState, setTextState] = useState("");
  const [playerIdState, setPlayerIdState] = useState("");
  const [opponentIdState, setOpponentIdState] = useState("");
  const [boardSaltState, setBoardSaltState] = useState(generateRandomNumber());
  const [opponentBoardState, setOpponentBoardState] = useState(
    makeBoard(10, 10, null)
  );

  const [boardSent, setBoardSent] = useState(false);
  const [opponentBoardHash, setOpponentBoardHash] = useState(0);
  const [selectedOpponentField, setSelectedOpponentField] = useState(-1);

  const [boardHashesState, setBoardHashesState] = useState([]);
  const [movesState, setMovesState] = useState([]);
  const [answersState, setAnswersState] = useState([]);

  //console.log(boardState);
  const url = "http://localhost:3000";

  const sendBoard = () => {
    if (playerIdState == "") {
      setTextState("Specify a user id");
      return;
    }
    setBoardSent(true);
    setTextState("Sending board...");
    const boardHash = 123;
    const proof = 3410;
    Circuit.proveBoardHash(boardState, boardSaltState).then(
      (boardHashProof) => {
        // console.log(boardHashProof, JSON.stringify(boardHashProof))
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
              setBoardSent(false);
              setTextState("Sending board failed");
            }
          })
          .catch((error) => {
            setBoardSent(false);
            setTextState("Sending board failed");
          });
      }
    );
  };

  const answerQuery = (fieldId) => {
    setTextState("Answering query...");
    Circuit.proveBoardAnswer(boardState, boardSaltState, fieldId).then(
      (proofValue) => {
        fetch(url + "/answer-query/" + playerIdState + "/" + fieldId, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(proofValue),
        })
          .then((response) => {
            if (response.status == 200) {
              setTextState("Answer sent successfully" + proofValue.value);
            } else {
              setTextState("Sending answer failed");
            }
          })
          .catch((error) => {
            setTextState("Sending answer failed");
          });
      }
    );
  };

  const answeredField = (field) => {
    for (answer of answersState) {
      if (answer.player == playerIdState && answer.field == field) {
        return true;
      }
    }
    return false;
  };

  const processQuery = (query) => {
    // TODO: Add check for whose turn it is
    if (query.player == playerIdState && !answeredField(query.field)) {
      answerQuery(query.field);
    }
  };

  const sendMove = () => {
    if (selectedOpponentField == -1) {
      setTextState("Select an unknown field first");
    } else {
      setTextState("Sending move...");
      fetch(
        url + "/post-move/" + opponentIdState + "/" + selectedOpponentField,
        {
          method: "GET",
          mode: "cors", // no-cors, cors, *same-origin
        }
      )
        .then((response) => response.json())
        .then((data) => {
          setTextState("Sent move successfully, waiting for reply...");
        })
        .catch((error) => {
          console.log(error);
          setTextState("Sending move failed");
        });
    }
  };

  const constructBoardWithGuesses = () => {
    setTextState("Updating guesses...");
    fetch(url + "/get-game-state", {
      method: "GET",
      mode: "cors", // no-cors, cors, *same-origin
    })
      .then((response) => response.json())
      .then((data) => {
        data = {
          answers: [
            { field: 2, answer: true },
            { field: 13, answer: true },
            { field: 24, answer: false },
          ],
        };
        console.log(data);
        setTextState("Updated successfully");
        const board = new Array(210).fill(null);
        for (let i = 0; i < data.answers.length; i++) {
          board[data.answers[i].field] = data.answers[i].answer;
        }
        console.log(board);
        setOpponentBoardState(board);
      })
      .catch((error) => {
        setTextState("Updating board failed");
        console.log({ error: error });
      });
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

  const verifyBoardProof = async (boardProof) => {
    return Circuit.verifyBoardHash(boardProof.boardhash, boardProof.proof);
  };

  const verifyAnswer = async (field, answer, proof) => {
    return Circuit.verifyBoardAnswer(opponentBoardHash, field, answer, proof);
  };

  const processAnswer = async (answer) => {
    if (
      answer.player == opponentIdState &&
      opponentBoardState[answer.field] == null
    ) {
      setTextState("Verifying answer of opponent...");
      verifyAnswer(answer.field, answer.answer, answer.proof).then((res) => {
        if (res) {
          const newOpponentBoard = opponentBoardState.slice();
          newOpponentBoard[answer.field] = answer.answer == 1 ? true : false;
          setOpponentBoardState(newOpponentBoard);
          setTextState("Opponent's answer verified to be legal");
        } else {
          setTextState("Opponent's answer is illegal");
        }
      });
    }
  };

  const loadState = () => {
    fetch(url + "/get-game-state", {
      method: "GET",
      mode: "cors",
    })
      .then((response) => response.json())
      .then((data) => {
        setBoardHashesState(data.boardhashes);
        setMovesState(data.moves);
        setAnswersState(data.answers);
        for (query of data.moves) {
          processQuery(query);
        }
        for (answer of data.answers) {
          processAnswer(answer);
        }
      })
      .catch((error) => {
        console.log({ error: error });
      });
  };

  const verifyOpponentBoard = () => {
    setTextState("Verifying opponent's board...");
    for (boardProof of boardHashesState) {
      if (boardProof.player == opponentIdState) {
        let proofValidity = verifyBoardProof(boardProof);
        proofValidity.then((res) => {
          console.log(res);
          if (res) {
            setOpponentBoardHash(boardProof.boardhash);
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
    setInterval(loadState, 10000);
  }, []);

  return (
    <div>
      {!boardSent ? (
        <div>
          <input
            type="text"
            id="player-id"
            placeholder="Your Player ID"
            value={playerIdState}
            onChange={(event) => setPlayerIdState(event.target.value)}
          />
        </div>
      ) : null}
      {opponentBoardHash == 0 ? (
        <div>
          <input
            type="text"
            id="opponent-id"
            placeholder="Opponent's Player ID"
            value={opponentIdState}
            onChange={(event) => setOpponentIdState(event.target.value)}
          />
        </div>
      ) : null}

      <Board
        boardState={boardState}
        setBoardState={!boardSent ? setBoardState : (x) => null}
        isOpponent={false}
      />
      {!boardSent ? (
        <button onClick={sendBoard}>Send initial board</button>
      ) : null}
      {opponentBoardHash == 0 ? (
        <div>
          <button onClick={verifyOpponentBoard}>Verify opponent's board</button>
        </div>
      ) : null}
      <div>{textState}</div>
      <div>{JSON.stringify(boardHashesState)}</div>
      <div>{JSON.stringify(movesState)}</div>
      <div>{JSON.stringify(answersState)}</div>

      {opponentBoardHash != 0 ? (
        <div>
          <div>Your Opponent's Board:</div>
          <Board
            boardState={opponentBoardState}
            setBoardState={constructBoardWithGuesses}
          />
        </div>
      ) : null}
    </div>
  );
}

function makeBoard(width, height, defaultValue) {
  let result = [];

  for (let i = 0; i < width * height; i++) {
    result.push(defaultValue);
  }

  return result;
}
