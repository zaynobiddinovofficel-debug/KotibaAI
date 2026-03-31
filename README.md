# KotibaAI — O'zbek AI Kotib

Shaxsiy O'zbek AI kotib ilovasi. Ovoz va matn orqali vazifalar, eslatmalar va xarajatlarni boshqarish.

---

## Loyiha haqida

KotibaAI — foydalanuvchilarga quyidagi imkoniyatlarni beruvchi mobil-birinchi web ilovasi:

- Ovoz yoki matn orqali vazifalar va eslatmalar yaratish
- Xarajatlarni kuzatish va moliyaviy tahlil
- O'zbek tilida natural muloqot (Gemini AI orqali)
- Push bildirishnomalar va ovozli eslatmalar
- PWA sifatida telefonlarga o'rnatish imkoniyati

---

## Arxitektura

```
kotibaai/
├── backend/          # Node.js + Express + MongoDB
│   └── src/
│       ├── models/       # Mongoose sxemalari
│       ├── services/     # Biznes logikasi
│       ├── controllers/  # HTTP handler'lar
│       ├── routes/       # Express router'lar
│       ├── middleware/   # Auth, error handling
│       └── server.js
└── frontend/         # Vite + React + Tailwind CSS v4
    └── src/
        ├── context/      # Auth va App state
        ├── hooks/        # useVoice, useTheme, usePush
        ├── services/     # Axios API wrapper
        ├── components/   # UI komponentlar
        └── pages/        # Asosiy sahifalar
```

---

## Ovoz pipeline

```
Foydalanuvchi ovoz yozadi (MediaRecorder)
    ↓
Frontend audio blob → POST /api/voice (multipart/form-data)
    ↓
Backend: sttService → UzbekVoice STT API
    ↓
O'zbek matni qaytadi (yoki null — silent fail)
    ↓
Backend: geminiService → Gemini 1.5 Flash (strukturli JSON)
    ↓
Gemini → { intent, assistant_reply, tasks, expenses, finance_profile }
    ↓
assistantService: vazifalar yaratadi, xarajatlar saqlaydi, eslatmalar rejalashtiradi
    ↓
(Ixtiyoriy) ttsService → UzbekVoice TTS → audio buffer
    ↓
Frontend: VoiceMessageBubble (transcript ko'rinmaydi) + typing effect javob
    ↓
(Ixtiyoriy) TTS audio bir marta ijro etiladi
```

**Silent fail qoidalari:**
- Agar ovoz aniqlanmasa → xato ko'rsatilmaydi
- Agar mikrofon ruxsati yo'q bo'lsa → jim o'tiladi
- Agar TTS ishlamasa → faqat matn ko'rsatiladi

---

## Auth oqimi

```
POST /api/auth/register → { token, user }
POST /api/auth/login    → { token, user }
    ↓
Token localStorage'da saqlanadi ("kotibaai_token")
    ↓
Har bir so'rovda: Authorization: Bearer <token>
    ↓
middleware/auth.js → JWT verify → req.userId
    ↓
401 bo'lsa → localStorage tozalanadi → /login ga yo'naltiriladi
```

---

## Eslatma oqimi

```
Foydalanuvchi: "ertaga soat 3 da uchrashuv, 30 minut oldin eslat"
    ↓
Gemini → { dueDate: "2026-03-28T15:00:00", remindBeforeMinutes: 30, reminderText: "Yarim soatdan keyin uchrashuvingiz bor" }
    ↓
assistantService → Task yaratadi + remindAt = dueDate - 30 min
    ↓
schedulerService → node-schedule job rejalashtiradi
    ↓
[Vaqt kelganda]
schedulerService → Task reminded=true → web-push xabari yuboradi
    ↓
SW.js → showNotification() → foydalanuvchi bildirishnoma oladi
    ↓
Foydalanuvchi bosadi → app ochiladi → ReminderToast ko'rsatiladi
    ↓
(Agar voiceReminders yoniq) → TTS bir marta ijro etiladi
```

---

## Xarajatlar oqimi

```
Foydalanuvchi: "bugun 500 ming sarfladim"
    ↓
Gemini → { intent: "expense", expenses: [{ amount: 500000, category: "Umumiy" }] }
    ↓
assistantService → Expense yaratadi
    ↓
Agar xarajat oylik limitdan 80% oshsa:
    → assistant_reply: "Bu oy ko'p xarajat qilib yubordingiz, pulni tejab ishlating."
    ↓
ExpenseSummary: kunlik / haftalik / oylik totals
    ↓
Progress bar: xarajat vs daromad, xarajat vs limit
```

