const express = require('express')
const app = express()
const cors = require('cors');
const port = 3000
const bodyParser = require('body-parser')
let cnt = 0
let board = [false];
// A boardhash is {player: a, boardhash: b, proof: c} where c proves that the board belonging to b is legal
let boardhashes = {};
// A move initially is {player: a, field: b} and after an answer arrives from player a it becomes
// {player: a, field: b, answer: c, proof: d}
let moves = {};

// Post board with userid  (/post-board/:userid)     (body: ZK Proof of hash of board)
// Query cell        (/query-cell/:userid/:cell)
// Answer query      (/answer-query/:userid/:cell)   (body: ZK Proof of value of cell + hash of board)
// Load board        (/load-board/:userid)    



app.use(bodyParser.json())

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/post-board-hash/:userid', function (req, res) {
    try {
        let player = req.params.userid;
        boardhashes[player] = req.body.boardhash;
        console.log(boardhashes);
        res.send({"success": true});
    } catch (e) {
        console.log(e);
        res.send({"success": false});
    }
})

app.get('/get-board-hash/:userid', function (req, res) {
    try {
        let player = req.params.userid;
        res.send({"succces": true, "boardhash": boardhashes[player]});
    } catch (e) {
        console.log(e);
        res.send({"success": false});
    }
})

app.post('/post-board', function (req, res) {
    //var player = req.params.userid;
    console.log(req.body.board);
    board = req.body.board;
    res.send({"success": true});
})

app.get('/get-board', function (req, res) {
    //var player = req.params.userid;
    console.log(board);
    res.send({"board": board});
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})