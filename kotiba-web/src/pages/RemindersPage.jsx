import { useState, useEffect, useCallback } from 'react'
import { Plus, Bell, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { remindersApi } from '../services/api'

const REPEAT_OPTIONS = [
  { value: 'once',    label: 'Bir marta' },
  { value: 'daily',   label: 'Har kun' },
  { value: 'weekly',  label: 'Har hafta' },
  { value: 'monthly', label: 'Har oy' },
]

const EMPTY_FORM = { text: '', date: '', time: '', repeatType: 'once' }

export default function RemindersPage() {
  const [reminders, setReminders] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })

  const load = useCallback(async () => {
    try {
      const res = await remindersApi.getAll()
      setReminders(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      text:       item.text || '',
      date:       item.date?.split('T')[0] || '',
      time:       item.time || '',
      repeatType: item.repeatType || 'once',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!form.text.trim()) { alert('Eslatma matni kiritilishi shart'); return }
    if (!form.date)        { alert('Sana kiritilishi shart'); return }
    setSaving(true)
    try {
      if (editItem) {
        await remindersApi.update(editItem.id, form)
      } else {
        await remindersApi.create(form)
      }
      closeModal()
      load()
    } catch {
      alert('Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu eslatmani o\'chirasizmi?')) return
    try {
      await remindersApi.delete(id)
      load()
    } catch {
      alert('O\'chirishda xatolik')
    }
  }

  const toggleComplete = async (item) => {
    try {
      await remindersApi.update(item.id, { completed: !item.completed })
      load()
    } catch {}
  }

  const f = form
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Layout
      title="Eslatmalar"
      rightAction={
        <button className="icon-btn" onClick={openCreate}>
          <Plus size={24} />
        </button>
      }
    >
      <div className="page-list">
        {/* Yangi eslatma tugmasi */}
        <button className="add-bar" onClick={openCreate}>
          <Plus size={20} color="var(--primary)" />
          <span>Yangi eslatma qo'shish</span>
        </button>

        {loading && <div className="loading-text">Yuklanmoqda...</div>}

        {!loading && reminders.length === 0 && (
          <div className="empty-state">
            <Bell size={48} color="var(--text-secondary)" />
            <p>Hali eslatmalar yo'q</p>
          </div>
        )}

        {reminders.map(item => (
          <Card key={item.id} className={`list-item ${item.completed ? 'completed' : ''}`}>
            {/* Bajarildi tugmasi */}
            <button className="icon-btn" onClick={() => toggleComplete(item)}>
              {item.completed
                ? <CheckCircle size={22} color="#16A34A" />
                : <Circle size={22} color="var(--text-secondary)" />
              }
            </button>

            <div className="list-item-info">
              <span className={`list-item-text ${item.completed ? 'strike' : ''}`}>
                {item.text}
              </span>
              <span className="list-item-sub">
                {item.date?.split('T')[0]}
                {item.time && ` — ${item.time}`}
                {item.repeatType !== 'once' && ` · ${REPEAT_OPTIONS.find(r => r.value === item.repeatType)?.label}`}
              </span>
            </div>

            {/* Tahrirlash */}
            <button className="icon-btn" onClick={() => openEdit(item)}>
              <Pencil size={16} color="var(--primary)" />
            </button>

            {/* O'chirish */}
            <button className="icon-btn" onClick={() => handleDelete(item.id)}>
              <Trash2 size={16} color="var(--danger)" />
            </button>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={editItem ? 'Eslatmani tahrirlash' : 'Yangi eslatma'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} style={{ flex: 1 }}>Bekor</Button>
            <Button onClick={handleSave} loading={saving} style={{ flex: 1 }}>Saqlash</Button>
          </>
        }
      >
        <Input label="Eslatma matni" value={f.text} onChange={e => set('text', e.target.value)} placeholder="Nima eslatish kerak?" required />
        <Input label="Sana" type="date" value={f.date} onChange={e => set('date', e.target.value)} required />
        <Input label="Vaqt" type="time" value={f.time} onChange={e => set('time', e.target.value)} />

        <div className="input-group">
          <label className="input-label">Takrorlanish</label>
          <div className="option-row">
            {REPEAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`option-btn ${f.repeatType === opt.value ? 'active' : ''}`}
                onClick={() => set('repeatType', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
