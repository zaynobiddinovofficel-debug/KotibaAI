const { handleAssistantMessage } = require('../services/assistantService');
const { addMessage } = require('../services/conversationService');

exports.respond = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Xabar kiritish shart' });
    }

    await addMessage(req.userId, 'user', text.trim(), false);
    const result = await handleAssistantMessage(req.userId, text.trim());
    await addMessage(req.userId, 'assistant', result.assistant_reply, false);

    res.json(result);
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ error: 'Serverda xatolik' });
  }
};
