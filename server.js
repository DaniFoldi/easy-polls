const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const debug = require('debug')('easy-polls:server')
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

async function generateId() {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let id = ''
  for (let i = 0; i < 10; i++)
    id += characters[Math.floor(Math.random() * characters.length)]
  if (polls.filter(el => el.id === id).length !== 0)
    return generateId()
  return id
}

async function zeroArray(length) {
  const a = []
  for (let i = 0; i < length; i++)
    a.push(0)
  return a
}
debug('Setting up socket.io connections')
socket.on('connection', async socket => {
  socket.on('selectpoll', data => socket.join(data.id))
})

debug('Setting up express routes')
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'views', 'create.html'))
})

app.post('/poll', async (req, res, next) => {
  debug('Registering new poll data', req.body)
  const options = req.body.options.filter(el => el !== '')
  if (options.length === 0)
    return res.json({
      error: true,
      errorMessage: 'You must choose at least one answer'
    })
  if (!req.body.question || req.body.question.length === 0)
    return res.json({
      error: true,
      errorMessage: 'Question field cannot be empty'
    })
  const id = await generateId()
  polls.push({
    id: id,
    question: req.body.question,
    options: options,
    answers: await zeroArray(options.length),
    multiple: !!req.body.multiple
  })
  res.cookie(id, 1, {
    maxAge: 315576000000
  }).json({
    url: id
  })
  debug('Registered new poll', polls[polls.length - 1])
})

app.post('/answer', async (req, res, next) => {
  if (req.cookies[req.body.id] === 1)
    return res.json({
      error: true,
      errorMessage: 'You have already answered this poll'
    })
  if (req.cookies[req.body.id] === 0)
    return res.json({
      error: true,
      errorMessage: 'You can not answer your own poll'
    })
  if (req.body.answers.length === 0)
    return res.json({
      error: true,
      errorMessage: 'You need to select an option'
    })
  const poll = polls.find(el => el.id === req.body.id)
  if (typeof poll === 'undefined')
    return res.json({
      error: true,
      errorMessage: 'This poll doesn\'t exist'
    })
  if (!poll.multiple && req.body.answers.length > 1)
    return res.json({
      error: true,
      errorMessage: 'You can only select 1 option'
    })
  for (let answer of req.body.answers) {
    if (typeof poll.answers[answer] === 'undefined')
      return res.json({
        error: true,
        errorMessage: 'Invalid option selected'
      })
  }
  debug(`Registering answers ${req.body.answers} on question ${poll.id} ${poll.question}`)
  for (let answer of req.body.answers) {
    poll.answers[answer]++
  }
  console.log(poll)
  res.cookie(req.body.id, 0, {
    maxAge: 315576000000
  }).json({})
  socket.in(req.body.id).emit('updatePoll', poll)
})

app.get('/poll/:id', async (req, res, next) => {
  if (req.cookies[req.params.id] || typeof req.query.results !== 'undefined') {
    res.sendFile(path.join(__dirname, 'views', 'statistics.html'))
  } else {
    res.sendFile(path.join(__dirname, 'views', 'answer.html'))
  }
})

app.post('/poll/:id/details', async (req, res, next) => {
  const poll = polls.find(el => el.id === req.params.id)
  if (typeof poll === 'undefined')
    return res.json({
      error: true,
      errorMessage: 'This poll doesn\'t exist'
    })
  debug(`Sending poll ${poll.id} data`, poll)
  res.json(poll)
})

server.listen(port, async () => {
  debug(`Listening on port ${port}`)
  console.log(`Listening on port ${port}`)
})

let saved = false
debug('Setting up exit triggers');
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach(async event => {
  process.on(event, async () => {
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
