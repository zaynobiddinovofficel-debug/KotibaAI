const db = require('../db')
const { scheduleReminder, cancelReminder } = require('../services/schedulerService')

exports.getTasks = async (req, res) => {
  try {
    const { filter } = req.query
    const query = { userId: req.userId }
    if (filter === 'active') query.completed = false
    if (filter === 'completed') query.completed = true
    const tasks = await new Promise((res, rej) => db.tasks.find(query).sort({ createdAt: -1 }).exec((e, d) => e ? rej(e) : res(d)))
    res.json(tasks)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, remindBeforeMinutes, isVoiceReminder, reminderText } = req.body
    if (!title) return res.status(400).json({ error: 'Vazifa nomi kerak' })
    const due = dueDate ? new Date(dueDate) : null
    let remindAt = null
    if (due && remindBeforeMinutes >= 0) remindAt = new Date(due.getTime() - (remindBeforeMinutes || 0) * 60000)
    const task = await new Promise((res, rej) => db.tasks.insert({
      userId: req.userId, title, description: description || '',
      dueDate: due, remindAt, remindBeforeMinutes: remindBeforeMinutes || 0,
      isVoiceReminder: isVoiceReminder !== false,
      reminderText: reminderText || title,
      completed: false, reminded: false, priority: 'medium',
      createdAt: new Date()
    }, (e, d) => e ? rej(e) : res(d)))
    if (remindAt && remindAt > new Date()) scheduleReminder(task)
    res.status(201).json(task)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }
    if (updates.dueDate && updates.remindBeforeMinutes !== undefined) {
      updates.remindAt = new Date(new Date(updates.dueDate).getTime() - (updates.remindBeforeMinutes || 0) * 60000)
    }
    await new Promise((res, rej) => db.tasks.update({ _id: id, userId: req.userId }, { $set: updates }, {}, (e) => e ? rej(e) : res()))
    const task = await new Promise((res, rej) => db.tasks.findOne({ _id: id }, (e, d) => e ? rej(e) : res(d)))
    if (!task) return res.status(404).json({ error: 'Vazifa topilmadi' })
    cancelReminder(id)
    if (task.remindAt && new Date(task.remindAt) > new Date() && !task.completed) scheduleReminder(task)
    res.json(task)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params
    await new Promise((res, rej) => db.tasks.remove({ _id: id, userId: req.userId }, {}, (e) => e ? rej(e) : res()))
    cancelReminder(id)
    res.json({ message: "Vazifa o'chirildi" })
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}

exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params
    await new Promise((res, rej) => db.tasks.update({ _id: id, userId: req.userId }, { $set: { completed: true } }, {}, (e) => e ? rej(e) : res()))
    const task = await new Promise((res, rej) => db.tasks.findOne({ _id: id }, (e, d) => e ? rej(e) : res(d)))
    if (!task) return res.status(404).json({ error: 'Vazifa topilmadi' })
    cancelReminder(id)
    res.json(task)
  } catch { res.status(500).json({ error: 'Serverda xatolik' }) }
}
