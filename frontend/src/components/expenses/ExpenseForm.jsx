import { useState } from 'react'

const CATEGORIES = [
  'Umumiy',
  'Oziq-ovqat',
  'Transport',
  'Kiyim',
  "Sog'liq",
  "Ta'lim",
  "Ko'ngil ochar",
  'Boshqa'
]

export default function ExpenseForm({ expense, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    amount: expense?.amount || '',
    category: expense?.category || 'Umumiy',
    description: expense?.description || '',
    date: expense?.date
      ? new Date(expense.date).toISOString().split('T')[0]
      : today
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = 'To\'g\'ri miqdor kiriting'
    }
    if (!form.date) {
      errs.date = 'Sanani tanlang'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
      date: form.date
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
        {expense ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}
      </h3>

      <div className="flex flex-col gap-3">
        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Miqdor (so'm) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.amount}
            onChange={e => { setForm({ ...form, amount: e.target.value }); setErrors({ ...errors, amount: '' }) }}
            placeholder="Masalan: 150000"
            min="1"
            className={`w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 transition-colors ${
              errors.amount ? 'border-red-400' : 'border-transparent focus:border-[#6C63FF]'
            }`}
          />
          {errors.amount && (
            <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Toifa
          </label>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tavsif (ixtiyoriy)
          </label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Nima uchun sarfladingiz?"
            className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Sana <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={e => { setForm({ ...form, date: e.target.value }); setErrors({ ...errors, date: '' }) }}
            className={`w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 transition-colors ${
              errors.date ? 'border-red-400' : 'border-transparent focus:border-[#6C63FF]'
            }`}
          />
          {errors.date && (
            <p className="text-xs text-red-500 mt-1">{errors.date}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Bekor qilish
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold hover:bg-[#5A52E0] transition-colors"
        >
          Saqlash
        </button>
      </div>
    </form>
  )
}
