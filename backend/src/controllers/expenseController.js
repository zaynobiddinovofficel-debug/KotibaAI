const db = require('../db')
const { getDailySummary, getWeeklySummary, getMonthlySummary } = require('../services/expenseService')

exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const query = { userId: req.userId }
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }
    const expenses = await new Promise((res, rej) => db.expenses.find(query).sort({ date: -1 }).limit(50).exec((e, d) => e ? rej(e) : res(d)))
    res.json(expenses)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.getSummary = async (req, res) => {
  try {
    const userId = req.userId
    const [daily, weekly, monthly, user] = await Promise.all([
      getDailySummary(userId), getWeeklySummary(userId), getMonthlySummary(userId),
      new Promise((res, rej) => db.users.findOne({ _id: userId }, (e, d) => e ? rej(e) : res(d)))
    ])
    res.json({ daily, weekly, monthly, monthlyIncome: user?.financeProfile?.monthlyIncome || 0, monthlyLimit: user?.financeProfile?.monthlyLimit || 0 })
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.createExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: "To'g'ri miqdor kiriting" })
    const expense = await new Promise((res, rej) => db.expenses.insert({
      userId: req.userId, amount, category: category || 'Umumiy',
      description: description || '', date: date ? new Date(date) : new Date(),
      createdAt: new Date()
    }, (e, d) => e ? rej(e) : res(d)))
    res.status(201).json(expense)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.updateExpense = async (req, res) => {
  try {
    await new Promise((res, rej) => db.expenses.update({ _id: req.params.id, userId: req.userId }, { $set: req.body }, {}, (e) => e ? rej(e) : res()))
    const expense = await new Promise((res, rej) => db.expenses.findOne({ _id: req.params.id }, (e, d) => e ? rej(e) : res(d)))
    if (!expense) return res.status(404).json({ error: 'Xarajat topilmadi' })
    res.json(expense)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.deleteExpense = async (req, res) => {
  try {
    await new Promise((res, rej) => db.expenses.remove({ _id: req.params.id, userId: req.userId }, {}, (e) => e ? rej(e) : res()))
    res.json({ message: "Xarajat o'chirildi" })
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}
