import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckSquare, Users, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { Layout } from '../components/Layout'
import { Card } from '../components/ui/Card'
import { VoiceButton } from '../components/VoiceButton'
import { remindersApi, tasksApi } from '../services/api'

export default function DashboardPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [reminders, setReminders] = useState([])
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [lastResult, setLastResult] = useState(null)

  const load = useCallback(async () => {
    try {
      const [rRes, tRes] = await Promise.all([
        remindersApi.getAll(),
        tasksApi.getAll(),
      ])
      setReminders(rRes.data || [])
      setTasks(tRes.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Eslatma yonganda ro'yxatni yangilash
  useNotifications({ onReminderFired: () => load() })

  // Ovoz buyrug'i natijasi kelganda ro'yxatni yangilash
  const handleVoiceResult = useCallback((result) => {
    setLastResult(result)
    load()
  }, [load])

  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech'
  const pending  = tasks.filter(t => t.status !== 'completed').length
  const upcoming = reminders.filter(r => !r.completed).length

  return (
    <Layout title="Kotiba AI">
      <div className="dashboard">
        {/* Salomlashish */}
        <div className="greeting-block">
          <h2 className="greeting-title">{greeting}, {user?.name?.split(' ')[0] || 'Foydalanuvchi'}!</h2>
          <p className="greeting-sub">Bugun nima qilishimiz kerak?</p>
        </div>

        {/* Statistika kartalar */}
        <div className="stats-grid">
          <Card className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/reminders')}>
            <Bell size={24} color="#6C63FF" />
            <div>
              <div className="stat-num">{upcoming}</div>
              <div className="stat-label">Eslatma</div>
            </div>
          </Card>
          <Card className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
            <CheckSquare size={24} color="#16A34A" />
            <div>
              <div className="stat-num">{pending}</div>
              <div className="stat-label">Vazifa</div>
            </div>
          </Card>
          <Card className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/finance')}>
            <Wallet size={24} color="#F59E0B" />
            <div>
              <div className="stat-num">💰</div>
              <div className="stat-label">Moliya</div>
            </div>
          </Card>
          <Card className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/clients')}>
            <Users size={24} color="#EC4899" />
            <div>
              <div className="stat-num">👥</div>
              <div className="stat-label">Mijozlar</div>
            </div>
          </Card>
        </div>

        {/* Ovoz tugmasi */}
        <div className="voice-section">
          <VoiceButton onResult={handleVoiceResult} />
        </div>

        {/* Oxirgi AI natija */}
        {lastResult?.ai_result?.response_text && (
          <Card className="ai-result-card">
            <p className="ai-result-text">🤖 {lastResult.ai_result.response_text}</p>
          </Card>
        )}

        {/* So'nggi eslatmalar */}
        {upcoming > 0 && (
          <div className="section">
            <h3 className="section-title">Yaqinlashayotgan eslatmalar</h3>
            {reminders.filter(r => !r.completed).slice(0, 3).map(r => (
              <Card key={r.id} className="list-item">
                <Bell size={16} color="#6C63FF" />
                <div className="list-item-info">
                  <span className="list-item-text">{r.text}</span>
                  <span className="list-item-sub">{r.date} {r.time && `— ${r.time}`}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* So'nggi vazifalar */}
        {pending > 0 && (
          <div className="section">
            <h3 className="section-title">Bajarilmagan vazifalar</h3>
            {tasks.filter(t => t.status !== 'completed').slice(0, 3).map(t => (
              <Card key={t.id} className="list-item">
                <CheckSquare size={16} color="#16A34A" />
                <div className="list-item-info">
                  <span className="list-item-text">{t.text}</span>
                  {t.deadline && (
                    <span className="list-item-sub">
                      Muddat: {new Date(t.deadline).toLocaleDateString('uz')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && upcoming === 0 && pending === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: 48 }}>✅</span>
            <p>Hamma narsa bajarilgan!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
