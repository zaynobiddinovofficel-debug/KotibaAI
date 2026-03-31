const axios = require('axios');
const FormData = require('form-data');
const OpenAI = require('openai');
const { toFile } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===================== WHISPER STT (WebM/Opus uchun) =====================

async function whisperSTT(audioBuffer, filename = 'audio.webm') {
  try {
    console.log('[WHISPER] Audio yuborilmoqda:', audioBuffer.length, 'bytes');

    const mimeType = filename.endsWith('.webm') ? 'audio/webm' : 'audio/wav';
    const file = await toFile(audioBuffer, filename, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
      // language ko'rsatilmasa Whisper o'zbek tilini avtomatik aniqlab oladi
    });

    const text = typeof transcription === 'string' ? transcription : transcription.text || '';
    console.log('[WHISPER] Natija:', text);
    return { success: true, text: text.trim() };
  } catch (error) {
    console.error('[WHISPER] Xato:', error.message);
    return { success: false, error: error.message };
  }
}

// ===================== YANDEX SPEECHKIT (asosiy) =====================

async function yandexSTT(audioBuffer) {
  try {
    console.log('[YANDEX STT] Audio yuborilmoqda:', audioBuffer.length, 'bytes');

    // Fayl formatini aniqlash (WAV, OGG, WebM)
    const isWav = audioBuffer.length > 4 &&
      audioBuffer[0] === 0x52 && audioBuffer[1] === 0x49 &&
      audioBuffer[2] === 0x46 && audioBuffer[3] === 0x46; // "RIFF"
    const isOgg = audioBuffer.length > 4 &&
      audioBuffer[0] === 0x4F && audioBuffer[1] === 0x67 &&
      audioBuffer[2] === 0x67 && audioBuffer[3] === 0x53; // "OggS"
    const isWebm = audioBuffer.length > 4 &&
      audioBuffer[0] === 0x1A && audioBuffer[1] === 0x45 &&
      audioBuffer[2] === 0xDF && audioBuffer[3] === 0xA3; // WebM/EBML

    let format = 'lpcm';
    let sampleRate = '48000';
    if (isOgg) {
      format = 'oggopus';
      sampleRate = '48000';
    } else if (isWebm) {
      format = 'oggopus';
      sampleRate = '48000';
    } else if (isWav) {
      format = 'lpcm';
      // WAV header dan sample rate olish (byte 24-27)
      if (audioBuffer.length > 27) {
        const rawRate = audioBuffer.readUInt32LE(24);
        // Yandex faqat 8000, 16000, 48000 qo'llab-quvvatlaydi
        if (rawRate <= 8000) sampleRate = '8000';
        else if (rawRate <= 24000) sampleRate = '16000';
        else sampleRate = '48000';
      }
    }

    console.log(`[YANDEX STT] Format: ${format}, SampleRate: ${sampleRate}`);

    const response = await axios.post(
      `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=uz-UZ&topic=general&format=${format}&sampleRateHertz=${sampleRate}&folderId=${process.env.YANDEX_FOLDER_ID}`,
      audioBuffer,
      {
        headers: {
          'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 30000,
        maxContentLength: 1024 * 1024,
      }
    );

    console.log('[YANDEX STT] Natija:', JSON.stringify(response.data));

    // Yandex turli formatda javob berishi mumkin
    let text = '';
    if (typeof response.data === 'string') {
      text = response.data;
    } else if (response.data.result) {
      text = response.data.result;
    } else if (response.data.text) {
      text = typeof response.data.text === 'string'
        ? response.data.text
        : response.data.text.text || response.data.text.conversation_text || '';
    }

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error('[YANDEX STT] Xato:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function yandexTTS(text) {
  try {
    console.log('[YANDEX TTS] Matn:', text.substring(0, 50));

    const params = new URLSearchParams();
    params.append('text', text);
    params.append('lang', 'uz-UZ');
    params.append('voice', 'nigora');
    params.append('folderId', process.env.YANDEX_FOLDER_ID);
    params.append('format', 'oggopus');

    const response = await axios.post(
      'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
      params.toString(),
      {
        headers: {
          'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    console.log(`[YANDEX TTS] Audio yuklandi: ${response.data.length} bytes`);

    return {
      success: true,
      audio: Buffer.from(response.data),
      contentType: 'audio/ogg',
    };
  } catch (error) {
    console.error('[YANDEX TTS] Xato:', error.response?.data?.toString?.() || error.message);
    return { success: false, error: error.message };
  }
}

// ===================== UZBEKVOICE (fallback) =====================

async function uzbekvoiceSTT(audioBuffer, filename = 'audio.wav') {
  try {
    const form = new FormData();
    form.append('file', audioBuffer, { filename, contentType: 'audio/wav' });
    form.append('language', 'uz');
    form.append('blocking', 'true');
    form.append('return_offsets', 'false');
    form.append('run_diarization', 'false');

    const response = await axios.post(
      process.env.UZBEKVOICE_STT_URL || 'https://uzbekvoice.ai/api/v1/stt',
      form,
      {
        headers: {
          Authorization: process.env.UZBEKVOICE_API_KEY,
          ...form.getHeaders(),
        },
        timeout: 30000,
      }
    );

    // UzbekVoice turli formatda qaytarishi mumkin
    let text = '';
    const data = response.data;
    if (typeof data === 'string') {
      text = data;
    } else if (data.result) {
      text = typeof data.result === 'string' ? data.result : (data.result.text || '');
    } else if (data.text) {
      text = typeof data.text === 'string' ? data.text : (data.text.text || data.text.conversation_text || '');
    }

    return {
      success: true,
      text: text.trim(),
    };
  } catch (error) {
    console.error('[UZBEKVOICE STT] Xato:', error.message);
    return { success: false, error: error.message };
  }
}

async function uzbekvoiceTTS(text, model = 'lola') {
  try {
    const response = await axios.post(
      process.env.UZBEKVOICE_TTS_URL || 'https://uzbekvoice.ai/api/v1/tts',
      { text, model, blocking: 'true' },
      {
        headers: {
          Authorization: process.env.UZBEKVOICE_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const audioUrl = response.data?.result?.url;
    if (!audioUrl) {
      return { success: false, error: 'Audio URL topilmadi' };
    }

    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return {
      success: true,
      audio: Buffer.from(audioResponse.data),
      contentType: 'audio/wav',
    };
  } catch (error) {
    console.error('[UZBEKVOICE TTS] Xato:', error.message);
    return { success: false, error: error.message };
  }
}

// ===================== ASOSIY FUNKSIYALAR (Yandex → UzbekVoice fallback) =====================

async function speechToText(audioBuffer, filename = 'audio.wav') {
  // WebM formatini aniqlash (brauzer MediaRecorder chiqaradi)
  const isWebm = audioBuffer.length > 4 &&
    audioBuffer[0] === 0x1A && audioBuffer[1] === 0x45 &&
    audioBuffer[2] === 0xDF && audioBuffer[3] === 0xA3;

  if (isWebm) {
    // Whisper WebM/Opus ni to'g'ridan-to'g'ri qabul qiladi
    console.log('[STT] WebM aniqlandi, Whisper ishlatilmoqda...');
    const whisperResult = await whisperSTT(audioBuffer, filename || 'audio.webm');
    if (whisperResult.success && whisperResult.text) {
      console.log('[STT] Whisper muvaffaqiyatli:', whisperResult.text);
      return whisperResult;
    }
    // Fallback: UzbekVoice
    console.log('[STT] Whisper ishlamadi, UzbekVoice ga o\'tish...');
    return await uzbekvoiceSTT(audioBuffer, filename || 'audio.webm');
  }

  // WAV/OGG uchun Yandex
  console.log('[STT] Yandex SpeechKit bilan urinish...');
  const yandexResult = await yandexSTT(audioBuffer);
  if (yandexResult.success && yandexResult.text) {
    console.log('[STT] Yandex muvaffaqiyatli:', yandexResult.text);
    return yandexResult;
  }

  // Fallback: UzbekVoice
  console.log('[STT] Yandex ishlamadi, UzbekVoice ga o\'tish...');
  return await uzbekvoiceSTT(audioBuffer, filename);
}

async function textToSpeech(text) {
  // 1. Yandex bilan urinish
  console.log('[TTS] Yandex SpeechKit bilan urinish...');
  const yandexResult = await yandexTTS(text);
  if (yandexResult.success && yandexResult.audio) {
    console.log('[TTS] Yandex muvaffaqiyatli');
    return yandexResult;
  }

  // 2. Fallback: UzbekVoice
  console.log('[TTS] Yandex ishlamadi, UzbekVoice ga o\'tish...');
  return await uzbekvoiceTTS(text);
}

module.exports = { speechToText, textToSpeech };
