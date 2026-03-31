import { useState, useEffect, useCallback } from 'react'
import { Plus, UserPlus, Phone, Pencil, Trash2, Download } from 'lucide-react'
import { Layout } from '../components/Layout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { clientsApi } from '../services/api'

const EMPTY_FORM = { name: '', phone: '', note: '' }

export default function ClientsPage() {
  const [clients,   setClients]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY_FORM })

  const load = useCallback(async () => {
    try {
      const res = await clientsApi.getAll()
      setClients(res.data || [])
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
    setForm({ name: item.name || '', phone: item.phone || '', note: item.note || '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditItem(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Ism kiritilishi shart'); return }
    setSaving(true)
    try {
      if (editItem) {
        await clientsApi.update(editItem.id, form)
      } else {
        await clientsApi.create(form)
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
    if (!window.confirm('Mijozni ochirasizmi?')) return
    try {
      await clientsApi.delete(id)
      load()
    } catch {
      alert('Ochirishda xatolik')
    }
  }

  const handleExport = async () => {
    try {
      const blob = await clientsApi.exportExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mijozlar.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Yuklab olishda xatolik')
    }
  }

  const f   = form
  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <Layout
      title="Mijozlar"
      rightAction={
        <button className="icon-btn" onClick={handleExport} title="Excel yuklab olish">
          <Download size={22} />
        </button>
      }
    >
      <div className="page-list">
        <button className="add-bar" onClick={openCreate}>
          <Plus size={20} color="var(--primary)" />
          <span>Yangi mijoz qoshish</span>
        </button>

        {loading && <div className="loading-text">Yuklanmoqda...</div>}

        {!loading && clients.length === 0 && (
          <div className="empty-state">
            <UserPlus size={48} color="var(--text-secondary)" />
            <p>Hali mijozlar yoq</p>
          </div>
        )}

        {clients.map(item => (
          <Card key={item.id} className="list-item">
            <div className="client-avatar">
              <span>{(item.name[0] || 'M').toUpperCase()}</span>
            </div>
            <div className="list-item-info">
              <span className="list-item-text">{item.name}</span>
              <span className="list-item-sub">
                {item.phone && <span><Phone size={12} style={{marginRight:4}} />{item.phone}</span>}
                {item.note && <span style={{marginLeft:8}}>{item.note}</span>}
              </span>
            </div>
            <button className="icon-btn" onClick={() => openEdit(item)}>
              <Pencil size={16} color="var(--primary)" />
            </button>
            <button className="icon-btn" onClick={() => handleDelete(item.id)}>
              <Trash2 size={16} color="var(--danger)" />
            </button>
          </Card>
        ))}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editItem ? 'Mijozni tahrirlash' : 'Yangi mijoz'}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} style={{ flex: 1 }}>Bekor</Button>
            <Button onClick={handleSave} loading={saving} style={{ flex: 1 }}>Saqlash</Button>
          </>
        }
      >
        <Input label="Ism" value={f.name} onChange={set('name')} placeholder="Mijoz ismi" required />
        <Input label="Telefon" type="tel" value={f.phone} onChange={set('phone')} placeholder="+998..." />
        <Input label="Izoh" value={f.note} onChange={set('note')} placeholder="Qoshimcha izoh" />
      </Modal>
    </Layout>
  )
}
