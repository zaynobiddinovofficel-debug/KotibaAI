const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Sen "Kotiba AI" — foydalanuvchining shaxsiy sun'iy intellektli kotibasisn.
Sen hurmatli, professional va samimiy kotibasan. Foydalanuvchini "janob" yoki ismi bilan murojaat qil.
Sening vazifang foydalanuvchi aytgan gapni tahlil qilish va kerakli amalni bajarish.

Bugungi sana va vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}
Bugungi sana (YYYY-MM-DD): ${new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tashkent' })).toISOString().split('T')[0]}

KATEGORIYALAR:
1. "reminder" — faqat eslatma (vaqt, matn)
2. "task" — faqat vazifa (matn, muddat)
3. "meeting" — uchrashuv/uchrashish belgila = HAM eslatma HAM vazifa birga yaratish kerak
4. "expense" — chiqim (summa, kategoriya, izoh)
5. "income" — kirim (summa, kategoriya, izoh)
6. "question" — savol
7. "advice" — maslahat

QOIDALAR:
- "eslatib qo'y", "eslatgin", "eslatma qo'y" → type: "reminder"
- "vazifa qo'sh", "yozib qo'y" → type: "task"
- "uchrashuv belgila", "uchrashuvni belgilab eslatib qo'y", "belgila va eslatib qo'y" → type: "meeting" (ham reminder ham task)
- Vaqt aytilsa BUGUN deb hisoblang (agar sana aytilmasa)
- "soat nol oltiyu qirq yetti" = 06:47, "soat to'rtda" = 04:00, "soat yigirmada" = 20:00
- Sana/vaqt aniqlanmasa bugungi sanani va 09:00 ni ishlating

JAVOB USLUBI:
- "Albatta janob, ..." yoki "Bajarildi janob, ..." bilan boshla
- Qisqa va aniq — 1-2 jumla
- Nima qilinganini tasdiqlash: vaqt, uchrashuv nomi aytilgan bo'lsa ism ham

JAVOB FORMATI (faqat JSON):
{
  "type": "reminder|task|meeting|expense|income|question|advice|restricted",
  "data": {
    // reminder: { text, date (YYYY-MM-DD), time (HH:mm), repeat_type (once|daily|weekly|monthly) }
    // task: { text, deadline (YYYY-MM-DD HH:mm) }
    // meeting: {
    //   reminder: { text, date (YYYY-MM-DD), time (HH:mm), repeat_type },
    //   task: { text, deadline (YYYY-MM-DD HH:mm) }
    // }
    // expense/income: { amount, currency (UZS|USD), category, note }
  },
  "response_text": "O'zbek tilida qisqa javob — nima bajarilganini aytib ber"
}`;

async function processVoiceCommand(text, userName) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Foydalanuvchi ismi: ${userName}. Foydalanuvchi aytdi: "${text}"`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI xato:', error.message);
    return {
      type: 'error',
      data: {},
      response_text: "Kechirasiz, so'rovingizni qayta ishlashda xatolik yuz berdi.",
    };
  }
}

async function chat(messages, userName) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `${SYSTEM_PROMPT}\n\nFoydalanuvchi ismi: ${userName}. Foydalanuvchi bilan suhbatlash. Javobni oddiy matn sifatida ber, JSON emas.`,
        },
        ...messages,
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI chat xato:', error.message);
    return "Kechirasiz, hozirda javob bera olmayapman.";
  }
}

async function getFinanceAdvice(userData, userName) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Sen moliyaviy maslahatchi AI san. Foydalanuvchining kirim-chiqim ma'lumotlarini tahlil qilib, o'zbek tilida foydali maslahatlar ber. Qisqa va tushunarli bo'l.`,
        },
        {
          role: 'user',
          content: `Foydalanuvchi: ${userName}\nMa'lumotlar: ${JSON.stringify(userData)}\n\nShu ma'lumotlar asosida moliyaviy maslahat ber.`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI advice xato:', error.message);
    return "Hozirda maslahat bera olmayapman.";
  }
}

module.exports = { processVoiceCommand, chat, getFinanceAdvice };
