import { useState, useEffect } from 'react'
import { expensesAPI } from '../services/api'
import ExpenseSummary from '../components/expenses/ExpenseSummary'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseForm from '../components/expenses/ExpenseForm'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [expRes, sumRes] = await Promise.all([
        expensesAPI.getAll(),
        expensesAPI.getSummary()
      ])
      setExpenses(Array.isArray(expRes.data) ? expRes.data : [])
      setSummary(sumRes.data || null)
    } catch {
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (formData) => {
    try {
      const res = await expensesAPI.create(formData)
      setExpenses(prev => [res.data, ...prev])
      setShowForm(false)
      // Refresh summary
      expensesAPI.getSummary().then(r => setSummary(r.data)).catch(() => {})
    } catch {}
  }

  const handleUpdate = async (formData) => {
    if (!editingExpense) return
    try {
      const res = await expensesAPI.update(editingExpense._id, formData)
      setExpenses(prev => prev.map(e => e._id === editingExpense._id ? res.data : e))
      setEditingExpense(null)
      setShowForm(false)
      expensesAPI.getSummary().then(r => setSummary(r.data)).catch(() => {})
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xarajatni o\'chirishni tasdiqlaysizmi?')) return
    try {
      await expensesAPI.delete(id)
      setExpenses(prev => prev.filter(e => e._id !== id))
      expensesAPI.getSummary().then(r => setSummary(r.data)).catch(() => {})
    } catch {}
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('expense-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 pb-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Xarajatlar</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Moliyaviy hisobingizni nazorat qiling
        </p>
      </div>

      {/* Summary at top */}
      {!loading && (
        <ExpenseSummary summary={summary} />
      )}
      {loading && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Oxirgi xarajatlar
        </p>
        {expenses.length > 0 && (
          <span className="text-xs text-gray-400">{expenses.length} ta</span>
        )}
      </div>

      {/* Expense list */}
      <ExpenseList
        expenses={expenses}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true) }}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#6C63FF]/40 text-[#6C63FF] text-sm font-medium flex items-center justify-center gap-2 hover:border-[#6C63FF] hover:bg-[#6C63FF]/5 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Xarajat qo'shish
        </button>
      )}

      {/* Expense form */}
      {showForm && (
        <div id="expense-form-section">
          <ExpenseForm
            expense={editingExpense}
            onSave={editingExpense ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}
    </div>
  )
}
