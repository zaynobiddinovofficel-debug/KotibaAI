import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
const EXPENSES_STORAGE_KEY = "kotiba_expenses"
const EXPENSE_SETTINGS_STORAGE_KEY = "kotiba_expense_settings"
const PAGE_ORDER = ["/control", "/", "/tasks", "/expenses"]

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

const normalizeTask = (task) => ({
  id: crypto.randomUUID(),
  title: task.title || "Yangi vazifa",
  note: task.note || "",
  actionText: task.action_text || "Vazifani bajaring",
  scheduleAt: task.schedule_at || null,
  remindBeforeMinutes: Number(task.remind_before_minutes) || 0,
  repeatType: task.repeat?.type || "none",
  repeatIntervalMinutes: Number(task.repeat?.interval_minutes) || null,
  autoDeleteAt: task.auto_delete_at || null,
  notifyInSite: true,
  notifyVoice: true,
  status: "active",
  createdAt: new Date().toISOString(),
})

const normalizeExpense = (raw) => ({
  id: crypto.randomUUID(),
  title: raw.title || "Harajat",
  amount: Number(raw.amount) || 0,
  category: raw.category || "Boshqa",
  spentAt: raw.spentAt || new Date().toISOString(),
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

const parseKotibaObject = (rawText) => {
  const parsed = extractJsonObject(rawText)
  const obj = parsed || { intent: "chat", assistant_reply: "Tushunmadim", tasks: [], expenses: [] }
  obj.tasks = Array.isArray(obj.tasks) ? obj.tasks : []
  obj.expenses = Array.isArray(obj.expenses) ? obj.expenses : []
  return obj
}

function AppContent() {
  const [tasks, setTasks] = React.useState(safeJsonParse(localStorage.getItem(TASKS_STORAGE_KEY), []))
  const [expenses, setExpenses] = React.useState(safeJsonParse(localStorage.getItem(EXPENSES_STORAGE_KEY), []))
  const [expenseSettings, setExpenseSettings] = React.useState(safeJsonParse(localStorage.getItem(EXPENSE_SETTINGS_STORAGE_KEY), { monthlyLimit: "", warningThreshold: 80 }))
  const [username, setUsername] = React.useState(localStorage.getItem("username") || "")
  const [sttApiKeyInput, setSttApiKeyInput] = React.useState(localStorage.getItem("uzbekvoice_api_key") || "")
  const [geminiApiKeyInput, setGeminiApiKeyInput] = React.useState(localStorage.getItem("gemini_api_key") || "")
  const [isLight, setIsLight] = React.useState(localStorage.getItem("theme") !== "dark")
  const [isRecording, setIsRecording] = React.useState(false)
  const [audioUrl, setAudioUrl] = React.useState(null)
  const [transcript, setTranscript] = React.useState("")
  const [geminiReply, setGeminiReply] = React.useState("")
  const [editingTaskId, setEditingTaskId] = React.useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  React.useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses))
    localStorage.setItem(EXPENSE_SETTINGS_STORAGE_KEY, JSON.stringify(expenseSettings))
    localStorage.setItem("username", username)
    localStorage.setItem("uzbekvoice_api_key", sttApiKeyInput)
    localStorage.setItem("gemini_api_key", geminiApiKeyInput)
    localStorage.setItem("theme", isLight ? "light" : "dark")
  }, [tasks, expenses, expenseSettings, username, sttApiKeyInput, geminiApiKeyInput, isLight])

  const persistTasks = (newTasks) => setTasks(newTasks)
  const persistExpenses = (newExpenses) => setExpenses(newExpenses)
  const persistExpenseSettings = (newSettings) => setExpenseSettings(newSettings)

  const handleVoiceData = (obj) => {
    if (obj.tasks?.length) {
      const newTasks = obj.tasks.map(normalizeTask)
      persistTasks([...tasks, ...newTasks])
      toast.success(`${newTasks.length} vazifa qo'shildi`)
    }
    if (obj.expenses?.length) {
      const newExpenses = obj.expenses.map(normalizeExpense).filter(e => e.amount > 0)
      persistExpenses([...expenses, ...newExpenses])
      toast.success(`${newExpenses.length} harajat qo'shildi`)
    }
  }

  const saveSettings = () => toast.success("Sozlamalar saqlandi")

  const deleteTask = (id) => persistTasks(tasks.filter(t => t.id !== id))
  const deleteExpense = (id) => persistExpenses(expenses.filter(e => e.id !== id))

  const currentMonthTotal = expenses.filter(e => {
    const d = new Date(e.spentAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((sum, e) => sum + e.amount, 0)

  const swipeNav = (deltaX) => {
    const idx = PAGE_ORDER.indexOf(location.pathname)
    if (idx === -1) return
    if (deltaX < -70 && idx < PAGE_ORDER.length - 1) navigate(PAGE_ORDER[idx + 1])
    if (deltaX > 70 && idx > 0) navigate(PAGE_ORDER[idx - 1])
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4" onTouchStart={(e) => {
      const touch = e.touches[0]
      const startX = touch.clientX
      e.currentTarget.ontouchend = (endE) => {
        const endX = endE.changedTouches[0].clientX
        swipeNav(endX - startX)
      }
    }}>
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kotiba<b className="text-primary">AI</b></h1>
        <Button variant="ghost" size="icon" onClick={() => setIsLight(!isLight)}>
          {isLight ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </Button>
      </header>

      <Routes>
        <Route path="/" element={
          <div className="text-center">
            <h2 className="text-xl mb-2">Assalom, {username || "Hojam"}!</h2>
            <ExpenseAddModal onAddExpense={addExpenseFromForm} />
            {/* Voice recording UI here */}
          </div>
        } />
        <Route path="/tasks" element={
          <div>
            <h2 className="text-xl mb-4">Vazifalar ({tasks.length})</h2>
            {tasks.map(task => (
              <div key={task.id} className="p-4 border rounded mb-2 flex justify-between">
                <div>
                  <h3>{task.title}</h3>
                  <p className="text-sm opacity-75">{formatDateTime(task.scheduleAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        } />
        <Route path="/expenses" element={
          <div>
            <h2 className="text-xl mb-4">Harajatlar</h2>
            <div className="mb-6 p-4 border rounded">
              <h3>Joriy oy: {currentMonthTotal.toLocaleString()} so'm</h3>
              <ExpenseLimitModal settings={expenseSettings} onSaveSettings={saveExpenseSettingsFromModal} />
            </div>
            <ExpenseAddModal onAddExpense={addExpenseFromForm} />
            <div className="mt-6">
              {expenses.map(exp => (
                <div key={exp.id} className="p-4 border rounded mb-2 flex justify-between">
                  <div>
                    <h3>{exp.title} - {exp.amount.toLocaleString()} so'm</h3>
                    <p className="text-sm opacity-75">{formatDateTime(exp.spentAt)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        } />
        <Route path="/control" element={
          <div>
            <h2 className="text-xl mb-4">Sozlamalar</h2>
            <div className="space-y-4">
              <Input placeholder="Ism" value={username} onChange={e => setUsername(e.target.value)} />
              <Input placeholder="UzbekVoice API" value={sttApiKeyInput} onChange={e => setSttApiKeyInput(e.target.value)} />
              <Input placeholder="Gemini API" value={geminiApiKeyInput} onChange={e => setGeminiApiKeyInput(e.target.value)} />
              <Button onClick={saveSettings} className="w-full">Saqlash</Button>
            </div>
          </div>
        } />
      </Routes>

      <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-background p-2 rounded-full shadow-lg">
        {PAGE_ORDER.map(path => (
          <NavLink key={path} to={path} className={({ isActive }) => 
            `p-2 rounded-full ${isActive ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          >
            {path === '/' && <MicIcon className="h-6 w-6" />}
            {path === '/tasks' && <ListTodoIcon className="h-6 w-6" />}
            {path === '/expenses' && <CreditCardIcon className="h-6 w-6" />}
            {path === '/control' && <SlidersHorizontalIcon className="h-6 w-6" />}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}
