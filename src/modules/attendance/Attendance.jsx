import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  HelpCircle,
  Clock,
  BookOpen
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import db from '../../db/database'
import styles from './Attendance.module.css'

export default function Attendance() {
  const { courses, fetchCourses } = useCoursesStore()
  const { addToast } = useAppStore()

  // State
  const [courseSummaries, setCourseSummaries] = useState([])
  const [expandedCourseId, setExpandedCourseId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttendanceData()
  }, [])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      await fetchCourses()
      const list = await db.courses.toArray()
      
      const summaries = await Promise.all(
        list.map(async (course) => {
          const meetings = await db.meetings
            .where('courseId')
            .equals(course.id)
            .sortBy('meetingNumber')

          const total = meetings.length
          const doneMeetings = meetings.filter(m => m.status !== 'pending')
          const hadir = meetings.filter(m => m.status === 'hadir').length
          const izin = meetings.filter(m => m.status === 'izin').length
          const absen = meetings.filter(m => m.status === 'tidak_hadir').length
          
          const doneCount = doneMeetings.length
          // Percentage is (Hadir / Done) * 100.
          // If no meetings are marked done yet, default to 100%
          const percentage = doneCount > 0 ? Math.round((hadir / doneCount) * 100) : 100

          return {
            ...course,
            meetings,
            total,
            doneCount,
            hadir,
            izin,
            absen,
            percentage
          }
        })
      )
      setCourseSummaries(summaries)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Cycle status: pending -> hadir -> izin -> tidak_hadir -> pending
  const handleToggleStatus = async (courseId, meetingId, currentStatus) => {
    let nextStatus = 'pending'
    if (currentStatus === 'pending') nextStatus = 'hadir'
    else if (currentStatus === 'hadir') nextStatus = 'izin'
    else if (currentStatus === 'izin') nextStatus = 'tidak_hadir'
    else if (currentStatus === 'tidak_hadir') nextStatus = 'pending'

    try {
      await db.meetings.update(meetingId, { status: nextStatus })
      
      // Update local summaries state
      setCourseSummaries(prev =>
        prev.map(c => {
          if (c.id !== courseId) return c

          const updatedMeetings = c.meetings.map(m =>
            m.id === meetingId ? { ...m, status: nextStatus } : m
          )

          const total = updatedMeetings.length
          const doneMeetings = updatedMeetings.filter(m => m.status !== 'pending')
          const hadir = updatedMeetings.filter(m => m.status === 'hadir').length
          const izin = updatedMeetings.filter(m => m.status === 'izin').length
          const absen = updatedMeetings.filter(m => m.status === 'tidak_hadir').length
          
          const doneCount = doneMeetings.length
          const percentage = doneCount > 0 ? Math.round((hadir / doneCount) * 100) : 100

          return {
            ...c,
            meetings: updatedMeetings,
            total,
            doneCount,
            hadir,
            izin,
            absen,
            percentage
          }
        })
      )

      addToast('Status kehadiran diperbarui!', 'success')
    } catch (e) {
      addToast('Gagal memperbarui kehadiran', 'error')
    }
  }

  // Count courses in danger of falling below 75%
  const getDangerCount = () => {
    return courseSummaries.filter(c => c.doneCount > 0 && c.percentage < 75).length
  }

  const dangerCount = getDangerCount()

  // Average overall attendance rate
  const getOverallAverage = () => {
    const activeSummaries = courseSummaries.filter(c => c.doneCount > 0)
    if (activeSummaries.length === 0) return 100
    const sum = activeSummaries.reduce((acc, curr) => acc + curr.percentage, 0)
    return Math.round(sum / activeSummaries.length)
  }

  const overallAvg = getOverallAverage()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Absensi Kuliah</h1>
        <p className={styles.subtitle}>Rekap kehadiran tatap muka kuliah 16 pertemuan</p>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-sub)' }}>
            Loading data absensi...
          </div>
        ) : courseSummaries.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <h3>Belum ada kelas</h3>
            <p>Tambahkan mata kuliah terlebih dahulu untuk melacak absensi.</p>
          </div>
        ) : (
          <div>
            {/* Overview Card */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryMetric}>
                <span className={styles.summaryLabel}>Rata-rata Kehadiran</span>
                <span className={styles.summaryValue}>{overallAvg}%</span>
              </div>

              {dangerCount > 0 && (
                <div className={styles.warningBanner}>
                  <AlertOctagon size={16} />
                  <span>{dangerCount} Matkul di bawah 75%!</span>
                </div>
              )}
            </div>

            {/* Courses list */}
            {courseSummaries.map(course => {
              const isExpanded = expandedCourseId === course.id
              const isDanger = course.doneCount > 0 && course.percentage < 75
              const isWarning = course.doneCount > 0 && course.percentage >= 75 && course.percentage < 80

              let pctClass = styles.pillSafe
              let progressColor = 'var(--color-success)'

              if (isDanger) {
                pctClass = styles.pillDanger
                progressColor = 'var(--color-danger)'
              } else if (isWarning) {
                pctClass = styles.pillWarning
                progressColor = 'var(--color-warning)'
              }

              return (
                <div key={course.id} className={styles.courseCard}>
                  <div
                    className={styles.cardHeader}
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                  >
                    <div className={styles.courseInfo}>
                      <h3 className={styles.courseName}>{course.name}</h3>
                      <div className={styles.statRow}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width: `${course.percentage}%`,
                              backgroundColor: progressColor
                            }}
                          />
                        </div>
                        <span className={styles.statText}>
                          {course.hadir} Hadir / {course.doneCount} Sesi ({course.sks} SKS)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className={`${styles.percentPill} ${pctClass}`}>
                        {course.percentage}%
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={styles.meetingsList}
                      >
                        {course.meetings.map(meet => {
                          let label = 'Belum'
                          if (meet.status === 'hadir') label = 'Hadir'
                          if (meet.status === 'izin') label = 'Izin'
                          if (meet.status === 'tidak_hadir') label = 'Absen'

                          return (
                            <div key={meet.id} className={styles.meetingItem}>
                              <span className={styles.meetingNum}>Sesi {meet.meetingNumber}</span>
                              <span className={styles.meetingTopic}>
                                {meet.topic || `Pertemuan ${meet.meetingNumber}`}
                              </span>
                              <button
                                className={`${styles.statusBtn} ${styles['status_' + meet.status]}`}
                                onClick={() =>
                                  handleToggleStatus(course.id, meet.id, meet.status)
                                }
                              >
                                {label}
                              </button>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
