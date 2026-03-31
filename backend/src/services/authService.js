const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'kotibaai_secret_key', { expiresIn: '30d' })
}

async function register(name, email, password) {
  const existing = await new Promise((res, rej) => db.users.findOne({ email }, (e, d) => e ? rej(e) : res(d)))
  if (existing) throw new Error("Bu email allaqachon ro'yxatdan o'tgan")

  const hashed = await bcrypt.hash(password, 12)
  const user = await new Promise((res, rej) => db.users.insert({
    name, email, password: hashed,
    preferences: { voiceReminders: true, screenReminders: true, darkMode: false, pushEnabled: false, pushSubscription: null },
    financeProfile: { monthlyIncome: 0, monthlyLimit: 0 },
    createdAt: new Date()
  }, (e, d) => e ? rej(e) : res(d)))

  const token = generateToken(user._id)
  return { token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences, financeProfile: user.financeProfile } }
}

async function login(email, password) {
  const user = await new Promise((res, rej) => db.users.findOne({ email }, (e, d) => e ? rej(e) : res(d)))
  if (!user) throw new Error("Email yoki parol noto'g'ri")
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) throw new Error("Email yoki parol noto'g'ri")
  const token = generateToken(user._id)
  return { token, user: { id: user._id, name: user.name, email: user.email, preferences: user.preferences, financeProfile: user.financeProfile } }
}

module.exports = { register, login, generateToken }
