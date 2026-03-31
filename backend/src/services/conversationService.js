const db = require('../db')

async function addMessage(userId, role, content, isVoice = false) {
  const existing = await new Promise((res, rej) => db.conversations.findOne({ userId }, (e, d) => e ? rej(e) : res(d)))
  const msg = { role, content, isVoice, timestamp: new Date() }

  if (!existing) {
    await new Promise((res, rej) => db.conversations.insert({ userId, messages: [msg] }, (e, d) => e ? rej(e) : res(d)))
  } else {
    let messages = [...existing.messages, msg]
    if (messages.length > 100) messages = messages.slice(-100)
    await new Promise((res, rej) => db.conversations.update({ userId }, { $set: { messages } }, {}, (e) => e ? rej(e) : res()))
  }
}

async function getConversation(userId) {
  const conv = await new Promise((res, rej) => db.conversations.findOne({ userId }, (e, d) => e ? rej(e) : res(d)))
  return conv ? conv.messages : []
}

async function clearConversation(userId) {
  await new Promise((res, rej) => db.conversations.update({ userId }, { $set: { messages: [] } }, {}, (e) => e ? rej(e) : res()))
}

module.exports = { addMessage, getConversation, clearConversation }
