const router = require('express').Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const { sendOtp } = require('../services/eskizService');

// Generate 4-digit OTP
function genCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function genToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /auth/register — send OTP
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Ism va telefon kiritilishi shart" });

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(400).json({ error: "Bu raqam allaqachon ro'yxatdan o'tgan" });

    const code = genCode();
    console.log(`\n========================================`);
    console.log(`  OTP KOD: ${code} | Tel: ${phone}`);
    console.log(`========================================\n`);

    // Save OTP
    await prisma.otpCode.create({
      data: { phone, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    // Try to send SMS
    let smsResult = { method: 'demo' };
    try {
      smsResult = await sendOtp(phone, code);
    } catch {}

    const response = { message: 'Kod yuborildi' };
    if (smsResult.demo || smsResult.method !== 'sms') {
      response.demoCode = code;
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/verify-register
router.post('/verify-register', async (req, res, next) => {
  try {
    const { name, phone, code } = req.body;
    if (!name || !phone || !code) return res.status(400).json({ error: "Barcha maydonlar kerak" });

    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return res.status(400).json({ error: "Kod noto'g'ri yoki muddati o'tgan" });

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.create({
      data: { name, phone, isFirstLogin: true },
    });

    const token = genToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isFirstLogin: user.isFirstLogin,
        hasPin: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login — send OTP or redirect to PIN
router.post('/login', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Telefon raqam kerak" });

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(404).json({ error: "Bu raqam ro'yxatdan o'tmagan" });

    // If user has PIN, use PIN login
    if (user.pinHash) {
      return res.json({ method: 'pin' });
    }

    const code = genCode();
    console.log(`\n========================================`);
    console.log(`  OTP KOD: ${code} | Tel: ${phone}`);
    console.log(`========================================\n`);

    await prisma.otpCode.create({
      data: { phone, code, userId: user.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    let smsResult = { method: 'demo' };
    try {
      smsResult = await sendOtp(phone, code);
    } catch {}

    const response = { method: 'otp', message: 'Kod yuborildi' };
    if (smsResult.demo || smsResult.method !== 'sms') {
      response.demoCode = code;
    }
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /auth/verify-login
router.post('/verify-login', async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return res.status(400).json({ error: "Kod noto'g'ri yoki muddati o'tgan" });

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.findUnique({ where: { phone } });
    const token = genToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isFirstLogin: user.isFirstLogin,
        hasPin: !!user.pinHash,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login-pin
router.post('/login-pin', async (req, res, next) => {
  try {
    const { phone, pin } = req.body;

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.pinHash) return res.status(400).json({ error: "PIN topilmadi" });

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) return res.status(401).json({ error: "PIN noto'g'ri" });

    const token = genToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isFirstLogin: user.isFirstLogin,
        hasPin: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/set-pin
router.post('/set-pin', authenticate, async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4) return res.status(400).json({ error: "4 xonali PIN kerak" });

    const pinHash = await bcrypt.hash(pin, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { pinHash } });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /auth/first-login-done
router.post('/first-login-done', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { isFirstLogin: false },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /auth/profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      isFirstLogin: user.isFirstLogin,
      hasPin: !!user.pinHash,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /auth/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { ...(name && { name }) },
    });
    res.json({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      isFirstLogin: updated.isFirstLogin,
      hasPin: !!updated.pinHash,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
