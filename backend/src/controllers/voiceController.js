const { transcribeAudio } = require('../services/sttService');
const { synthesizeSpeech } = require('../services/ttsService');
const { handleAssistantMessage } = require('../services/assistantService');
const { addMessage } = require('../services/conversationService');

exports.processVoice = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio fayl kerak' });

    const audioBuffer = req.file.buffer;
    const transcript = await transcribeAudio(audioBuffer, req.file.mimetype);

    if (!transcript) {
      // Silent fail - no harsh error
      return res.json({
        transcript: null,
        assistant_reply: null,
        silent: true
      });
    }

    // Save user voice message
    await addMessage(req.userId, 'user', transcript, true);

    // Process with assistant
    const result = await handleAssistantMessage(req.userId, transcript);

    // Save assistant message
    await addMessage(req.userId, 'assistant', result.assistant_reply, false);

    res.json({
      transcript,
      ...result
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: 'Ovoz qayta ishlashda xatolik' });
  }
};

exports.speak = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Matn kerak' });

    const audioBuffer = await synthesizeSpeech(text);
    if (!audioBuffer) return res.status(500).json({ error: 'Nutq yaratishda xatolik' });

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Nutq yaratishda xatolik' });
  }
};
