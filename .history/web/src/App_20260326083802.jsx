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
import React, { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { ExpenseAddModal } from "@/components/ExpenseAddModal"
import { ExpenseLimitModal } from "@/components/ExpenseLimitModal"

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
  actionText: task.action_text || "Bajaring",
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

function AppContent() {
  const [tasks, setTasks] = useState(safeJsonParse(localStorage.getItem(TASKS_STORAGE_KEY), []))
  const [expenses, setExpenses] = useState(safeJsonParse(localStorage.getItem(EXPENSES_STORAGE_KEY), []))
  const [expenseSettings, setExpenseSettings] = useState(safeJsonParse(localStorage.getItem(EXPENSE_SETTINGS_STORAGE_KEY), { monthlyLimit: "", warningThreshold: 80 }))
  const [username, setUsername] = useState(localStorage.getItem("username") || "")
  const [sttApiKey, setSttApiKey] = useState(localStorage.getItem("uzbekvoice_api_key") || "")
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem("gemini_api_key") || "")
  const [isLight, setIsLight] = useState(localStorage.getItem("theme") !== "dark")
  const [editingTaskId, setEditingTaskId] = useState(null)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses))
    localStorage.setItem(EXPENSE_SETTINGS_STORAGE_KEY, JSON.stringify(expenseSettings))
    localStorage.setItem("username", username)
    localStorage.setItem("uzbekvoice_api_key", sttApiKey)
    localStorage.setItem("gemini_api_key", geminiApiKey)
    document.documentElement.classList.toggle("dark", !isLight)
  }, [tasks, expenses, expenseSettings, username, sttApiKey, geminiApiKey, isLight])

  const addExpenseFromModal = useCallback((expenseData) => {
    if (!expenseData.title.trim() || expenseData.amount <= 0) {
      toast.error("Nomi va to'g'ri summa kiriting")
      return
    }
    const newExpense = normalizeExpense(expenseData)
    setExpenses([newExpense, ...expenses])
    toast.success("Harajat qo'shildi!")
  }, [expenses])

  const saveLimitSettings = useCallback((settings) => {
    const validated = {
      monthlyLimit: settings.monthlyLimit || "",
      warningThreshold: Math.max(1, Math.min(100, Number(settings.warningThreshold) || 80))
    }
    setExpenseSettings(validated)
    toast.success("Limit saqlandi")
  }, [])

  const deleteTask = useCallback((id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }, [tasks])

  const deleteExpense = useCallback((id) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }, [expenses])

  const currentMonthTotal = expenses.filter(e => {
    const d = new Date(e.spentAt)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).reduce((sum, e) => sum + e.amount, 0)

  const handleSwipe = useCallback((e) => {
    if (editingTaskId) return
    const touch = e.touches[0]
    const startX = touch.clientX
    const onEnd = (endE) => {
      const endX = endE.changedTouches[0].clientX
      const delta = endX - startX
      const idx = PAGE_ORDER.indexOf(location.pathname)
      if (Math.abs(delta) > 50) {
        navigate(PAGE_ORDER[Math.max(0, Math.min(PAGE_ORDER.length - 1, idx + (delta > 0 ? -1 : 1)))])
      }
    }
    e.currentTarget.ontouchend = onEnd
  }, [location.pathname, navigate, editingTaskId])

  return (
    <div className="min-h-screen p-4 touch-manipulation" onTouchStart={handleSwipe}>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kotiba<b className="text-primary">AI</b></h1>
        <Button variant="ghost" size="icon" onClick={() => setIsLight(x => !x)}>
          {isLight ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </Button>
      </header>

      <Routes>
        <Route path="/" element={<div className="text-center space-y-4">
          <h2 className="text-xl">Salom, {username || "do'st"}!</h2>
          <p>Ovozli vazifa/harajat qo'shish</p>
          {/* Voice UI placeholder */}
          <Button className="w-full max-w-sm mx-auto">Mikkifon</Button>
        </div>} />
        
        <Route path="/tasks" element={<div className="space-y-3">
          <h2>Tasklar ({tasks.length})</h2>
          {tasks.map(task => (
            <div key={task.id} className="p-4 border rounded-lg flex justify-between items-start">
              <div>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm opacity-75">{formatDateTime(task.scheduleAt)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>} />
        
        <Route path="/expenses" element={<div className="space-y-4">
          <h2>Harajatlar</h2>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Oylik nazorat</h3>
            <p className="text-sm opacity-75 mb-2">Joriy oy: {currentMonthTotal.toLocaleString()} so'm</p>
            <ExpenseLimitModal settings={expenseSettings} onSaveSettings={saveLimitSettings} />
          </div>
          
          <ExpenseAddModal onAddExpense={addExpenseFromModal} />
          
          <div>
            <h3 className="font-medium mb-3">Ro'yxat ({expenses.length})</h3>
            {expenses.map(exp => (
              <div key={exp.id} className="p-4 border rounded-lg flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{exp.title}</h4>
                  <p className="text-sm opacity-75">{exp.category}</p>
                  <p className="text-lg font-bold">{exp.amount.toLocaleString()} so'm</p>
                  <p className="text-xs opacity-50">{formatDateTime(exp.spentAt)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)}>
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>} />
        
        <Route path="/control" element={<div className="space-y-4 max-w-md">
          <h2>Sozlamalar</h2>
          <div>
            <label className="block text-sm mb-1 font-medium">Ism</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">UzbekVoice API</label>
            <Input value={sttApiKey} onChange={e => setSttApiKey(e.target.value)} placeholder="uzbekvoice.ai key" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Gemini API</label>
            <Input value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} placeholder="generativelanguage.googleapis.com key" />
          </div>
          <Button className="w-full" onClick={() => toast.success("Saqlandi!")}>Saqlash</Button>
        </div>} />
      </Routes>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 flex bg-background/90 backdrop-blur-sm p-3 rounded-full shadow-2xl gap-3 border">
        {PAGE_ORDER.map((path, i) => (
          <NavLink 
            key={path} 
            to={path} 
            className={({ isActive }) => `p-3 rounded-full transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 'text-muted-foreground hover:bg-accent'}`}
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
