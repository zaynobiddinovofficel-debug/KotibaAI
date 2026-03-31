require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { restoreScheduledReminders } = require('./services/schedulerService');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/voice', require('./routes/voice'));
const { router: notificationsRouter } = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Kotiba AI', version: '2.0.0' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;

// Start reminder cron
restoreScheduledReminders().catch(() => {});
console.log('Reminder scheduler ishga tushdi');

app.listen(PORT, () => {
  console.log(`Kotiba AI server ${PORT}-portda ishlamoqda`);
});

module.exports = app;
