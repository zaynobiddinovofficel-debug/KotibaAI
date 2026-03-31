const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const ExcelJS = require('exceljs');

router.use(authenticate);

// Get finances with filters
router.get('/', async (req, res, next) => {
  try {
    const { type, startDate, endDate, categoryId } = req.query;
    const where = { userId: req.userId };

    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const finances = await prisma.finance.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    res.json(finances);
  } catch (error) {
    next(error);
  }
});

// Get stats
router.get('/stats', async (req, res, next) => {
  try {
    const { period } = req.query; // month, week, year
    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [incomeSum, expenseSum, byCategory, daily] = await Promise.all([
      prisma.finance.aggregate({
        where: { userId: req.userId, type: 'income', date: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.finance.aggregate({
        where: { userId: req.userId, type: 'expense', date: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.finance.groupBy({
        by: ['categoryId'],
        where: { userId: req.userId, type: 'expense', date: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.finance.findMany({
        where: { userId: req.userId, date: { gte: startDate } },
        orderBy: { date: 'asc' },
        select: { type: true, amount: true, date: true },
      }),
    ]);

    // Get category names
    const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.id] = c;
    });

    const byCategoryWithNames = byCategory.map((c) => ({
      ...c,
      category: categoryMap[c.categoryId] || { name: 'Boshqa', icon: '📦' },
    }));

    res.json({
      totalIncome: incomeSum._sum.amount || 0,
      totalExpense: expenseSum._sum.amount || 0,
      balance: (incomeSum._sum.amount || 0) - (expenseSum._sum.amount || 0),
      byCategory: byCategoryWithNames,
      daily,
    });
  } catch (error) {
    next(error);
  }
});

// Create finance record
router.post('/', async (req, res, next) => {
  try {
    const { type, amount, currency, categoryId, note, date } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'Tur va summa kiritilishi shart' });
    }

    const finance = await prisma.finance.create({
      data: {
        userId: req.userId,
        type,
        amount: parseFloat(amount),
        currency: currency || 'UZS',
        categoryId,
        note,
        date: date ? new Date(date) : new Date(),
      },
      include: { category: true },
    });

    res.status(201).json(finance);
  } catch (error) {
    next(error);
  }
});

// Delete finance
router.put('/:id', async (req, res, next) => {
  try {
    const { type, amount, currency, note, categoryId, date } = req.body;
    const updated = await prisma.finance.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: {
        ...(type && { type }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(note !== undefined && { note }),
        ...(categoryId !== undefined && { categoryId }),
        ...(date && { date: new Date(date) }),
      },
    });
    const record = await prisma.finance.findUnique({ where: { id: req.params.id } });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.finance.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: req.userId }, { isDefault: true, userId: null }] },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Create custom category
router.post('/categories', async (req, res, next) => {
  try {
    const { name, type, icon } = req.body;
    const category = await prisma.category.create({
      data: { name, type, icon: icon || '📦', userId: req.userId },
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

// Export to Excel
router.get('/export', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const finances = await prisma.finance.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kirim-Chiqim');

    sheet.columns = [
      { header: 'Sana', key: 'date', width: 15 },
      { header: 'Tur', key: 'type', width: 10 },
      { header: 'Kategoriya', key: 'category', width: 20 },
      { header: 'Summa', key: 'amount', width: 15 },
      { header: 'Valyuta', key: 'currency', width: 10 },
      { header: 'Izoh', key: 'note', width: 30 },
    ];

    finances.forEach((f) => {
      sheet.addRow({
        date: f.date.toISOString().split('T')[0],
        type: f.type === 'income' ? 'Kirim' : 'Chiqim',
        category: f.category?.name || '-',
        amount: f.amount,
        currency: f.currency,
        note: f.note || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=kirim-chiqim.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
