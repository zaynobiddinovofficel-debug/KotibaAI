import { useState, useEffect } from 'react'
import { tasksAPI } from '../services/api'
import TaskList from '../components/tasks/TaskList'
import TaskForm from '../components/tasks/TaskForm'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'active'
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await tasksAPI.getAll()
      setTasks(Array.isArray(res.data) ? res.data : [])
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = filter === 'active'
    ? tasks.filter(t => !t.completed)
    : tasks

  const activeCount = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length

  const handleCreate = async (formData) => {
    try {
      const res = await tasksAPI.create(formData)
      setTasks(prev => [res.data, ...prev])
      setShowForm(false)
    } catch {}
  }

  const handleUpdate = async (formData) => {
    if (!editingTask) return
    try {
      const res = await tasksAPI.update(editingTask._id, formData)
      setTasks(prev => prev.map(t => t._id === editingTask._id ? res.data : t))
      setEditingTask(null)
      setShowForm(false)
    } catch {}
  }

  const handleComplete = async (id) => {
    try {
      const res = await tasksAPI.complete(id)
      setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t))
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Vazifani o\'chirishni tasdiqlaysizmi?')) return
    try {
      await tasksAPI.delete(id)
      setTasks(prev => prev.filter(t => t._id !== id))
    } catch {}
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setShowForm(true)
    // Scroll to form
    setTimeout(() => {
      document.getElementById('task-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingTask(null)
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4 pb-6">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeCount} ta faol · {completedCount} ta bajarilgan
          </p>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2">
        <div className="flex-1 bg-[#6C63FF]/10 rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-[#6C63FF]">{activeCount}</p>
          <p className="text-[10px] text-[#6C63FF]/80">Faol</p>
        </div>
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{completedCount}</p>
          <p className="text-[10px] text-green-600/80 dark:text-green-400/80">Bajarilgan</p>
        </div>
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{tasks.length}</p>
          <p className="text-[10px] text-gray-400">Jami</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[
          { id: 'all', label: 'Barchasi' },
          { id: 'active', label: 'Faol' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <TaskList
        tasks={filteredTasks}
        loading={loading}
        onComplete={handleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add button (shown when form is closed) */}
      {!showForm && (
        <button
          onClick={() => { setEditingTask(null); setShowForm(true) }}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#6C63FF]/40 text-[#6C63FF] text-sm font-medium flex items-center justify-center gap-2 hover:border-[#6C63FF] hover:bg-[#6C63FF]/5 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Yangi vazifa
        </button>
      )}

      {/* Task form */}
      {showForm && (
        <div id="task-form-section">
          <TaskForm
            task={editingTask}
            onSave={editingTask ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}
    </div>
  )
}
