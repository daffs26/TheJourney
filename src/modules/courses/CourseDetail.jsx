import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Users, MapPin, Clock,
  ChevronRight, CheckCircle, XCircle, AlertCircle,
  Circle, TrendingUp, Edit2, Save, X
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './CourseDetail.module.css'

const STATUS_CONFIG = {
  pending:      { label: 'Belum',   icon: Circle,       color: 'var(--color-text-muted)', bg: 'var(--color-surface-2)' },
  hadir:        { label: 'Hadir',   icon: CheckCircle,  color: 'var(--color-success)',    bg: 'var(--color-success-pale)' },
  tidak_hadir:  { label: 'Absen',   icon: XCircle,      color: 'var(--color-danger)',     bg: 'var(--color-danger-pale)' },
  izin:         { label: 'Izin',    icon: AlertCircle,  color: 'var(--color-warning)',    bg: 'var(--color-warning-pale)' },
}

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { courses, getMeetings, updateMeeting, updateCourse, getAttendanceSummary } = useCoursesStore()
  const { addToast } = useAppStore()

  const [course, setCourse] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [attendance, setAttendance] = useState({ total: 16, hadir: 0, izin: 0, done: 0, percentage: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editTopic, setEditTopic] = useState('')

  const courseId = parseInt(id)

  const load = async () => {
    const found = courses.find(c => c.id === courseId)
    setCourse(found)
    if (found) {
      const m = await getMeetings(courseId)
      setMeetings(m)
      const att = await getAttendanceSummary(courseId)
      setAttendance(att)
    }
  }

  useEffect(() => { load() }, [courseId, courses])

  const handleStatusCycle = async (meeting) => {
    const order = ['pending', 'hadir', 'izin', 'tidak_hadir']
    const next = order[(order.indexOf(meeting.status) + 1) % order.length]
    await updateMeeting(meeting.id, { status: next })
    await load()
  }

  const handleSaveTopic = async (meeting) => {
    await updateMeeting(meeting.id, { topic: editTopic })
    setEditingId(null)
    await load()
  }

  if (!course) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Mata kuliah tidak ditemukan</p>
    </div>
  )

  const attendancePct = attendance.done > 0
    ? Math.round((attendance.hadir / attendance.done) * 100)
    : 0
  const isWarning = attendance.done >= 4 && attendancePct < 75

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header} style={{ '--course-color': course.color }}>
        <button className={styles.backBtn} onClick={() => navigate('/courses')}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.courseName}>{course.name}</h1>
          <div className={styles.courseMeta}>
            {course.code && <span><BookOpen size={12} /> {course.code}</span>}
            <span>· {course.sks} SKS</span>
            {course.lecturer && <span><Users size={12} /> {course.lecturer}</span>}
            {course.room && <span><MapPin size={12} /> {course.room}</span>}
          </div>
        </div>
      </div>

      {/* Attendance summary */}
      <div className={styles.attendCard}>
        <div className={styles.attendHeader}>
          <TrendingUp size={16} color={isWarning ? 'var(--color-danger)' : 'var(--color-success)'} />
          <span className={styles.attendTitle}>Kehadiran</span>
          {isWarning && (
            <span className={styles.warningBadge}>⚠️ Di bawah 75%!</span>
          )}
        </div>
        <div className={styles.attendStats}>
          <AttendStat label="Hadir" value={attendance.hadir} color="var(--color-success)" />
          <AttendStat label="Izin" value={attendance.izin} color="var(--color-warning)" />
          <AttendStat label="Absen" value={attendance.done - attendance.hadir - attendance.izin} color="var(--color-danger)" />
          <AttendStat label="Belum" value={attendance.total - attendance.done} color="var(--color-text-muted)" />
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${attendancePct}%`,
              background: isWarning ? 'var(--color-danger)' : 'var(--color-success)'
            }}
          />
        </div>
        <p className={styles.progressLabel}>
          {attendance.done > 0 ? `${attendancePct}% kehadiran dari ${attendance.done} pertemuan` : 'Belum ada pertemuan yang dicatat'}
        </p>
      </div>

      {/* Meetings list */}
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>16 Pertemuan</h2>
        <div className={styles.meetingList}>
          {meetings.map((meeting, idx) => {
            const cfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={meeting.id}
                className={styles.meetingCard}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, type: 'spring', stiffness: 350, damping: 28 }}
              >
                {/* Meeting number + status toggle */}
                <button
                  className={styles.statusBtn}
                  style={{ background: cfg.bg, color: cfg.color }}
                  onClick={() => handleStatusCycle(meeting)}
                  title={`Status: ${cfg.label} — tap untuk ganti`}
                >
                  <StatusIcon size={16} strokeWidth={2} />
                </button>

                {/* Content */}
                <div className={styles.meetingContent} onClick={() => navigate(`/courses/${courseId}/meeting/${meeting.id}`)}>
                  <div className={styles.meetingTop}>
                    <span className={styles.meetingNum}>Pertemuan {meeting.meetingNumber}</span>
                    {meeting.date && (
                      <span className={styles.meetingDate}>
                        <Clock size={11} /> {new Date(meeting.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  {editingId === meeting.id ? (
                    <div className={styles.topicEdit} onClick={e => e.stopPropagation()}>
                      <input
                        className={styles.topicInput}
                        value={editTopic}
                        onChange={e => setEditTopic(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveTopic(meeting) }}
                        autoFocus
                      />
                      <button className={styles.saveTopicBtn} onClick={() => handleSaveTopic(meeting)}><Save size={13} /></button>
                      <button className={styles.cancelTopicBtn} onClick={() => setEditingId(null)}><X size={13} /></button>
                    </div>
                  ) : (
                    <p className={styles.meetingTopic}>{meeting.topic}</p>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.meetingActions}>
                  <button
                    className={styles.editTopicBtn}
                    onClick={e => { e.stopPropagation(); setEditingId(meeting.id); setEditTopic(meeting.topic) }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className={styles.detailBtn}
                    onClick={() => navigate(`/courses/${courseId}/meeting/${meeting.id}`)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AttendStat({ label, value, color }) {
  return (
    <div className={styles.attendStat}>
      <span className={styles.attendNum} style={{ color }}>{value}</span>
      <span className={styles.attendLabel}>{label}</span>
    </div>
  )
}
