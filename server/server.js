const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const bodyParser = require("body-parser");
let cnt = 0;
let board = [false];
// A boardhash is {player: a, boardhash: b, proof: c} where c proves that the board belonging to b is legal
let boardhashes = [];
// A move is {player: a, field: b} where the guess is for player a's board's field b
let moves = [];
// After an answer arrives from player a to a move, {player: a, field: b, answer: c, proof: d} is stored here
let answers = [];

// Post board with userid  (/post-board-hash/:userid)     (body: ZK Proof of hash of board)
// Query cell        (/post-move/:userid/:cell)
// Answer query      (/answer-query/:userid/:cell)   (body: ZK Proof of value of cell + hash of board)
// Load board        (/load-board/:userid)

app.use(bodyParser.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/post-board-hash/:userid", function (req, res) {
  try {
    let player = req.params.userid;
    for (boardhash of boardhashes) {
      if (boardhash.player == player) {
        res.send({ success: false });
        return;
      }
    }
    boardhashes.push({
      player: player,
      boardhash: req.body.boardhash,
      proof: req.body.proof,
      time: Date.now(),
    });
    console.log(boardhashes);
    res.send({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).send({ success: false });
  }
});

app.get("/post-move/:userid/:field", function (req, res) {
  console.log("a");
  moves.push({
    player: req.params.userid,
    field: req.params.field,
    time: Date.now(),
  });
  res.send({ success: true });
});

app.post("/answer-query/:userid/:field", function (req, res) {
  answers.push({
    player: req.params.userid,
    field: req.params.field,
    answer: req.body.value,
    proof: req.body.proof,
    time: Date.now(),
  });
  res.send({ success: true });
});

app.get("/get-board-hash/:userid", function (req, res) {
  try {
    let player = req.params.userid;
    res.send({ succces: true, boardhash: boardhashes[player] });
  } catch (e) {
    console.log(e);
    res.send({ success: false });
  }
});

app.post("/post-board", function (req, res) {
  //var player = req.params.userid;
  console.log(req.body.board);
  board = req.body.board;
  res.send({ success: true });
});

app.get("/get-board", function (req, res) {
  //var player = req.params.userid;
  console.log(board);
  res.send({ board: board });
});

app.get("/get-game-state", function (req, res) {
  let newBoardhashes = [];
  for (boardhash of boardhashes) {
    if (boardhash.time + 1000 * 60 * 60 > Date.now()) {
      newBoardhashes.push(boardhash);
    }
  }
  let newMoves = [];
  for (move of moves) {
    if (move.time + 1000 * 60 * 60 > Date.now()) {
      newMoves.push(move);
    }
  }
  let newAnswers = [];
  for (answer of answers) {
    if (answer.time + 1000 * 60 * 60 > Date.now()) {
      newAnswers.push(answer);
    }
  }
  boardhashes = newBoardhashes;
  moves = newMoves;
  answers = newAnswers;
  console.log(moves, answers);
  res.send({ boardhashes: boardhashes, moves: moves, answers: answers });
});

app.listen(port, () => {
  console.log(`Battleship server listening at http://localhost:${port}`);
});
