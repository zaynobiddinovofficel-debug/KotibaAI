const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const ExcelJS = require('exceljs');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, note } = req.body;
    if (!name) return res.status(400).json({ error: 'Ism kiritilishi shart' });

    const client = await prisma.client.create({
      data: { userId: req.userId, name, phone, note },
    });
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.client.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add update endpoint
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, note } = req.body;
    if (!name) return res.status(400).json({ error: 'Ism kiritilishi shart' });

    const client = await prisma.client.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { name, phone: phone || null, note: note || null },
    });
    const updated = await prisma.client.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Export to Excel
router.get('/export', async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Mijozlar');

    sheet.columns = [
      { header: 'Ism', key: 'name', width: 25 },
      { header: 'Telefon', key: 'phone', width: 20 },
      { header: 'Izoh', key: 'note', width: 30 },
      { header: 'Qo\'shilgan sana', key: 'date', width: 15 },
    ];

    clients.forEach((c) => {
      sheet.addRow({
        name: c.name,
        phone: c.phone || '-',
        note: c.note || '-',
        date: c.createdAt.toISOString().split('T')[0],
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mijozlar.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