---

## Muhit o'zgaruvchilari

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kotibaai
JWT_SECRET=...                    # Murakkab tasodifiy kalit
FRONTEND_URL=http://localhost:5173

# UzbekVoice API
UZBEKVOICE_STT_URL=https://api.uzbekvoice.ai/v1/stt
UZBEKVOICE_TTS_URL=https://api.uzbekvoice.ai/v1/tts
UZBEKVOICE_API_KEY=...

# Google Gemini
GEMINI_API_KEY=...

# Web Push (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@kotibaai.uz
```

VAPID kalitlarini yaratish:
```bash
npx web-push generate-vapid-keys
```

---

## Ishga tushirish

### Talablar
- Node.js 18+
- MongoDB (local yoki Atlas)
- UzbekVoice API kaliti
- Google Gemini API kaliti

### Backend

```bash
cd kotibaai/backend
cp .env.example .env
# .env faylini to'ldiring
npm install
npm run dev
```

### Frontend

```bash
cd kotibaai/frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

---

## API endpointlar

| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | /api/auth/register | Ro'yxatdan o'tish |
| POST | /api/auth/login | Kirish |
| GET | /api/auth/profile | Profil |
| PUT | /api/auth/profile | Profilni yangilash |
| POST | /api/voice | Ovozni qayta ishlash |
| POST | /api/voice/speak | Matnni nutqqa aylantirish |
| POST | /api/assistant/respond | Matn xabar yuborish |
| GET | /api/tasks | Vazifalar ro'yxati |
| POST | /api/tasks | Vazifa yaratish |
| PUT | /api/tasks/:id | Vazifani tahrirlash |
| DELETE | /api/tasks/:id | Vazifani o'chirish |
| PATCH | /api/tasks/:id/complete | Bajarildi belgisi |
| GET | /api/expenses | Xarajatlar ro'yxati |
| GET | /api/expenses/summary | Kunlik/haftalik/oylik |
| POST | /api/expenses | Xarajat qo'shish |
| PUT | /api/expenses/:id | Xarajatni tahrirlash |
| DELETE | /api/expenses/:id | Xarajatni o'chirish |
| GET | /api/conversations | Suhbat tarixi |
| DELETE | /api/conversations | Suhbatni tozalash |
| GET | /api/push/vapid-key | VAPID public key |
| POST | /api/push/subscribe | Push obunasi |
| POST | /api/push/test | Test bildirishnoma |

---

## Komponentlar tuzilishi

```
components/
├── layout/
│   ├── AppHeader        # Logo + dark mode toggle
│   └── BottomNav        # Fixed 4-tab navigation
├── chat/
│   ├── ChatWindow       # Scroll area, message list
│   ├── MessageBubble    # Typing effect, assistant/user bubbles
│   ├── VoiceMessageBubble  # Animated waveform (NO transcript)
│   └── ChatComposer     # Mic + text input
├── tasks/
│   ├── TaskList         # Loading skeleton, empty state
│   ├── TaskItem         # Checkbox, edit, delete, reminder badge
│   └── TaskForm         # Create/edit form
├── expenses/
│   ├── ExpenseSummary   # Stat cards + progress bars
│   ├── ExpenseList      # List with loading
│   ├── ExpenseItem      # Category icon, amount, edit/delete
│   └── ExpenseForm      # Add/edit form
└── common/
    ├── ReminderToast    # Animated top toast
    └── LoadingSpinner   # Centered spinner
```

---

## Kelajak rivojlanish

- [ ] PWA ikonkalar qo'shish (192x192, 512x512)
- [ ] Offline rejim va cache strategiyasi
- [ ] Recurring (takrorlanadigan) vazifalar
- [ ] Xarajat kategoriyalari bo'yicha diagramma
- [ ] Ko'p til qo'llab-quvvatlashi (hozircha faqat O'zbek)
- [ ] Foydalanuvchi avatar yuklash
- [ ] Vazifalar bo'yicha qidiruv va filtrlash
- [ ] Eksport: PDF hisobot (xarajatlar)
- [ ] Telegram bot integratsiyasi
- [ ] Electron desktop versiya

---

## Litsenziya

MIT — erkin foydalanishingiz mumkin.
