const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Siz KotibaAI — o'zbek tilidagi shaxsiy kotibsiz.

MUHIM QOIDALAR:
1. Har doim O'ZBEK tilida javob bering
2. Javobni FAQAT quyidagi JSON formatda bering (boshqa hech narsa yozmang):
{
  "intent": "chat|reminder|task|expense|finance|mixed",
  "assistant_reply": "Qisqa, iliq, amaliy javob o'zbek tilida",
  "tasks": [
    {
      "title": "Vazifa nomi",
      "description": "Tavsif",
      "dueDate": "ISO8601 sana yoki null",
      "remindBeforeMinutes": 0,
      "isVoiceReminder": true,
      "reminderText": "10 minutdan keyin uchrashuvingiz bor"
    }
  ],
  "expenses": [
    {
      "amount": 500000,
      "category": "Umumiy",
      "description": "Tavsif",
      "date": "ISO8601 sana"
    }
  ],
  "finance_profile": null
}

VAQT IFODALARI:
- "ertaga soat 3 da" = keyingi kun soat 15:00
- "bugun soat 5 da" = bugun soat 17:00
- "30 minut oldin eslat" = remindBeforeMinutes: 30
- "10 minut oldin" = remindBeforeMinutes: 10
- "1 soat oldin" = remindBeforeMinutes: 60
- "1 kun oldin" = remindBeforeMinutes: 1440

ESLATMA MATNI (reminderText):
- 0 min: "Uchrashuvingiz boshlanmoqda"
- 10 min: "10 minutdan keyin uchrashuvingiz bor"
- 30 min: "Yarim soatdan keyin [vazifa]"
- 60 min: "Bir soatdan keyin [vazifa]"
- 1440 min: "Ertaga [vazifa] esingizda bo'lsin"

MOLIYA MASLAHATI:
Agar xarajat oylik daromad yoki limitdan 80% dan oshsa:
"Bu oy ko'p xarajat qilib yubordingiz, pulni tejab ishlating."

Javob qisqa va amaliy bo'lsin. Uzun matn yozmang.`;

async function processMessage(userText, context = {}) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    const contextStr = buildContextString(context);
    const prompt = `${SYSTEM_PROMPT}\n\n${contextStr}\n\nFoydalanuvchi: ${userText}\n\nJSON javob:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        intent: 'chat',
        assistant_reply: 'Tushundim, yordamchi bo\'lamiz.',
        tasks: [],
        expenses: [],
        finance_profile: null
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini error:', error.message);
    return {
      intent: 'chat',
      assistant_reply: 'Kechirasiz, hozir ishlamayapti. Qaytadan urinib ko\'ring.',
      tasks: [],
      expenses: [],
      finance_profile: null
    };
  }
}

function buildContextString(context) {
  const parts = [];
  if (context.userName) parts.push(`Foydalanuvchi ismi: ${context.userName}`);
  if (context.activeTasks > 0) parts.push(`Faol vazifalar: ${context.activeTasks} ta`);
  if (context.monthlyExpenses > 0) parts.push(`Bu oylik xarajat: ${context.monthlyExpenses.toLocaleString()} so'm`);
  if (context.monthlyIncome > 0) parts.push(`Oylik daromad: ${context.monthlyIncome.toLocaleString()} so'm`);
  if (context.monthlyLimit > 0) parts.push(`Oylik limit: ${context.monthlyLimit.toLocaleString()} so'm`);
  if (context.currentTime) parts.push(`Hozirgi vaqt: ${context.currentTime}`);
  return parts.length > 0 ? `KONTEKST:\n${parts.join('\n')}` : '';
}

module.exports = { processMessage };
