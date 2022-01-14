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

  const [answeredFieldsState, setAnsweredFieldsState] = useState(
    makeBoard(10, 10, false)
  );

  const [boardSent, setBoardSent] = useState(false);
  const [opponentBoardHash, setOpponentBoardHash] = useState(0);
  const [selfBoardHash, setSelfBoardHash] = useState(0);

  const [boardHashesState, setBoardHashesState] = useState([]);
  const [movesState, setMovesState] = useState([]);
  const [answersState, setAnswersState] = useState([]);
  const [chosenShot, setChosenShot] = useState(null);

  const [turnState, setTurnState] = useState(null);

  const url = "http://localhost:3000";

  const sendBoard = () => {
    if (playerIdState == "") {
      setTextState("Specify a user id");
      return;
    }
    console.log(playerIdState);
    setBoardSent(true);
    setTextState("Verifying your board...");
    Circuit.proveBoardHash(boardState, boardSaltState).then(
      (boardHashProof) => {
        verifyBoardProof(boardHashProof).then((res) => {
          if (res == false) {
            setBoardSent(false);
            setTextState("Your board is illegal");
          } else {
            setTextState("Sending your board...");

            fetch(url + "/post-board-hash/" + playerIdState, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(boardHashProof),
            })
              .then((response) => {
                console.log(response.status);
                if (response.status == 200) {
                  setSelfBoardHash(boardHashProof.boardhash);
                  setTextState("Board sent successfully");
                } else {
                  setBoardSent(false);
                  setTextState("Sending board failed");
                }
              })
              .catch((error) => {
                console.log(error);
                setBoardSent(false);
                setTextState("Sending board failed");
              });
          }
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
              setTextState("Answer sent successfully: " + proofValue.value);
              newAnswered = answeredFieldsState.slice();
              newAnswered[fieldId] = true;
              setAnsweredFieldsState(newAnswered);
              if (proofValue.value == 0) {
                setTurnState(true);
              }
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

  const processQueries = () => {
    // TODO: Add check for whose turn it is
    for (query of movesState) {
      if (
        query.player == playerIdState &&
        !answeredFieldsState[query.field] &&
        turnState == false
      ) {
        answerQuery(query.field);
        if (!boardState[query.field]) {
          break;
        }
      }
    }
  };

  const sendMove = () => {
    setChosenShot(null);
    if (chosenShot == -1) {
      setTextState("Select an unknown field first");
    } else {
      setTurnState(null);
      setTextState("Sending move...");
      fetch(url + "/post-move/" + opponentIdState + "/" + chosenShot, {
        method: "GET",
        mode: "cors", // no-cors, cors, *same-origin
      })
        .then((response) => response.json())
        .then((data) => {
          setTextState("Sent move successfully, waiting for reply...");
        })
        .catch((error) => {
          console.log(error);
          setTurnState(true);
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
        setTextState("Updated successfully");
        const board = new Array(210).fill(null);
        for (let i = 0; i < data.answers.length; i++) {
          board[data.answers[i].field] = data.answers[i].answer;
        }
        setOpponentBoardState(board);
      })
      .catch((error) => {
        setTextState("Updating board failed");
        console.log({ error: error });
      });
  };

  const verifyBoardProof = async (boardProof) => {
    return Circuit.verifyBoardHash(boardProof.boardhash, boardProof.proof);
  };

  const verifyAnswer = async (field, answer, proof) => {
    return Circuit.verifyBoardAnswer(opponentBoardHash, field, answer, proof);
  };

  const processAnswers = async () => {
    //console.log(answersState);
    const newOpponentBoard = opponentBoardState.slice();
    const promises = [];
    for (answer of answersState) {
      let currAnswer = answer;
      console.log(currAnswer, opponentIdState);
      if (
        currAnswer.player == opponentIdState &&
        opponentBoardHash != 0 &&
        opponentBoardState[currAnswer.field] == null
      ) {
        setTextState("Verifying answer of opponent...");
        promises.push([
          currAnswer,
          verifyAnswer(currAnswer.field, currAnswer.answer, currAnswer.proof),
        ]);
      }
    }

    Promise.all(promises).then((results) => {
      for ([currAnswer, res] of results) {
        console.log(currAnswer, res);
        if (res) {
          newOpponentBoard[currAnswer.field] =
            currAnswer.answer == 1 ? true : false;
          if (currAnswer.answer == 1) {
            setTurnState(true);
          } else {
            setTurnState(false);
          }
          setTextState("Opponent's answer verified to be legal");
        } else {
          setTextState("Opponent's answer is illegal");
        }
      }
      console.log(newOpponentBoard);
      setOpponentBoardState(newOpponentBoard);
    });
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
        //console.log(data.moves, data.answers); //important to track
        //  for (query of data.moves) {
        //processQuery(query);
        // }
        // processAnswers();
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
          //console.log(res);
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

  const calculateStartingPlayer = () => {
    if (opponentBoardHash != 0 && selfBoardHash != 0 && turnState == null) {
      let sum = parseInt(selfBoardHash) + parseInt(opponentBoardHash);
      if (sum % 2 == 1) {
        setTurnState(parseInt(selfBoardHash) < parseInt(opponentBoardHash));
      } else {
        setTurnState(parseInt(selfBoardHash) >= parseInt(opponentBoardHash));
      }
    }
  };

  useEffect(() => {
    processAnswers();
  }, [answersState]);

  useEffect(() => {
    processQueries();
  }, [movesState]);

  useEffect(() => {
    calculateStartingPlayer();
  }, [opponentBoardHash, boardHashesState]);

  useEffect(() => {
    setInterval(loadState, 2000);
    // console.log("chosen shot " + chosenShot);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {!boardSent ? (
        <div
        // style={{
        //   display: "inline-block", // in line?
        // }}
        >
          {/* <p>Enter your player id: </p> */}
          <input
            type="text"
            id="player-id"
            placeholder="Your Player ID"
            value={playerIdState}
            onChange={(event) => {
              setPlayerIdState(event.target.value);
            }}
          />
        </div>
      ) : (
        <p>Your player id: {playerIdState}</p>
      )}
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
      ) : (
        <p>Your opponent player id: {opponentIdState}</p>
      )}
      <p hidden={turnState == null}>
        It's your {turnState ? "" : "opponent's "} turn
      </p>
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
      {opponentBoardHash != 0 ? (
        <div>
          <div>Your Opponent's Board:</div>
          <Board
            boardState={opponentBoardState}
            setBoardState={constructBoardWithGuesses}
            // makeMove={sendMove}
            // makeMove={chooseMove}
            isOpponent={true}
            chosenShot={chosenShot}
            setChosenShot={setChosenShot}
          />
          <button
            onClick={sendMove}
            disabled={chosenShot == null || !turnState}
          >
            FIREEEEE!!!
          </button>
        </div>
      ) : null}
      <div>{JSON.stringify(boardHashesState)}</div>
      <div>{JSON.stringify(movesState)}</div>
      <div>{JSON.stringify(answersState)}</div>
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
