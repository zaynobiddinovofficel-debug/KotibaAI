require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { restoreScheduledReminders, initWebPush } = require('./services/schedulerService')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/voice', require('./routes/voice'))
app.use('/api/assistant', require('./routes/assistant'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api/expenses', require('./routes/expenses'))
app.use('/api/conversations', require('./routes/conversations'))
app.use('/api/push', require('./routes/push'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'KotibaAI' }))
app.use(require('./middleware/errorHandler'))

const PORT = process.env.PORT || 5000

initWebPush()
restoreScheduledReminders().then(() => {
  app.listen(PORT, () => console.log(`KotibaAI server ${PORT}-portda ishlamoqda`))
}).catch(err => {
  console.error('Startup error:', err.message)
  app.listen(PORT, () => console.log(`KotibaAI server ${PORT}-portda ishlamoqda`))
})
