const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get tasks
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { userId: req.userId };
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/', async (req, res, next) => {
  try {
    const { text, deadline, priority } = req.body;
    if (!text) return res.status(400).json({ error: 'Vazifa matni kerak' });

    const task = await prisma.task.create({
      data: {
        userId: req.userId,
        text,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'normal',
      },
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findFirst({ where: { id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Vazifa topilmadi' });

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(req.body.text && { text: req.body.text }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.priority && { priority: req.body.priority }),
        ...(req.body.deadline !== undefined && { deadline: req.body.deadline ? new Date(req.body.deadline) : null }),
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.task.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Complete/toggle task
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!task) return res.status(404).json({ error: 'Vazifa topilmadi' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: task.status === 'pending' ? 'completed' : 'pending' },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
