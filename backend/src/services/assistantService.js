const { processMessage } = require('./geminiService')
const db = require('../db')
const { scheduleReminder } = require('./schedulerService')

async function handleAssistantMessage(userId, userText) {
  const user = await new Promise((res, rej) => db.users.findOne({ _id: userId }, (e, d) => e ? rej(e) : res(d)))

  const activeTasks = await new Promise((res, rej) => db.tasks.count({ userId, completed: false }, (e, d) => e ? rej(e) : res(d)))

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyExpenseDocs = await new Promise((res, rej) => db.expenses.find({ userId, date: { $gte: startOfMonth } }, (e, d) => e ? rej(e) : res(d)))
  const monthlyExpenses = monthlyExpenseDocs.reduce((sum, e) => sum + (e.amount || 0), 0)

  const context = {
    userName: user.name,
    activeTasks,
    monthlyExpenses,
    monthlyIncome: user.financeProfile?.monthlyIncome || 0,
    monthlyLimit: user.financeProfile?.monthlyLimit || 0,
    currentTime: now.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })
  }

  const result = await processMessage(userText, context)

  const createdTasks = []
  if (result.tasks?.length > 0) {
    for (const taskData of result.tasks) {
      const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null
      let remindAt = null
      if (dueDate && taskData.remindBeforeMinutes >= 0) {
        remindAt = new Date(dueDate.getTime() - (taskData.remindBeforeMinutes || 0) * 60000)
      }
      const task = await new Promise((res, rej) => db.tasks.insert({
        userId, title: taskData.title, description: taskData.description || '',
        dueDate, remindAt, remindBeforeMinutes: taskData.remindBeforeMinutes || 0,
        isVoiceReminder: taskData.isVoiceReminder !== false,
        reminderText: taskData.reminderText || taskData.title,
        completed: false, reminded: false, priority: 'medium', createdAt: new Date()
      }, (e, d) => e ? rej(e) : res(d)))
      createdTasks.push(task)
      if (remindAt && remindAt > new Date()) scheduleReminder(task)
    }
  }

  const createdExpenses = []
  if (result.expenses?.length > 0) {
    for (const expData of result.expenses) {
      const expense = await new Promise((res, rej) => db.expenses.insert({
        userId, amount: expData.amount, category: expData.category || 'Umumiy',
        description: expData.description || '', date: expData.date ? new Date(expData.date) : new Date(),
        createdAt: new Date()
      }, (e, d) => e ? rej(e) : res(d)))
      createdExpenses.push(expense)
    }
  }

  if (result.finance_profile) {
    const updates = {}
    if (result.finance_profile.monthlyIncome) updates['financeProfile.monthlyIncome'] = result.finance_profile.monthlyIncome
    if (result.finance_profile.monthlyLimit) updates['financeProfile.monthlyLimit'] = result.finance_profile.monthlyLimit
    if (Object.keys(updates).length > 0) {
      await new Promise((res, rej) => db.users.update({ _id: userId }, { $set: updates }, {}, (e) => e ? rej(e) : res()))
    }
  }

  return { intent: result.intent, assistant_reply: result.assistant_reply, createdTasks, createdExpenses, finance_profile: result.finance_profile }
}

module.exports = { handleAssistantMessage }
