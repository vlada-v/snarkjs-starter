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
  const [gameStarted, setGameStarted] = useState(false);

  const [consoleText, setConsoleText] = useState([
    "> Welcome to ZK-Battleship!",
    "\n",
    "> This game is an example of a partial knowledge game, which doesn't allow cheating without any information leakage and need of hiding data at some external server.",
    "\n",
    "> It uses Zero-Knowledge proofs to ensure fairness of the players without revealing the actual positioning of the ships.",
    "\n",
    "> Zero knowledge proofs are represented with a hash at the end of the shot or response.",
    "\n",
    "> ",
    "\n",
    "> ",
    "\n",
    "> To start the game choose your player ID, your opponent's player ID, and position your ships on the board.",
    "\n",
    "> Select your ships by clicking on the cells where you would like to position your ships.",
    "\n",
    "> When you are done, send your board hash to lock your ship positioning without revealing it.",
    "\n",
    "> ",
  ]);

  const [turnState, setTurnState] = useState(null);
  const [shipCountState, setShipCountState] = useState(7);
  const [opponentShipCountState, setOpponentShipCountState] = useState(7);

  const url = "https://zk.glibert.io";

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
          consoleText.push("\n");
          consoleText.push("> ");
          consoleText.push("\n");
          if (res == false) {
            setBoardSent(false);
            setTextState("Your board is illegal");
            consoleText.push(
              "> Your board is illegal!!! Choose the right number of ships, and remember that they cannot share a side or edge!"
            );
            setConsoleText(consoleText);
          } else {
            setTextState("Sending your board...");
            consoleText.push(
              "> Sending your board for your opponent to verify..."
            );
            consoleText.push("\n");
            consoleText.push("> " + JSON.stringify(boardHashProof));
            setConsoleText(consoleText);
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
                      consoleText.push("\n");
                      consoleText.push(
                        "> This username is already in usage, choose another one and resend"
                      );
                      setConsoleText(consoleText);
                    } else {
                      setSelfBoardHash(boardHashProof.boardhash);
                      consoleText.push("\n");
                      consoleText.push(
                        "> Board sent successfully! Verify the validity of opponent's board"
                      );
                      setConsoleText(consoleText);
                      setTextState("Board sent successfully");
                    }
                  } else {
                    setBoardSent(false);
                    consoleText.push("\n");
                    consoleText.push("> Sending board failed :((( Try again");
                    setConsoleText(consoleText);
                    setTextState("Sending board failed");
                  }
                });
              })
              .catch((error) => {
                console.log(error);
                setBoardSent(false);
                consoleText.push("\n");
                consoleText.push("> Sending board failed :((( Try again");
                setConsoleText(consoleText);
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
              setConsoleText([
                "> Answering query...",
                "\n",
                "> Answer sent successfully: miss, for field #" + fieldId,
                "\n",
                "> Proof: " + JSON.stringify(proofValue.proof),
              ]);
            } else {
              setTextState(
                "Answer sent successfully: " +
                  (proofValue.value == 1 ? "hit" : "ship sunk")
              );
              setConsoleText([
                "> Answering query...",
                "\n",
                "> Answer sent successfully: " +
                  (proofValue.value == 1 ? "hit" : "ship sunk") +
                  ", for field #" +
                  fieldId,
                "\n",
                "> Proof: " + JSON.stringify(proofValue.proof),
              ]);
            }
            newAnswered = answeredFieldsState.slice();
            newAnswered[fieldId] = true;
            setAnsweredFieldsState(newAnswered);
            // console.log(setAnsweredFieldsState);
            if (proofValue.value == 0) {
              setTurnState(true);
            } else if (proofValue.value > 1) {
              setShipCountState(shipCountState - 1);
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
            console.log("a", response);
            setTextState("Sending answer failed");
          }
        })
        .catch((error) => {
          console.log("b", error);
          setTextState("Sending answer failed");
        });
    });
  };

  const processQueries = () => {
    for (var query of movesState) {
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
          setConsoleText(["> Sent move successfully, waiting for reply..."]);
        })
        .catch((error) => {
          console.log(error);
          setTurnState(true);
          setTextState("Sending move failed");
          consoleText.push("\n");
          consoleText.push("> Sending move failed :((( Try again!");
          setConsoleText(consoleText);
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
        for (var i = 0; i < data.answers.length; i++) {
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
    for (var answer of answersState) {
      let currAnswer = answer;
      // console.log(currAnswer, opponentIdState);
      if (
        currAnswer.player == opponentIdState &&
        opponentBoardHash != 0 &&
        opponentBoardState[currAnswer.field] == null
      ) {
        setTextState("Verifying answer of opponent...");
        consoleText.push("\n");
        consoleText.push("> Verifying answer of opponent...");
        setConsoleText(consoleText);
        promises.push([
          currAnswer,
          verifyAnswer(currAnswer.field, currAnswer.answer, currAnswer.proof),
        ]);
      }
    }

    Promise.all(promises).then((results) => {
      for (var [currAnswer, res] of results) {
        // console.log(currAnswer, res);
        if (res) {
          newOpponentBoard[currAnswer.field] = currAnswer.answer;
          if (currAnswer.answer >= 2) {
            setOpponentShipCountState(opponentShipCountState - 1);

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
          } else {
            setTurnState(false);
          }

          setTextState("Opponent's answer verified to be legal");
          consoleText.push("\n");
          consoleText.push("> Opponent's answer verified to be legal");
          consoleText.push("\n");
          consoleText.push("> Proof: " + JSON.stringify(currAnswer.proof));
          setConsoleText(consoleText);
        } else {
          setTextState("Opponent's answer is illegal");
          consoleText.push("\n");
          consoleText.push("> Opponent's answer is illegal");
          consoleText.push("\n");
          consoleText.push(
            "> Proof (failed): " + JSON.stringify(currAnswer.proof)
          );
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
        if (shipCountState == 0 || opponentShipCountState == 0) {
          setConsoleText([
            "> Thank you for playing ZK-Battleship!",
            "\n",
            "> This game is built in a manner, that you never revealed your board to your opponent, other than when they made a shot",
            "\n",
            "> However, Zero-Knowledge proofs confirmed at every step legality of the board setup, and the answer that was sent from your side.",
            "\n",
            "> Zero knowledge proof was represented with a hash at the end of the shot or response.",
            "\n",
            "> This game is an example of a partial knowledge game, which doesn't allow cheating without any information leakage and need of hiding data at some external server.",
            "\n",
            "> We hope you liked it and appreciate your feedback.",
            "\n",
            "> ",
            "\n",
            "> ZK-Battleship team @ Hacklodge 2022: Vlada and Balázs.",
          ]);
        }
      })
      .catch((error) => {
        console.log({ error: error });
      });
  };

  const verifyOpponentBoard = () => {
    if (opponentIdState == playerIdState) {
      setTextState("You can't be your own opponent");
      consoleText.push("\n");
      consoleText.push("> You can't be your own opponent");
      setConsoleText(consoleText);
      return;
    }
    setTextState("Verifying opponent's board...");
    consoleText.push("\n");
    consoleText.push("> Verifying opponent's board...");
    for (let boardProof of boardHashesState) {
      if (boardProof.player == opponentIdState) {
        let proofValidity = verifyBoardProof(boardProof);
        proofValidity.then((res) => {
          if (res) {
            setOpponentBoardHash(boardProof.boardhash);
            setTextState("Opponent's board verified to be legal");
            consoleText.push("\n");
            consoleText.push("> " + JSON.stringify(boardProof));
            consoleText.push("\n");
            consoleText.push("> Opponent's board verified to be legal");
            setConsoleText(consoleText);
            setConsoleText([
              "> Opponent's board verified to be legal! Let's start the game!",
            ]);
          } else {
            setTextState("Opponent's board is illegal");
            consoleText.push("\n");
            consoleText.push("> " + JSON.stringify(boardProof));
            consoleText.push("\n");
            consoleText.push("> Opponent's board is illegal");
            setConsoleText(consoleText);
          }
        });
        return;
      }
    }
    setTextState("Opponent's board not found");
    consoleText.push("\n");
    consoleText.push("> Opponent's board not found");
    setConsoleText(consoleText);
  };

  const calculateStartingPlayer = () => {
    if (opponentBoardHash != 0 && selfBoardHash != 0 && !gameStarted) {
      setGameStarted(true);
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
        {opponentBoardHash == 0 && boardSent ? (
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
        {shipCountState == 0 ? (
          <h1 id="result">{playerIdState}, you lost :(((</h1>
        ) : null}
        {opponentShipCountState == 0 ? (
          <h1 id="result">{playerIdState}, you won!!!</h1>
        ) : null}
        <h3 hidden={!gameStarted}>
          {turnState == null
            ? "Processing..."
            : turnState
            ? "It's your turn"
            : "It's your opponent's turn"}
        </h3>
        {!boardSent ? (
          <div>
            <h4>
              Choose positions of your ships (so far images are just for visual
              reference):
            </h4>
            <div id="ships">
              <Ship size={5} /> <Ship size={4} />
              <br></br>
              <Ship size={3} /> <Ship size={3} />
              <br></br>
              <Ship size={2} /> <Ship size={2} /> <Ship size={2} />
            </div>
          </div>
        ) : null}
        <div id="game" style={{ display: "flex", justifyContent: "center" }}>
          <div id="players">
            <h2 hidden={!gameStarted}>{playerIdState}</h2>
            <h2 hidden={!gameStarted}>Remaining ships: {shipCountState}</h2>
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
              {opponentBoardHash != 0 ? (
                <h2 hidden={!gameStarted}>{opponentIdState}</h2>
              ) : null}
              <h2 hidden={!gameStarted}>
                Remaining ships: {opponentShipCountState}
              </h2>
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
                  shipCountState == 0 ||
                  opponentShipCountState == 0
                }
              >
                FIREEEEE!!!
              </button>
            </div>
          ) : null}
        </div>
        <h4>{textState}</h4>
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
          paddingLeft: 30,
          paddingRight: 30,
          paddingBottom: 20,
          paddingTop: 20,
          fontFamily: "Courier New",
          textAlign: "left",
          textOverflow: "ellipsis",
          overflowWrap: "anywhere",
        }}
      >
        <div
          style={{
            lineHeight: 1.5,
            textOverflow: "ellipsis",
            overflowWrap: "anywhere",
          }}
        >
          {consoleText.map((item, i) => (item == "\n" ? <br key={i} /> : item))}
        </div>
        {/* <div>{JSON.stringify(boardHashesState)}</div>
        <div>{JSON.stringify(movesState)}</div>
        <div>{JSON.stringify(answersState)}</div> */}
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
