import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { authAPI, conversationAPI, pushAPI } from '../services/api'
import { useApp } from '../context/AppContext'

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
          value ? 'bg-[#6C63FF]' : 'bg-gray-200 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            value ? 'left-[26px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
      {title}
    </h2>
  )
}

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()
  const { dark, toggle: toggleDark } = useTheme()
  const { subscribe } = usePushNotifications()
  const { setMessages } = useApp()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [editingName, setEditingName] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)
  const [testSent, setTestSent] = useState(false)

  const [prefs, setPrefs] = useState({
    voiceReminders: true,
    screenReminders: true,
    pushEnabled: false,
    ...(user?.preferences || {})
  })

  const savePrefs = async (newPrefs) => {
    setPrefs(newPrefs)
    try {
      await authAPI.updateProfile({ preferences: newPrefs })
      updateUser({ preferences: newPrefs })
    } catch {}
  }

  const saveName = async () => {
    if (!name.trim()) return
    setNameSaving(true)
    try {
      await authAPI.updateProfile({ name: name.trim() })
      updateUser({ name: name.trim() })
      setEditingName(false)
    } catch {} finally {
      setNameSaving(false)
    }
  }

  const handlePushToggle = async () => {
    if (!prefs.pushEnabled) {
      const ok = await subscribe()
      if (ok) {
        savePrefs({ ...prefs, pushEnabled: true })
      }
    } else {
      try {
        await pushAPI.unsubscribe()
      } catch {}
      savePrefs({ ...prefs, pushEnabled: false })
    }
  }

  const handleTestPush = async () => {
    try {
      await pushAPI.test()
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch {}
  }

  const handleClearConversation = async () => {
    if (!window.confirm("Suhbat tarixi o'chiriladi. Davom etasizmi?")) return
    try {
      await conversationAPI.clearHistory()
      setMessages([])
    } catch {}
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userInitial = (user?.name || 'K')[0].toUpperCase()

  return (
    <div className="px-4 py-4 flex flex-col gap-4 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
      </div>

      {/* ---- PROFILE ---- */}
      <section>
        <SectionHeader title="Profil" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#6C63FF] flex items-center justify-center shadow-md shadow-[#6C63FF]/20 flex-shrink-0">
              <span className="text-white text-xl font-bold">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(user?.name || ''); setEditingName(false) } }}
                    autoFocus
                    className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-[#6C63FF] min-w-0"
                    placeholder="Ismingiz"
                  />
                  <button
                    onClick={saveName}
                    disabled={nameSaving}
                    className="text-xs text-white bg-[#6C63FF] rounded-lg px-3 py-1.5 font-medium flex-shrink-0"
                  >
                    {nameSaving ? '...' : 'Saqlash'}
                  </button>
                  <button
                    onClick={() => { setName(user?.name || ''); setEditingName(false) }}
                    className="text-xs text-gray-400 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 dark:text-white truncate">{user?.name || 'Foydalanuvchi'}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-[#6C63FF] font-medium flex-shrink-0"
                  >
                    Tahrirlash
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- NOTIFICATIONS ---- */}
      <section>
        <SectionHeader title="Bildirishnomalar" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50 px-4">
          <Toggle
            label="Ekranda ko'rsat"
            description="Eslatmalar ekranda chiqadi"
            value={prefs.screenReminders}
            onChange={() => savePrefs({ ...prefs, screenReminders: !prefs.screenReminders })}
          />
          <Toggle
            label="Ovozli eslatma"
            description="Kotib eslatmani o'qib beradi"
            value={prefs.voiceReminders}
            onChange={() => savePrefs({ ...prefs, voiceReminders: !prefs.voiceReminders })}
          />
          <Toggle
            label="Push bildirishnoma"
            description="Ilova yopiq bo'lsa ham eslat"
            value={prefs.pushEnabled}
            onChange={handlePushToggle}
          />
          {prefs.pushEnabled && (
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Test bildirishnoma</p>
                <p className="text-xs text-gray-400">Push ishlayotganini tekshiring</p>
              </div>
              <button
                onClick={handleTestPush}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  testSent
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-[#6C63FF] bg-[#6C63FF]/10 hover:bg-[#6C63FF]/20'
                }`}
              >
                {testSent ? 'Yuborildi ✓' : 'Sinab ko\'rish'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---- APPEARANCE ---- */}
      <section>
        <SectionHeader title="Ko'rinish" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4">
          <Toggle
            label="Tungi rejim"
            description={dark ? 'Hozir qorong\'i fon' : 'Hozir yorug\' fon'}
            value={dark}
            onChange={toggleDark}
          />
        </div>
      </section>

      {/* ---- DATA ---- */}
      <section>
        <SectionHeader title="Ma'lumotlar" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3">
          <button
            onClick={handleClearConversation}
            className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
            Suhbatni tozalash
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Chiqish
          </button>
        </div>
      </section>

      {/* Version */}
      <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 pb-2">
        KotibaAI v1.0.0 — O'zbek shaxsiy kotib
      </p>
    </div>
  )
}
