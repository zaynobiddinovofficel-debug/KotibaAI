const { getConversation, clearConversation } = require('../services/conversationService')

exports.getHistory = async (req, res) => {
  try {
    const messages = await getConversation(req.userId)
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: 'Serverda xatolik' })
  }
}

exports.clearHistory = async (req, res) => {
  try {
    await clearConversation(req.userId)
    res.json({ message: 'Suhbat tozalandi' })
  } catch (error) {
    res.status(500).json({ error: 'Serverda xatolik' })
  }
}
