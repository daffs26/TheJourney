import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Trash2, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
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
}

export default function Schedule() {
  const [activeDay, setActiveDay] = useState(TODAY_INDEX)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const { schedules, loading, fetchSchedules, addSchedule, deleteSchedule, getByDay } = useScheduleStore()
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

  const daySchedule = getByDay(DAYS[activeDay])

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

  const handleAdd = async () => {
    if (!form.startTime || !form.endTime) {
      addToast('Jam mulai dan selesai wajib diisi', 'warning'); return
    }
    if (!form.courseName.trim()) {
      addToast('Nama mata kuliah wajib diisi', 'warning'); return
    }
    await addSchedule({
      ...form,
      day: DAYS[activeDay],
    })
    addToast('Jadwal ditambahkan!', 'success')
    setForm({ ...DEFAULT_FORM, day: DAYS[activeDay] })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    await deleteSchedule(id)
    addToast('Jadwal dihapus', 'info')
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Jadwal Kuliah</h1>
        <button id="schedule-add-btn" className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={18} strokeWidth={2.5} />
        </button>
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
          <span className={styles.classCount}>{daySchedule.length} kelas</span>
        </div>

        {daySchedule.length === 0 ? (
          <div className={styles.emptyDay}>
            <Calendar size={40} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p>Tidak ada kelas {DAYS[activeDay]}</p>
            <button className={styles.addEmptyBtn} onClick={() => setShowForm(true)}>
              <Plus size={14} /> Tambah Jadwal
            </button>
          </div>
        ) : (
          <div className={styles.timelineList}>
            {daySchedule.map((sched, idx) => (
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
                  <button className={styles.deleteSchedBtn} onClick={() => handleDelete(sched.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add form modal */}
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
              <h3 className={styles.modalTitle}>Tambah Jadwal — {DAYS[activeDay]}</h3>

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
                <FormField label="Warna">
                  <div className={styles.colorRow}>
                    {COLORS.map(c => (
                      <button key={c} className={`${styles.colorDot} ${form.color === c ? styles.colorActive : ''}`}
                        style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
                    ))}
                  </div>
                </FormField>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Batal</button>
                <button id="sched-save" className={styles.saveBtn} onClick={handleAdd}>Simpan</button>
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
