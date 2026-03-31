const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { scheduleReminder, cancelReminder } = require('../services/schedulerService');

router.use(authenticate);

// Get all reminders
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { userId: req.userId };
    if (status) where.status = status;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { date: 'asc' },
    });
    res.json(reminders);
  } catch (error) {
    next(error);
  }
});

// Create reminder
router.post('/', async (req, res, next) => {
  try {
    const { text, date, time, repeatType, notificationType } = req.body;

    if (!text || !date || !time) {
      return res.status(400).json({ error: "Matn, sana va vaqt kiritilishi shart" });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: req.userId,
        text,
        date: new Date(date),
        time,
        repeatType: repeatType || 'once',
        notificationType: notificationType || 'push',
      },
    });

    scheduleReminder(reminder);
    res.status(201).json(reminder);
  } catch (error) {
    next(error);
  }
});

// Update reminder
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: req.userId },
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Eslatma topilmadi' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(req.body.text && { text: req.body.text }),
        ...(req.body.date && { date: new Date(req.body.date) }),
        ...(req.body.time && { time: req.body.time }),
        ...(req.body.repeatType && { repeatType: req.body.repeatType }),
        ...(req.body.notificationType && { notificationType: req.body.notificationType }),
        ...(req.body.status && { status: req.body.status }),
      },
    });

    // Re-schedule with updated data
    cancelReminder(id);
    if (updated.status === 'active') scheduleReminder(updated);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete reminder
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.reminder.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
