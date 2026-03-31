const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { sendSms } = require('../services/eskizService');

router.use(authenticate);

router.post('/send', async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Telefon va xabar kiritilishi shart' });
    }

    const result = await sendSms(phone, message);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
