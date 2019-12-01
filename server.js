const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const debug = require('debug')('easy-polls')
const express = require('express')
const json5 = require('json5')
const io = require('socket.io')

const fs = require('fs')
const http = require('http')
const path = require('path')

const port = process.env.PORT || 3000
const pollsfile = process.env.POLLSFILE || 'polls.json5'

const app = express()
const server = http.createServer(app)
const socket = io(server)

let polls
try {
  const file = path.isAbsolute(pollsfile) ? pollsfile : path.join(__dirname, pollsfile)
  debug(`Loading polls from ${file}`)
  polls = json5.parse(fs.readFileSync(file)).polls
} catch (error) {
  debug('Polls file missing or not readable')
  polls = []
}
debug(`Loaded ${polls.length} polls`)

debug('Setting up express middlewares')
app.disable('x-powered-by')
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(cookieParser())

app.use((req, res, next) => {
  debug(req.method, req.url)
  next()
})
app.use(express.static('public'))

function generateId() {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let id = ''
  for (let i = 0; i < 10; i++)
    id += characters[Math.floor(Math.random() * characters.length)]
  if (polls.filter(el => el.id === id).length !== 0)
    return generateId()
  return id
}

function zeroArray(length) {
  const a = []
  for (let i = 0; i < length; i++)
    a.push(0)
  return a
}
debug('Setting up socket.io connections')
socket.on('connection', socket => {
  socket.on('selectpoll', data => socket.join(data.id))
})

debug('Setting up express routes')
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html'))
})

app.post('/poll', (req, res, next) => {
  debug('Registering new poll data', req.body)
  const options = req.body.options.filter(el => el !== '')
  if (options.length === 0 || req.body.question.length === 0)
    return res.json({
      error: true
    })
  const id = generateId()
  polls.push({
    id: id,
    question: req.body.question,
    options: options,
    answers: zeroArray(options.length)
  })
  res.cookie(req.body.id, 1, {
    maxAge: 315576000000
  }).json({
    url: id
  })
  debug('Registered new poll', polls[polls.length - 1])
})

app.post('/answer', (req, res, next) => {
  if (req.cookies[req.body.id] === 1 || req.cookies[req.body.id] === 0)
    return res.json({
      error: true
    })
  const poll = polls.find(el => el.id === req.body.id)
  if (typeof poll.answers[req.body.answer] === 'undefined')
    return res.json({
      error: true
    })
  debug(`Registering answer ${poll.options[req.body.answer]} on question ${poll.id} ${poll.question}`)
  poll.answers[req.body.answer]++
  res.cookie(req.body.id, 0, {
    maxAge: 315576000000
  }).json({})
  socket.in(req.body.id).emit('poll', poll)
})

app.get('/poll/:id', (req, res, next) => {
  if (req.cookies[req.params.id] || typeof req.query.result !== 'undegined') {
    res.sendFile(path.join(__dirname, 'views', 'statistics.html'))
  } else {
    res.sendFile(path.join(__dirname, 'views', 'answer.html'))
  }
})

app.post('/poll/:id/details', (req, res, next) => {
  const poll = polls.find(el => el.id === req.params.id)
  if (typeof poll === 'undefined')
    return res.json({
      error: true
    })
  debug(`Sending poll ${poll.id} data`, poll)
  res.json(poll)
})

server.listen(port, () => {
  debug(`Listening on port ${port}`)
  console.log(`Listening on port ${port}`)
})

let saved = false
debug('Setting up exit triggers');
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach(event => {
  process.on(event, () => {
    if (saved)
      return
    saved = true
    debug(`Received ${event}`)
    const file = path.isAbsolute(pollsfile) ? pollsfile : path.join(__dirname, pollsfile)
    debug(`Saving polls to ${file}`)
    fs.writeFileSync(file, json5.stringify({
      polls
    }))
    debug(`Saved ${polls.length} polls`)
    process.exit(0)
  })
})
