const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
let cnt = 0

app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/secret-data', (req, res) => {
    res.send('zk-battleship')
})
  
app.get('/users/:userId/books/:bookId', function (req, res) {
    res.send(req.params)
})

app.post('/increment', (req, res) => {
    cnt += req.body.amountToIncrement;
    res.send({count: cnt});
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})