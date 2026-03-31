const axios = require('axios');
const FormData = require('form-data');
const nodemailer = require('nodemailer');

let eskizToken = null;
let tokenExpiresAt = null;

// Gmail transporter
let gmailTransporter = null;
function getGmailTransporter() {
  if (gmailTransporter) return gmailTransporter;
  if (process.env.GMAIL_EMAIL && process.env.GMAIL_PASSWORD) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    return gmailTransporter;
  }
  return null;
}

function isEskizConfigured() {
  return (
    process.env.ESKIZ_EMAIL &&
    process.env.ESKIZ_EMAIL !== 'your-eskiz-email' &&
    process.env.ESKIZ_PASSWORD &&
    process.env.ESKIZ_PASSWORD !== 'your-eskiz-password'
  );
}

function isGmailConfigured() {
  return (
    process.env.GMAIL_EMAIL &&
    process.env.GMAIL_PASSWORD &&
    process.env.GMAIL_PASSWORD !== 'your-gmail-app-password'
  );
}

async function getToken() {
  // Keshda bo'lsa qaytarish
  if (eskizToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return eskizToken;
  }

  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';
  console.log('[ESKIZ] Token olinyapti...');

  const form = new FormData();
  form.append('email', process.env.ESKIZ_EMAIL);
  form.append('password', process.env.ESKIZ_PASSWORD);

  const res = await axios.post(`${baseUrl}/auth/login`, form, {
    headers: form.getHeaders(),
  });

  eskizToken = res.data.data.token;
  tokenExpiresAt = Date.now() + 29 * 24 * 60 * 60 * 1000;
  console.log('[ESKIZ] Token olindi ✓');
  return eskizToken;
}

async function sendEmailOtp(toEmail, code) {
  try {
    const transporter = getGmailTransporter();
    if (!transporter) return { success: false, error: 'Gmail sozlanmagan' };

    await transporter.sendMail({
      from: `"Kotiba AI" <${process.env.GMAIL_EMAIL}>`,
      to: toEmail,
      subject: `Kotiba AI - Tasdiqlash kodi: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); border-radius: 16px;">
          <div style="background: white; border-radius: 12px; padding: 30px; text-align: center;">
            <h1 style="color: #FF9500; margin: 0 0 10px;">🤖 Kotiba AI</h1>
            <p style="color: #666; font-size: 14px;">Sizning tasdiqlash kodingiz:</p>
            <div style="background: #FFF3E0; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #FF9500; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h2>
            </div>
            <p style="color: #999; font-size: 12px;">Kod 5 daqiqa ichida amal qiladi</p>
          </div>
        </div>
      `,
    });

    console.log(`[EMAIL OTP] ${toEmail}: ${code} — yuborildi`);
    return { success: true, method: 'email' };
  } catch (error) {
    console.error('[EMAIL] Xato:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendSmsDirect(phone, message, token) {
  const baseUrl = process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api';
  const formattedPhone = phone.replace(/^\+/, '');

  const smsForm = new FormData();
  smsForm.append('mobile_phone', formattedPhone);
  smsForm.append('message', message);
  smsForm.append('from', '4546');

  const res = await axios.post(`${baseUrl}/message/sms/send`, smsForm, {
    headers: { ...smsForm.getHeaders(), Authorization: `Bearer ${token}` },
  });

  return res;
}

async function sendSms(phone, message) {
  // 1. Eskiz SMS
  if (isEskizConfigured()) {
    try {
      const token = await getToken();
      console.log(`[ESKIZ] SMS yuborish: ${phone}`);
      const res = await sendSmsDirect(phone, message, token);
      console.log(`[ESKIZ] SMS yuborildi ✓`, res.data);
      return { success: true, method: 'sms', data: res.data };
    } catch (error) {
      console.error('[ESKIZ] SMS xato:', error.response?.data || error.message);

      // Token eskirgan — yangilab qayta urinish
      if (error.response?.status === 401) {
        eskizToken = null;
        tokenExpiresAt = null;
        try {
          const token = await getToken();
          const res = await sendSmsDirect(phone, message, token);
          console.log(`[ESKIZ] SMS yuborildi (retry) ✓`, res.data);
          return { success: true, method: 'sms', data: res.data };
        } catch (retryErr) {
          console.error('[ESKIZ] Retry xato:', retryErr.response?.data || retryErr.message);
        }
      }
    }
  }

  // 2. Gmail fallback
  if (isGmailConfigured()) {
    console.log('[FALLBACK] Gmail orqali yuborish...');
    return await sendEmailOtp(process.env.GMAIL_EMAIL, message);
  }

  // 3. Demo rejim
  console.log(`[SMS DEMO] ${phone}: ${message}`);
  return { success: true, demo: true };
}

async function sendOtp(phone) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  console.log(`\n========================================`);
  console.log(`  OTP KOD: ${code} | Tel: ${phone}`);
  console.log(`========================================\n`);

  // 1. Eskiz SMS
  if (isEskizConfigured()) {
    // Eskiz moderatsiyadan o'tgan shablon formatida yuborish
    const message = `"PROHOME" platformasida ro'yxatdan o'tish uchun kod: ${code}`;
    const result = await sendSms(phone, message);

    if (result.success && result.method === 'sms') {
      return { ...result, code };
    }
    // Eskiz ishlamadi — pastga tushadi
    console.log('[OTP] Eskiz ishlamadi, fallback...');
  }

  // 2. Gmail
  if (isGmailConfigured()) {
    const result = await sendEmailOtp(process.env.GMAIL_EMAIL, code);
    return { ...result, code, demo: true };
  }

  // 3. Demo — kod responseda qaytadi
  return { success: true, demo: true, code };
}

module.exports = { sendSms, sendOtp, sendEmailOtp };
