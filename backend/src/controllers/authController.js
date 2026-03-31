const { register, login } = require('../services/authService')
const db = require('../db')

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" })
    const result = await register(name, email, password)
    res.json(result)
  } catch (error) { res.status(400).json({ error: error.message }) }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email va parol kiritish shart' })
    const result = await login(email, password)
    res.json(result)
  } catch (error) { res.status(401).json({ error: error.message }) }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await new Promise((res, rej) => db.users.findOne({ _id: req.userId }, (e, d) => e ? rej(e) : res(d)))
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' })
    const { password, ...safeUser } = user
    res.json(safeUser)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.updateProfile = async (req, res) => {
  try {
    const { name, preferences, financeProfile } = req.body
    const updates = {}
    if (name) updates.name = name
    if (preferences) {
      Object.keys(preferences).forEach(k => { updates[`preferences.${k}`] = preferences[k] })
    }
    if (financeProfile) {
      Object.keys(financeProfile).forEach(k => { updates[`financeProfile.${k}`] = financeProfile[k] })
    }
    await new Promise((res, rej) => db.users.update({ _id: req.userId }, { $set: updates }, {}, (e) => e ? rej(e) : res()))
    const user = await new Promise((res, rej) => db.users.findOne({ _id: req.userId }, (e, d) => e ? rej(e) : res(d)))
    const { password, ...safeUser } = user
    res.json(safeUser)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}
