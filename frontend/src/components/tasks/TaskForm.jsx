import { useState } from 'react'

export default function TaskForm({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
    remindBeforeMinutes: task?.remindBeforeMinutes ?? 10,
    isVoiceReminder: task?.isVoiceReminder ?? true
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Vazifa nomini kiriting'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
      remindBeforeMinutes: Number(form.remindBeforeMinutes)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">
        {task ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
      </h3>

      <div className="flex flex-col gap-3">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Vazifa nomi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
            placeholder="Vazifa nomini kiriting"
            className={`w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 transition-colors ${
              errors.title
                ? 'border-red-400'
                : 'border-transparent focus:border-[#6C63FF]'
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tavsif (ixtiyoriy)
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Qo'shimcha ma'lumot..."
            rows={2}
            className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] resize-none transition-colors"
          />
        </div>

        {/* Due date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Sana va vaqt
          </label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors"
          />
        </div>

        {/* Remind before */}
        {form.dueDate && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Eslatma vaqti
            </label>
            <select
              value={form.remindBeforeMinutes}
              onChange={e => setForm({ ...form, remindBeforeMinutes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 outline-none border-2 border-transparent focus:border-[#6C63FF] transition-colors"
            >
              <option value={0}>Vaqtida eslat</option>
              <option value={10}>10 daqiqa oldin</option>
              <option value={30}>30 daqiqa oldin</option>
              <option value={60}>1 soat oldin</option>
              <option value={1440}>1 kun oldin</option>
            </select>
          </div>
        )}

        {/* Voice reminder toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ovozli eslatma</p>
            <p className="text-xs text-gray-400 mt-0.5">Eslatma ovoz bilan o'qiladi</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isVoiceReminder: !form.isVoiceReminder })}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
              form.isVoiceReminder ? 'bg-[#6C63FF]' : 'bg-gray-200 dark:bg-gray-600'
            }`}
            aria-label="Ovozli eslatma"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                form.isVoiceReminder ? 'left-[26px]' : 'left-0.5'
              }`}
            />
          </button>
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
