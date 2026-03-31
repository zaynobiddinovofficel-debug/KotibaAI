const axios = require('axios');
const FormData = require('form-data');

async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  try {
    const form = new FormData();
    form.append('audio', audioBuffer, {
      filename: 'audio.webm',
      contentType: mimeType
    });

    const response = await axios.post(process.env.UZBEKVOICE_STT_URL, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.UZBEKVOICE_API_KEY}`
      },
      timeout: 15000
    });

    const text = response.data?.text || response.data?.result || '';
    return text.trim() || null;
  } catch (error) {
    console.error('STT error:', error.message);
    return null;
  }
}

module.exports = { transcribeAudio };
