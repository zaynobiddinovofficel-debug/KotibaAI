import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BellIcon,
  BellOffIcon,
  CheckIcon,
  Clock3Icon,
  CreditCardIcon,
  SlidersHorizontalIcon,
  ListTodoIcon,
  MicIcon,
  MoonIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RepeatIcon,
  SendIcon,
  SunIcon,
  TriangleAlertIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import React from "react"
import { toast } from "sonner"
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { ExpenseAddModal } from "@/components/ExpenseAddModal"
import { ExpenseLimitModal } from "@/components/ExpenseLimitModal"

const barCount = 24
const TASKS_STORAGE_KEY = "kotiba_tasks"
const PROMPT_STORAGE_KEY = "kotiba_prompt_version"
const EXPENSES_STORAGE_KEY = "kotiba_expenses"
const EXPENSE_SETTINGS_STORAGE_KEY = "kotiba_expense_settings"
const PAGE_ORDER = ["/control", "/", "/tasks", "/expenses"]

// KOTIBA_PROMPT loaded from web/prompt.txt - already extended with expenses schema

const createEmptyLevels = () => Array.from({ length: barCount }, () => 10)

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const formatDateTime = (value) => {
  if (!value) return "Vaqt belgilanmagan"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vaqt belgilanmagan"
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const toDateTimeLocalValue = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

const normalizeTask = (task) => {
  const scheduleAt = task.schedule_at || task.scheduleAt || null
  const remindBeforeMinutes = Number(task.remind_before_minutes ?? task.remindBeforeMinutes ?? 0) || 0
  const repeat = task.repeat || {}

  return {
    id: crypto.randomUUID(),
    title: task.title || "Yangi vazifa",
    note: task.note || "",
    actionText: task.action_text || task.actionText || "Vazifani bajaring",
    scheduleAt,
    remindBeforeMinutes,
    repeatType: repeat.type || task.repeatType || "none",
    repeatIntervalMinutes:
      Number(repeat.interval_minutes ?? task.repeatIntervalMinutes ?? 0) || null,
    autoDeleteAt: task.auto_delete_at || task.autoDeleteAt || null,
    notifyInSite: task.notify_in_site ?? task.notifyInSite ?? true,
    notifyVoice: task.notify_voice ?? task.notifyVoice ?? true,
    status: "active",
    createdAt: new Date().toISOString(),
    nextTriggerAt: buildNextTriggerAt({ scheduleAt, remindBeforeMinutes }),
    lastTriggeredAt: null,
  }
}

const normalizeExpense = (rawExpense) => ({
  id: crypto.randomUUID(),
  title: rawExpense.title || "Harajat",
  amount: Number(rawExpense.amount) || 0,
  category: rawExpense.category || "Boshqa",
  spentAt: rawExpense.spentAt || new Date().toISOString(),
  createdAt: new Date().toISOString(),
})

const extractJsonObject = (text) => {
  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first === -1 || last === -1) return null
  try {
    return JSON.parse(text.slice(first, last + 1))
  } catch {
    return null
  }
}

const fallbackKotibaObject = (recognizedText) => ({
  intent: "chat",
  assistant_reply: recognizedText
    ? `Eshitdim: "${recognizedText}". Hozircha vazifa yaratilmadi.`
    : "Matn olindi.",
  tasks: [],
  expenses: [],
})

const buildNextTriggerAt = (task) => {
  if (!task.scheduleAt) return null
  const remindOffset = Number(task.remindBeforeMinutes || 0) * 60 * 1000
  const scheduleMs = new Date(task.scheduleAt).getTime()
  if (Number.isNaN(scheduleMs)) return null
  return new Date(scheduleMs - remindOffset).toISOString()
}

