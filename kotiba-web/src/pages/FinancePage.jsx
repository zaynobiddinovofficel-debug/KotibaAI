import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Layout } from '../components/Layout.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Card } from '../components/ui/Card.jsx'
import { financeAPI } from '../services/api.js'

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB']
const PERIODS = [
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Oy' },
  { value: 'year', label: 'Yil' },
]

const EMPTY_FORM = {
  type: 'expense',
  amount: '',
  currency: 'UZS',
  categoryId: '',
  note: '',
}

function formatMoney(amount, currency = 'UZS') {
  if (amount == null) return '0'
  const n = Number(amount)
  if (currency === 'UZS') return n.toLocaleString('uz-UZ') + ' so\'m'
  if (currency === 'USD') return '$' + n.toLocaleString('en-US')
  return n.toLocaleString() + ' ' + currency
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [txRes, statsRes, catRes] = await Promise.all([
        financeAPI.getAll(),
        financeAPI.getStats(period),
        financeAPI.getCategories(),
      ])
      setTransactions(txRes.data || [])
      setStats(statsRes.data || null)
      setCategories(catRes.data || [])
    } catch (err) {
      alert('Moliya ma\'lumotlarini yuklashda xatolik: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (tx) => {
    setEditItem(tx)
    setForm({
      type: tx.type || 'expense',
      amount: String(tx.amount || ''),
      currency: tx.currency || 'UZS',
      categoryId: tx.categoryId || tx.category?.id || '',
      note: tx.note || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
  }

  const validate = () => {
    const errs = {}
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = "To'g'ri summa kiriting"
    }
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        categoryId: form.categoryId || null,
        note: form.note.trim(),
      }
      if (editItem) {
        await financeAPI.update(editItem.id, payload)
      } else {
        await financeAPI.create(payload)
      }
      await loadAll()
      closeModal()
    } catch (err) {
      alert('Saqlashda xatolik: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, note) => {
    if (!window.confirm(`"${note || 'Bu tranzaksiya'}"ni o'chirishni tasdiqlaysizmi?`)) return
    try {
      await financeAPI.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      alert("O'chirishda xatolik: " + (err.response?.data?.message || err.message))
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  // Build bar chart data from byCategory stats
  const chartData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, val]) => ({
        name,
        amount: typeof val === 'object' ? val.total || val.amount || 0 : val,
      }))
    : []

  const maxChartVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.amount)) : 1

  const filteredCategories = categories.filter(c => c.type === form.type || !c.type)

  const modalFooter = (
    <div className="modal-footer-btns">
      <Button variant="outline" onClick={closeModal} disabled={saving}>Bekor qilish</Button>
      <Button onClick={handleSave} loading={saving}>{editItem ? 'Saqlash' : "Qo'shish"}</Button>
    </div>
  )

  return (
    <Layout
      title="Moliya"
      rightAction={
        <button className="header-action-btn" onClick={openCreate} aria-label="Yangi tranzaksiya">
          <Plus size={22} />
        </button>
      }
    >
      <div className="container">
        {/* Period selector */}
        <div className="period-selector">
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`period-btn ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Yuklanmoqda...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {stats && (
              <div className="finance-summary">
                <Card className="finance-stat-card income-card">
                  <TrendingUp size={20} />
                  <div>
                    <p className="finance-stat-label">Kirim</p>
                    <p className="finance-stat-value income-text">
                      {formatMoney(stats.totalIncome)}
                    </p>
                  </div>
                </Card>
                <Card className="finance-stat-card expense-card">
                  <TrendingDown size={20} />
                  <div>
                    <p className="finance-stat-label">Chiqim</p>
                    <p className="finance-stat-value expense-text">
                      {formatMoney(stats.totalExpense)}
                    </p>
                  </div>
                </Card>
                <Card className="finance-stat-card balance-card">
                  <DollarSign size={20} />
                  <div>
                    <p className="finance-stat-label">Balans</p>
                    <p
                      className="finance-stat-value"
                      style={{ color: stats.balance >= 0 ? 'var(--income)' : 'var(--danger)' }}
                    >
                      {formatMoney(stats.balance)}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* Bar chart */}
            {chartData.length > 0 && (
              <Card className="chart-card">
                <h3 className="chart-title">Kategoriyalar bo'yicha</h3>
                <div className="bar-chart">
                  {chartData.slice(0, 8).map((item, i) => (
                    <div key={i} className="bar-row">
                      <span className="bar-label">{item.name}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max((item.amount / maxChartVal) * 100, 2)}%` }}
                        />
                      </div>
                      <span className="bar-value">{formatMoney(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Transactions list */}
            <h3 className="section-title" style={{ margin: '16px 0 8px' }}>So'nggi tranzaksiyalar</h3>
            {transactions.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={48} className="empty-icon" />
                <p>Hali tranzaksiyalar yo'q</p>
                <Button onClick={openCreate} style={{ marginTop: '16px' }}>
                  + Tranzaksiya qo'shish
                </Button>
              </div>
            ) : (
              <div className="list-items">
                {transactions.map(tx => (
                  <div key={tx.id} className="list-item finance-item">
                    <div
                      className="finance-type-dot"
                      style={{ backgroundColor: tx.type === 'income' ? 'var(--income)' : 'var(--danger)' }}
                    />
                    <div className="list-item-content">
                      <span className="list-item-title">
                        {tx.note || (tx.category?.name) || (tx.type === 'income' ? 'Kirim' : 'Chiqim')}
                      </span>
                      <span className="list-item-sub">
                        {tx.category?.name && tx.note ? `${tx.category.name} • ` : ''}
                        {tx.date ? new Date(tx.date).toLocaleDateString('uz-UZ') : ''}
                      </span>
                    </div>
                    <div className="finance-amount-col">
                      <span
                        className="finance-amount"
                        style={{ color: tx.type === 'income' ? 'var(--income)' : 'var(--danger)' }}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount, tx.currency)}
                      </span>
                      <div className="list-item-actions">
                        <button className="icon-btn" onClick={() => openEdit(tx)} aria-label="Tahrirlash">
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDelete(tx.id, tx.note)}
                          aria-label="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && transactions.length > 0 && (
          <button className="fab" onClick={openCreate} aria-label="Yangi tranzaksiya">
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editItem ? 'Tranzaksiyani tahrirlash' : 'Yangi tranzaksiya'}
        footer={modalFooter}
      >
        {/* Type toggle */}
        <div className="form-group">
          <label className="form-label">Tur</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${form.type === 'income' ? 'active income-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income', categoryId: '' }))}
            >
              📈 Kirim
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${form.type === 'expense' ? 'active expense-active' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense', categoryId: '' }))}
            >
              📉 Chiqim
            </button>
          </div>
        </div>

        <Input
          label="Summa"
          type="number"
          value={form.amount}
          onChange={set('amount')}
          placeholder="0"
          min="0"
          required
          error={errors.amount}
          inputMode="numeric"
        />

        {/* Currency selector */}
        <div className="form-group">
          <label className="form-label">Valyuta</label>
          <div className="currency-grid">
            {CURRENCIES.map(c => (
              <button
                key={c}
                type="button"
                className={`currency-btn ${form.currency === c ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, currency: c }))}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Category grid */}
        {filteredCategories.length > 0 && (
          <div className="form-group">
            <label className="form-label">Kategoriya</label>
            <div className="category-grid">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-btn ${form.categoryId === String(cat.id) ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, categoryId: String(cat.id) }))}
                >
                  <span className="category-icon">{cat.icon || '📦'}</span>
                  <span className="category-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Izoh"
          value={form.note}
          onChange={set('note')}
          placeholder="Qo'shimcha izoh..."
        />
      </Modal>
    </Layout>
  )
}
