const router = require('express').Router();
const jwt = require('jsonwebtoken');

// userId → Set of SSE response objects
const sseClients = new Map();

// Called by scheduler when a reminder fires
function sendReminderFired(userId, reminder) {
  const clients = sseClients.get(userId);
  if (!clients || clients.size === 0) return;

  const payload = JSON.stringify({
    type: 'reminder_fired',
    id: reminder.id,
    text: reminder.text,
    time: reminder.time,
  });

  clients.forEach((res) => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch {}
  });
}

// GET /api/notifications/stream?token=xxx
router.get('/stream', (req, res) => {
  // Accept token from query param (EventSource can't set headers)
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token kerak' });

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId || decoded.id;
  } catch {
    return res.status(401).json({ error: 'Noto\'g\'ri token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(res);

  // Send connected ping
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Heartbeat every 30s
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
    if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
  });
});

module.exports = { router, sendReminderFired };