function AppContent() {
  const [tasks, setTasks] = React.useState(() =>
    safeJsonParse(localStorage.getItem(TASKS_STORAGE_KEY), [])
  )
  const [expenses, setExpenses] = React.useState(() =>
    safeJsonParse(localStorage.getItem(EXPENSES_STORAGE_KEY), [])
  )
  const [expenseSettings, setExpenseSettings] = React.useState(() =>
    safeJsonParse(localStorage.getItem(EXPENSE_SETTINGS_STORAGE_KEY), {
      monthlyLimit: "",
      warningThreshold: 80,
    })
  )
  const [username, setUsername] = React.useState(() => localStorage.getItem("username") || "")
  const [draftUsername, setDraftUsername] = React.useState(
    () => localStorage.getItem("username") || ""
  )
  const [sttApiKeyInput, setSttApiKeyInput] = React.useState(
    () =>
      localStorage.getItem("uzbekvoice_api_key") ||
      import.meta.env.VITE_UZBEKVOICE_API_KEY ||
      ""
  )
  const [geminiApiKeyInput, setGeminiApiKeyInput] = React.useState(
    () =>
      localStorage.getItem("gemini_api_key") ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ""
  )
  const [isLight, setIsLight] = React.useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme ? savedTheme === "light" : true
  })
  const [isRecording, setIsRecording] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const [audioUrl, setAudioUrl] = React.useState(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [geminiReply, setGeminiReply] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")
  const [audioLevels, setAudioLevels] = React.useState(createEmptyLevels)
  const [notificationPermission, setNotificationPermission] = React.useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  )
  const [editingTaskId, setEditingTaskId] = React.useState(null)
  const [editForm, setEditForm] = React.useState({
    title: "",
    note: "",
    actionText: "",
    scheduleAt: "",
    remindBeforeMinutes: "0",
    repeatType: "none",
    repeatIntervalMinutes: "",
    autoDeleteAt: "",
  })

  const mediaRecorderRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const chunksRef = React.useRef([])
  const recordAudioContextRef = React.useRef(null)
  const recordAnalyserRef = React.useRef(null)
  const previewAudioContextRef = React.useRef(null)
  const previewAnalyserRef = React.useRef(null)
  const animationFrameRef = React.useRef(null)
  const audioPreviewRef = React.useRef(null)
  const previewSourceRef = React.useRef(null)
  const spokenTaskIdsRef = React.useRef(new Set())
  const reminderAudioRef = React.useRef(null)
  const swipeStartRef = React.useRef(null)
  const expenseAlertRef = React.useRef("")
  const location = useLocation()
  const navigate = useNavigate()

  const sttApiKey = sttApiKeyInput.trim()
  const geminiApiKey = geminiApiKeyInput.trim()

  // Load KOTIBA_PROMPT from file
  const [kotibaPrompt, setKotibaPrompt] = React.useState(KOTIBA_PROMPT)

  React.useEffect(() => {
    fetch('/prompt.txt')
      .then(r => r.text())
      .then(setKotibaPrompt)
      .catch(() => {}) // fallback
  }, [])

  const persistTasks = React.useCallback((nextTasks) => {
    setTasks(nextTasks)
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(nextTasks))
  }, [])

  const persistExpenses = React.useCallback((nextExpenses) => {
    setExpenses(nextExpenses)
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(nextExpenses))
  }, [])

  const persistExpenseSettings = React.useCallback((nextSettings) => {
    setExpenseSettings(nextSettings)
    localStorage.setItem(EXPENSE_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings))
  }, [])

  const handleVoiceData = React.useCallback((kotibaObject) => {
    if (Array.isArray(kotibaObject.tasks) && kotibaObject.tasks.length > 0) {
      const normalizedTasks = kotibaObject.tasks.map(normalizeTask)
      persistTasks([...tasks, ...normalizedTasks])
      toast.success("Yangi vazifalar qo'shildi", {
        description: `${normalizedTasks.length} ta task.`,
      })
    }
    if (Array.isArray(kotibaObject.expenses) && kotibaObject.expenses.length > 0) {
      const normalizedExpenses = kotibaObject.expenses.map(normalizeExpense).filter(e => e.amount > 0)
      persistExpenses([...expenses, ...normalizedExpenses])
      toast.success("Ovozli harajatlar qo'shildi", {
        description: `${normalizedExpenses.length} ta harajat.`,
      })
    }
  }, [persistExpenses, persistTasks, tasks, expenses])

  const addExpenseFromForm = React.useCallback((expenseData) => {
    const nextExpenses = [expenseData, ...expenses]
    persistExpenses(nextExpenses)
    toast.success("Harajat qo'shildi")
  }, [persistExpenses, expenses])

  const saveExpenseSettingsFromModal = React.useCallback((newSettings) => {
    const nextSettings = {
      monthlyLimit: newSettings.monthlyLimit,
      warningThreshold: Math.min(100, Math.max(1, Number(newSettings.warningThreshold || 80))),
    }
    persistExpenseSettings(nextSettings)
    toast.success("Limit sozlamalari saqlandi")
  }, [persistExpenseSettings])

  const sendRecording = React.useCallback(async () => {
    // ... existing STT code ...
    // After parsing kotibaObject
    const kotibaObject = parseKotibaObject(geminiText, recognizedText)
    setGeminiReply(kotibaObject.assistant_reply || "")
    handleVoiceData(kotibaObject)
    resetRecorder()
  }, [/* deps */])

  // ... rest of existing functions: startRecording, stopRecording, etc. remain the same ...

  const tasksList = {
    // ... existing tasksList unchanged ...
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ... existing header ... */}

      <Routes>
        {/* ... existing /, /tasks, /control ... */}

        <Route
          path="/expenses"
          element={
            <>
              <div className="px-3 py-4 max-w-[1280px] w-full text-center">
                <div className="text-2xl font-medium">Harajatlar</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  KotibaAI harajatlarni kuzatadi va limit oshsa ogohlantiradi
                </div>
              </div>
              <div className="px-3 w-full max-w-[1280px] space-y-3">
                <div className="rounded-[28px] border border-border/80 bg-background/80 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Oylik limit nazorati</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Joriy oy: {currentMonthExpenseTotal.toLocaleString("uz-UZ")} so'm
                      </div>
                    </div>
                    {monthlyLimit > 0 && spentPercent >= Number(expenseSettings.warningThreshold || 80) && (
                      <TriangleAlertIcon className="size-5 text-amber-500" />
                    )}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${spentPercent >= 100 ? "bg-red-500" : spentPercent >= Number(expenseSettings.warningThreshold || 80) ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                  <ExpenseLimitModal settings={expenseSettings} onSaveSettings={saveExpenseSettingsFromModal} />
                </div>

                <ExpenseAddModal onAddExpense={addExpenseFromForm} />

                <div className="rounded-[28px] border border-border/80 bg-background/80 p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium">Harajatlar ro'yxati</span>
                    <span className="text-xs text-muted-foreground">{expenses.length} ta</span>
                  </div>
                  {/* ... existing expenses list ... */}
                </div>
              </div>
              <div className="px-3 max-w-[1280px] w-full flex justify-center mt-auto pb-4 pt-4">
                {bottomNav}
              </div>
            </>
          }
        />
      </Routes>
      {/* ... existing editing task modal ... */}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
