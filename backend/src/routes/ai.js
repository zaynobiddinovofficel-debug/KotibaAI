const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { processVoiceCommand, chat, getFinanceAdvice } = require('../services/openaiService');

router.use(authenticate);

// Process voice command (after STT)
router.post('/process', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Matn kiritilishi shart' });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const result = await processVoiceCommand(text, user.name);

    // Save AI message
    await prisma.aiMessage.createMany({
      data: [
        { userId: req.userId, role: 'user', content: text, type: result.type },
        { userId: req.userId, role: 'assistant', content: result.response_text, type: result.type },
      ],
    });

    // Auto-create based on type
    if (result.type === 'reminder' && result.data) {
      const reminder = await prisma.reminder.create({
        data: {
          userId: req.userId,
          text: result.data.text || text,
          date: result.data.date ? new Date(result.data.date) : new Date(),
          time: result.data.time || '09:00',
          repeatType: result.data.repeat_type || 'once',
          notificationType: 'push',
        },
      });
      result.created = { type: 'reminder', data: reminder };
    } else if ((result.type === 'expense' || result.type === 'income') && result.data) {
      // Find or create category
      let categoryId = null;
      if (result.data.category) {
        const cat = await prisma.category.findFirst({
          where: {
            userId: req.userId,
            name: { contains: result.data.category, mode: 'insensitive' },
            type: result.type === 'expense' ? 'expense' : 'income',
          },
        });
        categoryId = cat?.id;
      }

      const finance = await prisma.finance.create({
        data: {
          userId: req.userId,
          type: result.type,
          amount: parseFloat(result.data.amount) || 0,
          currency: result.data.currency || 'UZS',
          categoryId,
          note: result.data.note || '',
          date: new Date(),
        },
      });
      result.created = { type: 'finance', data: finance };
    } else if (result.type === 'task' && result.data) {
      const task = await prisma.task.create({
        data: {
          userId: req.userId,
          text: result.data.text || text,
          deadline: result.data.deadline ? new Date(result.data.deadline) : null,
        },
      });
      result.created = { type: 'task', data: task };
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Chat with AI
router.post('/chat', async (req, res, next) => {
  try {
    const { messages } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const reply = await chat(messages, user.name);

    await prisma.aiMessage.create({
      data: { userId: req.userId, role: 'assistant', content: reply, type: 'chat' },
    });

    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

// Get AI advice
router.get('/advice', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [finances, tasks, reminders] = await Promise.all([
      prisma.finance.findMany({
        where: { userId: req.userId, date: { gte: startOfMonth } },
        include: { category: true },
      }),
      prisma.task.findMany({ where: { userId: req.userId, status: 'pending' } }),
      prisma.reminder.findMany({ where: { userId: req.userId, status: 'active' } }),
    ]);

    const totalIncome = finances.filter((f) => f.type === 'income').reduce((s, f) => s + f.amount, 0);
    const totalExpense = finances.filter((f) => f.type === 'expense').reduce((s, f) => s + f.amount, 0);

    const userData = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingTasks: tasks.length,
      activeReminders: reminders.length,
      topExpenses: finances
        .filter((f) => f.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((f) => ({ amount: f.amount, category: f.category?.name, note: f.note })),
    };

    const advice = await getFinanceAdvice(userData, user.name);

    res.json({
      advice,
      stats: userData,
      warnings: totalExpense > totalIncome
        ? [`${user.name}, bu oylik harajatlaringiz oshib ketyapti! Chiqimlarni kamaytiring!`]
        : [],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
