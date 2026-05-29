import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Trash2, ChevronRight, Users, Calendar } from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './CourseList.module.css'

const COURSE_COLORS = [
  '#2563EB','#8B5CF6','#10B981','#F59E0B','#EF4444',
  '#06B6D4','#EC4899','#14B8A6','#6366F1','#F97316',
]

const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']

const DEFAULT_FORM = {
  name: '',
  code: '',
  sks: 3,
  lecturer: '',
  room: '',
  color: COURSE_COLORS[0],
  day: 'Senin' // Default day selection
}

export default function CourseList() {
  const navigate = useNavigate()
  const { courses, loading, fetchCourses, addCourse, deleteCourse } = useCoursesStore()
  const { addToast } = useAppStore()

  const [dayFilter, setDayFilter] = useState('all') // all | Senin - Minggu
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchCourses() }, [])

  // Process, filter, and sort courses by Day (Monday -> Sunday)
  const processedCourses = useMemo(() => {
    const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 7 }
    let list = [...courses]

    // Apply filter
    if (dayFilter !== 'all') {
      list = list.filter(c => c.day === dayFilter)
    }

    // Sort by day order, then by course name
    return list.sort((a, b) => {
      const orderA = dayOrder[a.day] || 8
      const orderB = dayOrder[b.day] || 8
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })
  }, [courses, dayFilter])

  const handleAdd = async () => {
    if (!form.name.trim()) {
      addToast('Nama mata kuliah wajib diisi!', 'warning')
      return
    }
    setSaving(true)
    try {
      await addCourse(form)
      addToast(`${form.name} berhasil ditambahkan!`, 'success')
      setForm(DEFAULT_FORM)
      setShowForm(false)
    } catch (e) {
      addToast('Gagal menambahkan mata kuliah', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    await deleteCourse(id)
    addToast(`${name} dihapus`, 'info')
    setDeleteId(null)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Mata Kuliah</h1>
        <p className={styles.subtitle}>Semester ini · {courses.length} matkul</p>
        <button
          id="courses-add-btn"
          className={styles.addBtn}
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} strokeWidth={2.5} /> Tambah Matkul
        </button>
      </div>

      {/* Day Bar Filter */}
      <div className={styles.dayBar}>
        <button
          className={`${styles.dayBtn} ${dayFilter === 'all' ? styles.dayBtnActive : ''}`}
          onClick={() => setDayFilter('all')}
        >
          Semua Hari
        </button>
        {DAYS.map(d => (
          <button
            key={d}
            className={`${styles.dayBtn} ${dayFilter === d ? styles.dayBtnActive : ''}`}
            onClick={() => setDayFilter(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.skeletonList}>
            {[1,2,3].map(i => <div key={i} className={`${styles.skeletonCard} skeleton`} />)}
          </div>
        ) : processedCourses.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <motion.div
            className={styles.list}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {processedCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onOpen={() => navigate(`/courses/${course.id}`)}
                onDelete={() => setDeleteId(course.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <Modal onClose={() => setShowForm(false)} title="Tambah Mata Kuliah">
            <div className={styles.form}>
              <Field label="Nama Mata Kuliah *">
                <input
                  id="course-name"
                  className={styles.input}
                  placeholder="Contoh: Basis Data"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </Field>
              <div className={styles.row}>
                <Field label="Kode MK">
                  <input
                    id="course-code"
                    className={styles.input}
                    placeholder="Contoh: SI301"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  />
                </Field>
                <Field label="SKS">
                  <select id="course-sks" className={styles.input} value={form.sks} onChange={e => setForm(f => ({ ...f, sks: parseInt(e.target.value) }))}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} SKS</option>)}
                  </select>
                </Field>
              </div>

              {/* Day Selector dropdown */}
              <Field label="Hari Kuliah *">
                <select
                  id="course-day"
                  className={styles.input}
                  value={form.day || 'Senin'}
                  onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>

              <Field label="Dosen Pengampu">
                <input
                  id="course-lecturer"
                  className={styles.input}
                  placeholder="Nama dosen"
                  value={form.lecturer}
                  onChange={e => setForm(f => ({ ...f, lecturer: e.target.value }))}
                />
              </Field>
              <Field label="Ruang Kelas">
                <input
                  id="course-room"
                  className={styles.input}
                  placeholder="Contoh: Gedung A Lt.3"
                  value={form.room}
                  onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                />
              </Field>
              <Field label="Warna">
                <div className={styles.colorPicker}>
                  {COURSE_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.colorDot} ${form.color === c ? styles.colorSelected : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                    />
                  ))}
                </div>
              </Field>
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Batal</button>
                <button id="course-save" className={styles.saveBtn} onClick={handleAdd} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete confirm */}
        {deleteId && (
          <Modal onClose={() => setDeleteId(null)} title="Hapus Mata Kuliah?">
            <p style={{ color: 'var(--color-text-sub)', marginBottom: 16 }}>
              Semua data pertemuan, materi, dan kuis akan ikut terhapus.
            </p>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Batal</button>
              <button
                className={styles.deleteBtn}
                onClick={() => {
                  const course = courses.find(c => c.id === deleteId)
                  handleDelete(deleteId, course?.name)
                }}
              >
                Hapus
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function CourseCard({ course, onOpen, onDelete }) {
  return (
    <motion.div
      className={styles.card}
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } } }}
    >
      <div className={styles.cardAccent} style={{ background: course.color }} />
      <div className={styles.cardBody} onClick={onOpen}>
        <div className={styles.cardIcon} style={{ background: `${course.color}18`, color: course.color }}>
          <BookOpen size={20} strokeWidth={1.8} />
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardName}>{course.name}</h3>
          <div className={styles.cardMeta}>
            {course.day && (
              <span className={styles.metaTag}>📅 {course.day}</span>
            )}
            {course.code && <span className={styles.metaTag}>{course.code}</span>}
            <span className={styles.metaTag}>{course.sks} SKS</span>
            {course.lecturer && (
              <span className={styles.metaItem}><Users size={11} /> {course.lecturer}</span>
            )}
          </div>
        </div>
        <ChevronRight size={18} className={styles.cardChevron} />
      </div>
      <button className={styles.deleteIconBtn} onClick={e => { e.stopPropagation(); onDelete() }}>
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className={styles.empty}>
      <BookOpen size={48} strokeWidth={1} className={styles.emptyIcon} />
      <h3>Belum ada mata kuliah</h3>
      <p>Tambahkan mata kuliah semester ini untuk mulai tracking</p>
      <button className={styles.emptyBtn} onClick={onAdd}>
        <Plus size={16} /> Tambah Sekarang
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <h3 className={styles.modalTitle}>{title}</h3>
        {children}
      </motion.div>
    </>
  )
}
