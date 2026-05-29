import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckSquare, Square, Trash2, Flag,
  Clock, ChevronDown, ChevronUp, Bell, BellOff, Filter
} from 'lucide-react'
import { useTodosStore } from '../../store/useTodosStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './Todos.module.css'

const PRIORITIES = [
  { value: 'high',   label: 'Tinggi',  color: 'var(--color-danger)' },
  { value: 'medium', label: 'Sedang',  color: 'var(--color-warning)' },
  { value: 'low',    label: 'Rendah',  color: 'var(--color-success)' },
]

const CATEGORIES = ['Kuliah', 'Tugas', 'UTS/UAS', 'Proyek', 'Personal', 'Lainnya']

const DEFAULT_FORM = {
  title: '', description: '', category: 'Kuliah',
  priority: 'medium', deadline: '', reminderAt: '',
}

export default function Todos() {
  const { todos, loading, fetchTodos, addTodo, toggleTodo, deleteTodo,
          filter, setFilter, getFilteredTodos, getStats, requestNotificationPermission } = useTodosStore()
  const { addToast } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [showFilter, setShowFilter] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchTodos()
    requestNotificationPermission()
  }, [])

  const filtered = getFilteredTodos()
  const stats = getStats()

  const handleAdd = async () => {
    if (!form.title.trim()) { addToast('Judul tugas wajib diisi!', 'warning'); return }
    await addTodo(form)
    addToast('Tugas ditambahkan!', 'success')
    setForm(DEFAULT_FORM)
    setShowForm(false)
  }

  const handleDelete = async (id, title) => {
    await deleteTodo(id)
    addToast(`"${title}" dihapus`, 'info')
  }

  const isOverdue = (todo) => todo.deadline && !todo.completed && new Date(todo.deadline) < new Date()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>To-Do</h1>
          <div className={styles.headerActions}>
            <button className={styles.filterBtn} onClick={() => setShowFilter(v => !v)}>
              <Filter size={16} />
            </button>
            <button id="todos-add-btn" className={styles.addBtn} onClick={() => setShowForm(true)}>
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className={styles.statsRow}>
          <StatPill label="Total" value={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} />
          <StatPill label="Aktif" value={stats.total - stats.completed} active={filter === 'active'} onClick={() => setFilter('active')} />
          <StatPill label="Selesai" value={stats.completed} active={filter === 'completed'} onClick={() => setFilter('completed')} color="var(--color-success)" />
          {stats.overdue > 0 && (
            <StatPill label="Overdue" value={stats.overdue} active={false} onClick={() => setFilter('active')} color="var(--color-danger)" />
          )}
        </div>
      </div>

      {/* Todo list */}
      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <CheckSquare size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p>{filter === 'completed' ? 'Belum ada tugas selesai' : 'Tidak ada tugas aktif 🎉'}</p>
            {filter !== 'completed' && (
              <button className={styles.emptyBtn} onClick={() => setShowForm(true)}>
                <Plus size={14} /> Tambah Tugas
              </button>
            )}
          </div>
        ) : (
          <motion.div className={styles.list} layout>
            <AnimatePresence>
              {filtered.map(todo => {
                const overdue = isOverdue(todo)
                const prio = PRIORITIES.find(p => p.value === todo.priority) || PRIORITIES[1]
                const expanded = expandedId === todo.id

                return (
                  <motion.div
                    key={todo.id}
                    className={`${styles.todoCard} ${todo.completed ? styles.completed : ''} ${overdue ? styles.overdue : ''}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, padding: 0, margin: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  >
                    {/* Priority strip */}
                    <div className={styles.priorityStrip} style={{ background: prio.color }} />

                    <div className={styles.todoMain}>
                      {/* Checkbox */}
                      <button
                        className={styles.checkbox}
                        onClick={() => toggleTodo(todo.id)}
                        aria-label={todo.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        {todo.completed
                          ? <CheckSquare size={22} color="var(--color-success)" />
                          : <Square size={22} color="var(--color-text-muted)" />
                        }
                      </button>

                      {/* Content */}
                      <div className={styles.todoContent} onClick={() => setExpandedId(expanded ? null : todo.id)}>
                        <p className={`${styles.todoTitle} ${todo.completed ? styles.strikethrough : ''}`}>
                          {todo.title}
                        </p>
                        <div className={styles.todoMeta}>
                          <span className={styles.metaBadge}>{todo.category}</span>
                          <span className={styles.metaBadge} style={{ color: prio.color }}>
                            <Flag size={10} /> {prio.label}
                          </span>
                          {todo.deadline && (
                            <span className={`${styles.metaDeadline} ${overdue ? styles.deadlineOverdue : ''}`}>
                              <Clock size={10} />
                              {new Date(todo.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {todo.reminderAt && <Bell size={10} color="var(--color-primary)" />}
                        </div>
                      </div>

                      {/* Expand indicator + delete */}
                      <div className={styles.todoActions}>
                        <button className={styles.expandBtn} onClick={() => setExpandedId(expanded ? null : todo.id)}>
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(todo.id, todo.title)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          className={styles.todoDetail}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {todo.description && (
                            <p className={styles.todoDesc}>{todo.description}</p>
                          )}
                          <div className={styles.detailRow}>
                            {todo.deadline && (
                              <span><Clock size={12} /> Deadline: {new Date(todo.deadline).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            )}
                            {todo.reminderAt && (
                              <span><Bell size={12} /> Reminder: {new Date(todo.reminderAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add Todo Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className={styles.overlay}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />
            <motion.div className={styles.modal}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Tambah Tugas</h3>
              <div className={styles.form}>
                <FormField label="Judul Tugas *">
                  <input id="todo-title" className={styles.input} placeholder="Apa yang perlu dikerjakan?"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                </FormField>
                <FormField label="Deskripsi">
                  <textarea className={styles.textarea} placeholder="Detail tugas (opsional)..."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </FormField>
                <div className={styles.twoCol}>
                  <FormField label="Kategori">
                    <select id="todo-category" className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Prioritas">
                    <select id="todo-priority" className={styles.input} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Deadline">
                  <input id="todo-deadline" type="datetime-local" className={styles.input}
                    value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </FormField>
                <FormField label="Reminder (Notifikasi)">
                  <input id="todo-reminder" type="datetime-local" className={styles.input}
                    value={form.reminderAt} onChange={e => setForm(f => ({ ...f, reminderAt: e.target.value }))} />
                </FormField>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Batal</button>
                <button id="todo-save" className={styles.saveBtn} onClick={handleAdd}>Tambah</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatPill({ label, value, active, onClick, color }) {
  return (
    <button className={`${styles.statPill} ${active ? styles.statActive : ''}`} onClick={onClick}>
      <span className={styles.statVal} style={color ? { color } : {}}>{value}</span>
      <span className={styles.statLab}>{label}</span>
    </button>
  )
}

function FormField({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}
