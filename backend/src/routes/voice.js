const router = require('express').Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { speechToText, textToSpeech } = require('../services/uzbekvoiceService');
const { processVoiceCommand } = require('../services/openaiService');
const { scheduleReminder } = require('../services/schedulerService');
const prisma = require('../db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// POST /voice/process — audio → STT → AI process → response
router.post('/process', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio fayl kerak' });

    console.log('[VOICE] Audio qabul qilindi:', req.file.size, 'bytes');

    // 1. STT — audio → text
    const sttResult = await speechToText(req.file.buffer, req.file.originalname || 'audio.wav');

    if (!sttResult.success || !sttResult.text) {
      return res.json({ transcript: null, ai_result: null, silent: true });
    }

    console.log('[VOICE] STT natija:', sttResult.text);

    // 2. AI process — text → result
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const aiResult = await processVoiceCommand(sttResult.text, user?.name || 'Foydalanuvchi');

    // 3. Auto-create based on type
    if (aiResult.type === 'reminder' && aiResult.data) {
      const reminder = await prisma.reminder.create({
        data: {
          userId: req.userId,
          text: aiResult.data.text || sttResult.text,
          date: aiResult.data.date ? new Date(aiResult.data.date) : new Date(),
          time: aiResult.data.time || '09:00',
          repeatType: aiResult.data.repeat_type || 'once',
          notificationType: 'push',
        },
      });
      scheduleReminder(reminder);
      aiResult.created = { type: 'reminder', data: reminder };
    } else if (aiResult.type === 'meeting' && aiResult.data) {
      // Uchrashuv: ham eslatma ham vazifa yaratish
      const created = {};
      if (aiResult.data.reminder) {
        const r = aiResult.data.reminder;
        const reminder = await prisma.reminder.create({
          data: {
            userId: req.userId,
            text: r.text || sttResult.text,
            date: r.date ? new Date(r.date) : new Date(),
            time: r.time || '09:00',
            repeatType: r.repeat_type || 'once',
            notificationType: 'push',
          },
        });
        scheduleReminder(reminder);
        created.reminder = reminder;
      }
      if (aiResult.data.task) {
        const t = aiResult.data.task;
        const task = await prisma.task.create({
          data: {
            userId: req.userId,
            text: t.text || sttResult.text,
            deadline: t.deadline ? new Date(t.deadline) : null,
          },
        });
        created.task = task;
      }
      aiResult.created = { type: 'meeting', data: created };
    } else if ((aiResult.type === 'expense' || aiResult.type === 'income') && aiResult.data) {
      let categoryId = null;
      if (aiResult.data.category) {
        const cat = await prisma.category.findFirst({
          where: {
            userId: req.userId,
            name: { contains: aiResult.data.category, mode: 'insensitive' },
            type: aiResult.type === 'expense' ? 'expense' : 'income',
          },
        });
        categoryId = cat?.id;
      }
      const finance = await prisma.finance.create({
        data: {
          userId: req.userId,
          type: aiResult.type,
          amount: parseFloat(aiResult.data.amount) || 0,
          currency: aiResult.data.currency || 'UZS',
          categoryId,
          note: aiResult.data.note || '',
          date: new Date(),
        },
      });
      aiResult.created = { type: 'finance', data: finance };
    } else if (aiResult.type === 'task' && aiResult.data) {
      const task = await prisma.task.create({
        data: {
          userId: req.userId,
          text: aiResult.data.text || sttResult.text,
          deadline: aiResult.data.deadline ? new Date(aiResult.data.deadline) : null,
        },
      });
      aiResult.created = { type: 'task', data: task };
    }

    // Save AI messages
    await prisma.aiMessage.createMany({
      data: [
        { userId: req.userId, role: 'user', content: sttResult.text, type: aiResult.type },
        { userId: req.userId, role: 'assistant', content: aiResult.response_text, type: aiResult.type },
      ],
    });

    res.json({
      transcript: sttResult.text,
      ai_result: aiResult,
    });
  } catch (error) {
    console.error('[VOICE] Xatolik:', error.message);
    res.status(500).json({ error: 'Ovoz qayta ishlashda xatolik' });
  }
});

// POST /voice/stt — audio → text (faqat STT)
router.post('/stt', authenticate, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio fayl kerak' });

    const result = await speechToText(req.file.buffer, req.file.originalname || 'audio.wav');

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'STT xatolik' });
    }

    res.json({ text: result.text });
  } catch (error) {
    console.error('[STT] Xatolik:', error.message);
    res.status(500).json({ error: 'STT xatolik' });
  }
});

// POST /voice/tts — text → audio buffer
router.post('/tts', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Matn kerak' });

    const result = await textToSpeech(text);

    if (!result.success || !result.audio) {
      return res.status(500).json({ error: result.error || 'TTS xatolik' });
    }

    res.set({
      'Content-Type': result.contentType || 'audio/wav',
      'Content-Length': result.audio.length,
    });
    res.send(result.audio);
  } catch (error) {
    console.error('[TTS] Xatolik:', error.message);
    res.status(500).json({ error: 'TTS xatolik' });
  }
});

module.exports = router;
