import { Board, Ship, Console } from "./Board";
import { useState, useEffect } from "react";
import * as Circuit from "./Circuits";
import "./App.css";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

function generateRandomNumber() {
  let rand1 = Math.floor(Math.random() * Math.pow(2, 30));
  let rand2 = Math.floor(Math.random() * Math.pow(2, 30));
  return rand1 * Math.pow(2, 30) + rand2;
}

/**
 * This is the root of the application.
 */
export function App() {
  const [boardState, setBoardState] = useState(makeBoard(10, 10, 0));
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
  const [scoreState, setScoreState] = useState(8);
  const [opponentScoreState, setOpponentScoreState] = useState(8);

  const url = "http://localhost:3000";

  const sendBoard = () => {
    if (playerIdState == "") {
      setTextState("Specify a user id");
      return;
    }
    // console.log(playerIdState);
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
                //   console.log(response.status);
                response.json().then((data) => {
                  if (response.status == 200) {
                    if (data.success == false) {
                      setBoardSent(false);
                      setTextState(
                        "This username is already in usage, choose another one"
                      );
                    } else {
                      setSelfBoardHash(boardHashProof.boardhash);
                      setTextState("Board sent successfully");
                    }
                  } else {
                    setBoardSent(false);
                    setTextState("Sending board failed");
                  }
                });
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
    Circuit.proveBoardAnswer(
      boardState,
      boardSaltState,
      fieldId,
      answeredFieldsState
    ).then((proofValue) => {
      fetch(url + "/answer-query/" + playerIdState + "/" + fieldId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proofValue),
      })
        .then((response) => {
          if (response.status == 200) {
            if (proofValue.value == 0) {
              setTextState("Answer sent successfully: miss");
            } else {
              setTextState("Answer sent successfully: hit");
            }
            if (proofValue.value != 0) {
              setScoreState(scoreState - 1);
            }
            newAnswered = answeredFieldsState.slice();
            newAnswered[fieldId] = true;
            setAnsweredFieldsState(newAnswered);
            // console.log(setAnsweredFieldsState);
            if (proofValue.value == 0) {
              setTurnState(true);
            } else if (proofValue.value > 1) {
              newBoard = boardState.slice();
              newBoard[fieldId] = 2;
              let fieldX = Math.floor(fieldId / 10);
              let fieldY = fieldId % 10;
              for (var dir = 0; dir < 4; dir++) {
                for (var i = 1; i < 10; i++) {
                  let currField =
                    (fieldX + (dir < 2 ? (dir == 0 ? i : -i) : 0)) * 10 +
                    fieldY +
                    (dir >= 2 ? (dir == 2 ? i : -i) : 0);
                  if (
                    currField < 0 ||
                    currField >= 100 ||
                    newBoard[currField] == 0
                  ) {
                    break;
                  }
                  newBoard[currField] = 2;
                }
              }
              setBoardState(newBoard);
            }
          } else {
            setTextState("Sending answer failed");
          }
        })
        .catch((error) => {
          setTextState("Sending answer failed");
        });
    });
  };

  const processQueries = () => {
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
    let known = [];
    for (var i = 0; i < 100; i++) {
      known.push(opponentBoardState[i] != null);
    }
    return Circuit.verifyBoardAnswer(
      opponentBoardHash,
      field,
      answer,
      known,
      proof
    );
  };

  const processAnswers = async () => {
    const newOpponentBoard = opponentBoardState.slice();
    const promises = [];
    for (answer of answersState) {
      let currAnswer = answer;
      // console.log(currAnswer, opponentIdState);
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
        // console.log(currAnswer, res);
        if (res) {
          newOpponentBoard[currAnswer.field] = currAnswer.answer;
          if (currAnswer.answer >= 2) {
            let fieldX = Math.floor(currAnswer.field / 10);
            let fieldY = currAnswer.field % 10;

            for (var dir = 0; dir < 4; dir++) {
              for (var i = 1; i < 10; i++) {
                let currField =
                  (fieldX + (dir < 2 ? (dir == 0 ? i : -i) : 0)) * 10 +
                  fieldY +
                  (dir >= 2 ? (dir == 2 ? i : -i) : 0);
                if (
                  currField < 0 ||
                  currField >= 100 ||
                  newOpponentBoard[currField] == null ||
                  newOpponentBoard[currField] == 0
                ) {
                  break;
                }
                newOpponentBoard[currField] = 2;
              }
            }
          }
          if (currAnswer.answer != 0) {
            setTurnState(true);
            setOpponentScoreState(opponentScoreState - 1);
          } else {
            setTurnState(false);
          }

          setTextState("Opponent's answer verified to be legal");
        } else {
          setTextState("Opponent's answer is illegal");
        }
      }
      //  console.log(newOpponentBoard);
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
      })
      .catch((error) => {
        console.log({ error: error });
      });
  };

  const verifyOpponentBoard = () => {
    if (opponentIdState == playerIdState) {
      setTextState("You can't be your own opponent");
      return;
    }
    setTextState("Verifying opponent's board...");
    for (boardProof of boardHashesState) {
      if (boardProof.player == opponentIdState) {
        let proofValidity = verifyBoardProof(boardProof);
        proofValidity.then((res) => {
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
  }, [opponentBoardHash, selfBoardHash]);

  useEffect(() => {
    setInterval(loadState, 2000);
    // console.log("chosen shot " + chosenShot);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "80%" }}>
      <div>
        <h1>ZK-Battleship</h1>
        {!boardSent ? (
          <div>
            <h3>What's your name? </h3>
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
        ) : null}
        {opponentBoardHash == 0 ? (
          <div>
            <h3>Choose your fighter! </h3>
            <input
              type="text"
              id="opponent-id"
              placeholder="Opponent's Player ID"
              value={opponentIdState}
              onChange={(event) => setOpponentIdState(event.target.value)}
            />
          </div>
        ) : null}
        {scoreState == 0 ? (
          <h1 id="result">{playerIdState}, you lost :(((</h1>
        ) : null}
        {opponentScoreState == 0 ? (
          <h1 id="result">{playerIdState}, you won!!!</h1>
        ) : null}
        <p hidden={turnState == null}>
          It's your {turnState ? "" : "opponent's "} turn
        </p>
        {!boardSent ? (
          <div>
            <h4>
              Choose positions of your ships (so far images are just for visual
              reference):
            </h4>
            <div id="ships">
              <Ship size={5} />
              <br></br>
              <Ship size={4} /> <Ship size={4} />
              <br></br>
              <Ship size={3} /> <Ship size={3} /> <Ship size={3} />
              <br></br>
              <Ship size={2} /> <Ship size={2} /> <Ship size={2} />{" "}
              <Ship size={2} />
            </div>
          </div>
        ) : null}
        <div id="game" style={{ display: "flex", justifyContent: "center" }}>
          <div id="players">
            <h2>{playerIdState}</h2>
            <h2>SCORE: {scoreState}</h2>
            <div id="board">
              <Board
                boardState={boardState}
                setBoardState={!boardSent ? setBoardState : (x) => null}
                isOpponent={false}
                answeredFieldsState={answeredFieldsState}
              />
            </div>
            {!boardSent ? (
              <button onClick={sendBoard} disabled={boardSent}>
                Send initial board
              </button>
            ) : (
              <button
                disabled={opponentBoardHash != 0}
                onClick={verifyOpponentBoard}
              >
                Verify opponent's board
              </button>
            )}
          </div>
          {opponentBoardHash != 0 ? (
            <div id="players">
              {opponentBoardHash != 0 ? <h2>{opponentIdState}</h2> : null}
              <h2>SCORE: {opponentScoreState}</h2>
              <div id="board">
                <Board
                  boardState={opponentBoardState}
                  setBoardState={constructBoardWithGuesses}
                  isOpponent={true}
                  chosenShot={chosenShot}
                  setChosenShot={turnState ? setChosenShot : (x) => null}
                />
              </div>
              <button
                onClick={sendMove}
                disabled={
                  chosenShot == null ||
                  !turnState ||
                  scoreState == 0 ||
                  opponentScoreState == 0
                }
              >
                FIREEEEE!!!
              </button>
            </div>
          ) : null}
        </div>
        <div>{textState}</div>
      </div>
      <div
        id="console"
        style={{
          display: "inline-block",
          width: "20%",
          height: "100%",
          backgroundColor: "black",
          position: "fixed",
          top: 0,
          right: 0,
          padding: 20,
          fontFamily: "Courier New",
        }}
      >
        <div>{JSON.stringify(boardHashesState)}</div>
        <div>{JSON.stringify(movesState)}</div>
        <div>{JSON.stringify(answersState)}</div>
      </div>
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
