const axios = require('axios');

async function synthesizeSpeech(text) {
  try {
    const response = await axios.post(
      process.env.UZBEKVOICE_TTS_URL,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${process.env.UZBEKVOICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    return Buffer.from(response.data);
  } catch (error) {
    console.error('TTS error:', error.message);
    return null;
  }
}

module.exports = { synthesizeSpeech };
