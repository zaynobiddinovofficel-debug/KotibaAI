const db = require('../db')

function sumExpenses(expenses) {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
}

async function findExpenses(userId, since) {
  return new Promise((res, rej) => db.expenses.find({ userId, date: { $gte: since } }, (e, d) => e ? rej(e) : res(d)))
}

async function getDailySummary(userId) {
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const expenses = await findExpenses(userId, start)
  return { total: sumExpenses(expenses), count: expenses.length }
}

async function getWeeklySummary(userId) {
  const start = new Date(); start.setDate(start.getDate() - start.getDay()); start.setHours(0, 0, 0, 0)
  const expenses = await findExpenses(userId, start)
  return { total: sumExpenses(expenses), count: expenses.length }
}

async function getMonthlySummary(userId) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const expenses = await findExpenses(userId, start)
  return { total: sumExpenses(expenses), count: expenses.length }
}

module.exports = { getDailySummary, getWeeklySummary, getMonthlySummary }
