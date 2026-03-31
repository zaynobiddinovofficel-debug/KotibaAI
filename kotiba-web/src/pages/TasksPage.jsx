import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckSquare, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { tasksApi } from '../services/api'

const PRIORITIES = [
  { value: 'low',    label: 'Past',    color: '#6B7280' },
  { value: 'medium', label: 'O\'rta',  color: '#F59E0B' },
  { value: 'urgent', label: 'Shoshilinch', color: '#DC2626' },
]

const EMPTY_FORM = { text: '', deadline: '', priority: 'medium' }

export default function TasksPage() {
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })

  const load = useCallback(async () => {
    try {
      const res = await tasksApi.getAll()
      setTasks(res.data || [])
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
      text:     item.text || '',
      deadline: item.deadline ? item.deadline.slice(0, 16) : '',
      priority: item.priority || 'medium',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!form.text.trim()) { alert('Vazifa matni kiritilishi shart'); return }
    setSaving(true)
    try {
      const data = {
        text:     form.text.trim(),
        deadline: form.deadline || null,
        priority: form.priority,
      }
      if (editItem) {
        await tasksApi.update(editItem.id, data)
      } else {
        await tasksApi.create(data)
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
    if (!window.confirm('Bu vazifani o\'chirasizmi?')) return
    try {
      await tasksApi.delete(id)
      load()
    } catch {
      alert('O\'chirishda xatolik')
    }
  }

  const toggleComplete = async (item) => {
    try {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed'
      await tasksApi.update(item.id, { status: newStatus })
      load()
    } catch {}
  }

  const pending   = tasks.filter(t => t.status !== 'completed')
  const completed = tasks.filter(t => t.status === 'completed')
  const f   = form
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <Layout
      title="Vazifalar"
      rightAction={
        <button className="icon-btn" onClick={openCreate}>
          <Plus size={24} />
        </button>
      }
    >
      <div className="page-list">
        <button className="add-bar" onClick={openCreate}>
          <Plus size={20} color="var(--primary)" />
          <span>Yangi vazifa qo'shish</span>
        </button>

        {loading && <div className="loading-text">Yuklanmoqda...</div>}

        {!loading && tasks.length === 0 && (
          <div className="empty-state">
            <CheckSquare size={48} color="var(--text-secondary)" />
            <p>Hali vazifalar yo'q</p>
          </div>
        )}

        {/* Bajarilmagan */}
        {pending.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 8 }}>Bajarilishi kerak ({pending.length})</h3>
            {pending.map(item => <TaskItem key={item.id} item={item} onToggle={toggleComplete} onEdit={openEdit} onDelete={handleDelete} />)}
          </>
        )}

        {/* Bajarilgan */}
        {completed.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Bajarilgan ({completed.length})</h3>
            {completed.map(item => <TaskItem key={item.id} item={item} onToggle={toggleComplete} onEdit={openEdit} onDelete={handleDelete} />)}
          </>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editItem ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} style={{ flex: 1 }}>Bekor</Button>
            <Button onClick={handleSave} loading={saving} style={{ flex: 1 }}>Saqlash</Button>
          </>
        }
      >
        <Input label="Vazifa matni" value={f.text} onChange={e => set('text', e.target.value)} placeholder="Nima qilish kerak?" required />
        <Input label="Muddat (ixtiyoriy)" type="datetime-local" value={f.deadline} onChange={e => set('deadline', e.target.value)} />

        <div className="input-group">
          <label className="input-label">Muhimlik darajasi</label>
          <div className="option-row">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                className={`option-btn ${f.priority === p.value ? 'active' : ''}`}
                style={f.priority === p.value ? { borderColor: p.color, backgroundColor: p.color + '20', color: p.color } : {}}
                onClick={() => set('priority', p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

function TaskItem({ item, onToggle, onEdit, onDelete }) {
  const priority = PRIORITIES.find(p => p.value === item.priority)
  return (
    <Card className={`list-item ${item.status === 'completed' ? 'completed' : ''}`}>
      <button className="icon-btn" onClick={() => onToggle(item)}>
        {item.status === 'completed'
          ? <CheckCircle size={22} color="#16A34A" />
          : <Circle size={22} color="var(--text-secondary)" />
        }
      </button>
      <div className="list-item-info">
        <span className={`list-item-text ${item.status === 'completed' ? 'strike' : ''}`}>
          {item.text}
        </span>
        <span className="list-item-sub">
          {priority && <span style={{ color: priority.color, marginRight: 6 }}>● {priority.label}</span>}
          {item.deadline && `Muddat: ${new Date(item.deadline).toLocaleDateString('uz')}`}
        </span>
      </div>
      <button className="icon-btn" onClick={() => onEdit(item)}>
        <Pencil size={16} color="var(--primary)" />
      </button>
      <button className="icon-btn" onClick={() => onDelete(item.id)}>
        <Trash2 size={16} color="var(--danger)" />
      </button>
    </Card>
  )
}
