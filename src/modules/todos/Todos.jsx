import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CheckSquare, Square, Trash2, Flag,
  Clock, ChevronDown, ChevronUp, Bell, BellOff, Filter,
  UploadCloud, X, FileText, File
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
  priority: 'medium', deadline: '', reminderAt: '', reminderType: 'none',
}

const getFileIcon = (type) => {
  if (type.includes('pdf')) return <FileText size={18} color="#EF4444" />
  if (type.includes('word') || type.includes('officedocument.wordprocessing')) return <FileText size={18} color="#2563EB" />
  if (type.includes('spreadsheet') || type.includes('officedocument.spreadsheet')) return <FileText size={18} color="#10B981" />
  if (type.includes('text/plain')) return <FileText size={18} color="#475569" />
  return <File size={18} color="#94A3B8" />
}

export default function Todos() {
  const { todos, loading, fetchTodos, addTodo, toggleTodo, deleteTodo,
          filter, setFilter, getFilteredTodos, getStats, requestNotificationPermission } = useTodosStore()
  const { addToast } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [showFilter, setShowFilter] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  
  // Custom states and refs for document uploads and lightbox zoom
  const [selectedFiles, setSelectedFiles] = useState([])
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null)
  const objectUrlsMap = useRef({})

  useEffect(() => {
    fetchTodos()
    requestNotificationPermission()

    // Cleanup object URLs on unmount
    return () => {
      Object.values(objectUrlsMap.current).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const filtered = getFilteredTodos()
  const stats = getStats()

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileUrl = (file) => {
    const key = `${file.name}-${file.size}`
    if (!objectUrlsMap.current[key]) {
      objectUrlsMap.current[key] = URL.createObjectURL(file.blob)
    }
    return objectUrlsMap.current[key]
  }

  const handleViewFile = (file) => {
    const url = getFileUrl(file)
    if (file.type.startsWith('image/')) {
      setZoomPhotoUrl(url)
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleFileSelect = (e) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    const MAX_SIZE = 15 * 1024 * 1024 // 15MB
    const validFiles = []

    filesArray.forEach(file => {
      if (file.size > MAX_SIZE) {
        addToast(`File "${file.name}" terlalu besar! Maksimal 15MB.`, 'warning')
      } else {
        validFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          blob: file
        })
      }
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleAdd = async () => {
    if (!form.title.trim()) { addToast('Judul tugas wajib diisi!', 'warning'); return }
    await addTodo({
      ...form,
      files: selectedFiles
    })
    addToast('Tugas ditambahkan!', 'success')
    setForm(DEFAULT_FORM)
    setSelectedFiles([])
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
          <h1 className={styles.title}>Tugas</h1>
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
            <p>{filter === 'completed' ? 'Belum ada tugas selesai' : 'Tidak ada tugas aktif'}</p>
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
                          {(todo.reminderAt || todo.reminderType === 'weekly') && (
                            <span className={styles.metaBadge} style={{ color: 'var(--color-primary)' }}>
                              <Bell size={10} />
                              {todo.reminderType === 'weekly' ? 'Mingguan' : 'Sekali'}
                            </span>
                          )}
                          {todo.files && todo.files.length > 0 && (
                            <span className={styles.metaBadge}>
                              <FileText size={10} /> {todo.files.length} File
                            </span>
                          )}
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
                            {todo.reminderType === 'weekly' ? (
                              <span><Bell size={12} /> Pengingat: Mingguan (sejak dibuat)</span>
                            ) : todo.reminderAt ? (
                              <span><Bell size={12} /> Pengingat: {new Date(todo.reminderAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            ) : null}
                          </div>

                          {/* Supporting Documents List */}
                          {todo.files && todo.files.length > 0 && (
                            <div className={styles.detailAttachments}>
                              <p className={styles.attachmentsTitle}>Dokumen Pendukung ({todo.files.length}):</p>
                              <div className={styles.attachmentsGrid}>
                                {todo.files.map((file, idx) => {
                                  const isImage = file.type.startsWith('image/')
                                  return (
                                    <div key={idx} className={styles.attachmentCard} onClick={() => handleViewFile(file)}>
                                      {isImage ? (
                                        <div className={styles.imgPreview}>
                                          <img src={getFileUrl(file)} alt={file.name} />
                                        </div>
                                      ) : (
                                        <div className={styles.docIcon}>
                                          {getFileIcon(file.type)}
                                        </div>
                                      )}
                                      <div className={styles.attachmentInfo}>
                                        <span className={styles.attachmentName} title={file.name}>
                                          {file.name}
                                        </span>
                                        <span className={styles.attachmentSize}>
                                          {formatSize(file.size)}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
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
                <FormField label="Pengingat (Notifikasi)">
                  <select
                    id="todo-reminder-type"
                    className={styles.input}
                    value={form.reminderType || 'none'}
                    onChange={e => setForm(f => ({ ...f, reminderType: e.target.value, reminderAt: e.target.value === 'once' ? f.reminderAt : '' }))}
                  >
                    <option value="none">Tidak Ada</option>
                    <option value="once">Satu Kali (Tanggal & Jam)</option>
                    <option value="weekly">Mingguan (Sejak Dibuat)</option>
                  </select>
                </FormField>

                {form.reminderType === 'once' && (
                  <FormField label="Waktu Pengingat">
                    <input
                      id="todo-reminder-time"
                      type="datetime-local"
                      className={styles.input}
                      value={form.reminderAt}
                      onChange={e => setForm(f => ({ ...f, reminderAt: e.target.value }))}
                    />
                  </FormField>
                )}

                {form.reminderType === 'weekly' && (
                  <div className={styles.reminderInfo}>
                    <Bell size={12} style={{ marginRight: 4 }} />
                    Notifikasi akan dikirimkan setiap minggu dari sejak tugas ini dibuat.
                  </div>
                )}

                <FormField label="Dokumen Pendukung">
                  <div className={styles.uploadArea}>
                    <label htmlFor="todo-files-input" className={styles.uploadLabel}>
                      <UploadCloud size={20} />
                      <span>Pilih File (Maksimal 15MB)</span>
                    </label>
                    <input
                      id="todo-files-input"
                      type="file"
                      multiple
                      className={styles.fileInput}
                      onChange={handleFileSelect}
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className={styles.fileList}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className={styles.fileItem}>
                          <span className={styles.fileName}>{file.name}</span>
                          <span className={styles.fileSize}>({formatSize(file.size)})</span>
                          <button
                            type="button"
                            className={styles.removeFileBtn}
                            onClick={() => handleRemoveFile(idx)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormField>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setSelectedFiles([]); setForm(DEFAULT_FORM); }}>Batal</button>
                <button id="todo-save" className={styles.saveBtn} onClick={handleAdd}>Tambah</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Zoom Lightbox */}
      <AnimatePresence>
        {zoomPhotoUrl && (
          <div className={styles.zoomOverlay} onClick={() => setZoomPhotoUrl(null)}>
            <div className={styles.zoomContainer} onClick={e => e.stopPropagation()}>
              <img src={zoomPhotoUrl} alt="Dokumen Tugas" className={styles.zoomImage} />
              <button className={styles.zoomClose} onClick={() => setZoomPhotoUrl(null)}>
                <X size={20} />
              </button>
            </div>
          </div>
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
