import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Trash2, Clock, MapPin, Edit2, X } from 'lucide-react'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './Schedule.module.css'

const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu']
const TODAY_INDEX = [0,1,2,3,4,5,6][(new Date().getDay() + 6) % 7] // Mon=0

const COLORS = ['#2563EB','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899','#14B8A6']

const DEFAULT_FORM = {
  courseId: '',
  courseName: '',
  day: 'Senin',
  startTime: '08:00',
  endTime: '09:40',
  room: '',
  color: COLORS[0],
  months: [], // Array of YYYY-MM active months
}

// Generate future months (current month + next 5 months)
function getFutureMonths(count = 6) {
  const list = []
  const date = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'long' })
    list.push({ value, label })
  }
  return list
}

export default function Schedule() {
  const [activeDay, setActiveDay] = useState(TODAY_INDEX)
  const [selectedMonth, setSelectedMonth] = useState('all') // all | YYYY-MM
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(null) // schedule ID if editing
  const [form, setForm] = useState(DEFAULT_FORM)

  const { schedules, loading, fetchSchedules, addSchedule, updateSchedule, deleteSchedule, getByDay } = useScheduleStore()
  const { courses, fetchCourses } = useCoursesStore()
  const { addToast } = useAppStore()

  useEffect(() => {
    fetchSchedules()
    fetchCourses()
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          fetchSchedules()
        }
      })
    }
  }, [])

  const futureMonths = useMemo(() => getFutureMonths(6), [])

  // Raw schedule for active day
  const daySchedule = getByDay(DAYS[activeDay])

  // Filtered schedule for active day & month
  const filteredDaySchedule = useMemo(() => {
    return daySchedule.filter(sched => {
      if (selectedMonth === 'all') return true
      if (!sched.months || sched.months.length === 0) return true // Active for all months
      return sched.months.includes(selectedMonth)
    })
  }, [daySchedule, selectedMonth])

  const handleCourseSelect = (e) => {
    const courseId = parseInt(e.target.value)
    const course = courses.find(c => c.id === courseId)
    setForm(f => ({
      ...f,
      courseId: courseId || '',
      courseName: course?.name || '',
      color: course?.color || COLORS[0],
      room: course?.room || '',
    }))
  }

  const openAddModal = () => {
    setForm({ ...DEFAULT_FORM, day: DAYS[activeDay] })
    setIsEditing(null)
    setShowForm(true)
  }

  const openEditModal = (sched) => {
    setForm({
      courseId: sched.courseId || '',
      courseName: sched.course?.name || sched.courseName || '',
      day: sched.day || DAYS[activeDay],
      startTime: sched.startTime || '08:00',
      endTime: sched.endTime || '09:40',
      room: sched.room || '',
      color: sched.color || COLORS[0],
      months: sched.months || [],
    })
    setIsEditing(sched.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      addToast('Jam mulai dan selesai wajib diisi', 'warning')
      return
    }
    if (!form.courseName.trim()) {
      addToast('Nama mata kuliah wajib diisi', 'warning')
      return
    }

    const payload = {
      ...form,
      day: DAYS[activeDay]
    }

    if (isEditing) {
      await updateSchedule(isEditing, payload)
      addToast('Jadwal diperbarui!', 'success')
    } else {
      await addSchedule(payload)
      addToast('Jadwal ditambahkan!', 'success')
    }

    setShowForm(false)
    setIsEditing(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Hapus jadwal kuliah ini?')) {
      await deleteSchedule(id)
      addToast('Jadwal dihapus', 'info')
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Jadwal Kuliah</h1>
        <button id="schedule-add-btn" className={styles.addBtn} onClick={openAddModal} aria-label="Tambah Jadwal">
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Month Bar Filter */}
      <div className={styles.monthBar}>
        <button
          className={`${styles.monthBtn} ${selectedMonth === 'all' ? styles.monthBtnActive : ''}`}
          onClick={() => setSelectedMonth('all')}
        >
          Semua Bulan
        </button>
        {futureMonths.map(m => (
          <button
            key={m.value}
            className={`${styles.monthBtn} ${selectedMonth === m.value ? styles.monthBtnActive : ''}`}
            onClick={() => setSelectedMonth(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Day selector */}
      <div className={styles.dayBar}>
        {DAYS.map((day, idx) => (
          <button
            key={day}
            className={`${styles.dayBtn} ${activeDay === idx ? styles.dayActive : ''} ${idx === TODAY_INDEX ? styles.dayToday : ''}`}
            onClick={() => setActiveDay(idx)}
          >
            <span className={styles.dayName}>{day.slice(0, 3)}</span>
            {idx === TODAY_INDEX && <span className={styles.todayDot} />}
          </button>
        ))}
      </div>

      {/* Schedule for selected day */}
      <div className={styles.content}>
        <div className={styles.dayTitle}>
          {DAYS[activeDay]}
          {activeDay === TODAY_INDEX && <span className={styles.todayBadge}>Hari ini</span>}
          <span className={styles.classCount}>{filteredDaySchedule.length} kelas</span>
        </div>

        {filteredDaySchedule.length === 0 ? (
          <div className={styles.emptyDay}>
            <Calendar size={40} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p>Tidak ada kelas di hari {DAYS[activeDay]}</p>
            <button className={styles.addEmptyBtn} onClick={openAddModal}>
              <Plus size={14} /> Tambah Jadwal
            </button>
          </div>
        ) : (
          <div className={styles.timelineList}>
            {filteredDaySchedule.map((sched, idx) => (
              <motion.div
                key={sched.id}
                className={styles.timelineItem}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, type: 'spring', stiffness: 350, damping: 26 }}
              >
                <div className={styles.timelineLeft}>
                  <span className={styles.startTime}>{sched.startTime}</span>
                  <div className={styles.timelineLine} style={{ borderColor: sched.color }} />
                  <span className={styles.endTime}>{sched.endTime}</span>
                </div>
                <div className={styles.schedCard} style={{ borderLeftColor: sched.color }}>
                  <div className={styles.schedName}>{sched.course?.name || sched.courseName || 'Mata Kuliah'}</div>
                  <div className={styles.schedMeta}>
                    <span><Clock size={11} /> {sched.startTime}–{sched.endTime}</span>
                    {sched.room && <span><MapPin size={11} /> {sched.room}</span>}
                  </div>
                  {sched.months && sched.months.length > 0 && (
                    <div style={{ fontSize: '9px', color: 'var(--color-mod-schedule)', fontWeight: 'bold', marginTop: '4px' }}>
                      📅 Aktif: {sched.months.map(m => futureMonths.find(fm => fm.value === m)?.label || m).join(', ')}
                    </div>
                  )}
                  {/* Actions buttons */}
                  <div className={styles.cardActions}>
                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => openEditModal(sched)} title="Ubah Jadwal">
                      <Edit2 size={13} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(sched.id)} title="Hapus Jadwal">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>
                {isEditing ? 'Ubah Jadwal' : 'Tambah Jadwal'} — {DAYS[activeDay]}
              </h3>

              <div className={styles.form}>
                <FormField label="Pilih dari Mata Kuliah (opsional)">
                  <select id="sched-course" className={styles.input} value={form.courseId} onChange={handleCourseSelect}>
                    <option value="">— Input manual —</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                {!form.courseId && (
                  <FormField label="Nama Mata Kuliah *">
                    <input
                      id="sched-name"
                      className={styles.input}
                      placeholder="Contoh: Pemrograman Web"
                      value={form.courseName}
                      onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))}
                    />
                  </FormField>
                )}
                <div className={styles.timeRow}>
                  <FormField label="Mulai">
                    <input id="sched-start" type="time" className={styles.input}
                      value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </FormField>
                  <FormField label="Selesai">
                    <input id="sched-end" type="time" className={styles.input}
                      value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </FormField>
                </div>
                <FormField label="Ruang Kelas">
                  <input id="sched-room" className={styles.input} placeholder="Contoh: GKT Lt.2 R.201"
                    value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />
                </FormField>

                {/* Checklist for Active Months */}
                <FormField label="Bulan Aktif Kuliah (Kosongkan jika selalu aktif)">
                  <div className={styles.monthsGrid}>
                    {futureMonths.map(m => {
                      const checked = form.months.includes(m.value)
                      return (
                        <label
                          key={m.value}
                          className={`${styles.monthCheckboxLabel} ${checked ? styles.monthCheckboxLabelChecked : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            style={{ display: 'none' }}
                            onChange={() => {
                              const newMonths = checked
                                ? form.months.filter(val => val !== m.value)
                                : [...form.months, m.value]
                              setForm(f => ({ ...f, months: newMonths }))
                            }}
                          />
                          <span>{m.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </FormField>

                <FormField label="Warna">
                  <div className={styles.colorRow}>
                    {COLORS.map(c => (
                      <button key={c} type="button" className={`${styles.colorDot} ${form.color === c ? styles.colorActive : ''}`}
                        style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                    ))}
                  </div>
                </FormField>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Batal</button>
                <button id="sched-save" className={styles.saveBtn} onClick={handleSave}>Simpan</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
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
