import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  BookOpen,
  Camera,
  UploadCloud,
  X,
  Trash2,
  Eye,
  Calendar,
  MapPin,
  Plus
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import db from '../../db/database'
import styles from './Attendance.module.css'

const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function Attendance() {
  const { courses, fetchCourses } = useCoursesStore()
  const { addToast } = useAppStore()

  // State
  const [activeTab, setActiveTab] = useState('recap') // recap | photos
  const [courseSummaries, setCourseSummaries] = useState([])
  const [expandedCourseId, setExpandedCourseId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Photo Log State
  const [photoLogs, setPhotoLogs] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null)
  const [newLog, setNewLog] = useState({
    courseId: '',
    courseName: '',
    day: '',
    date: '',
    time: '',
    photo: null,
    notes: ''
  })

  // Keep track of Object URLs to revoke them for memory leaks prevention
  const objectUrlsRef = useRef([])

  const createSafeObjectURL = (blob) => {
    if (!blob) return ''
    const url = URL.createObjectURL(blob)
    objectUrlsRef.current.push(url)
    return url
  }

  const revokeAllObjectURLs = () => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }

  // Pre-fill log fields based on current time
  const initializeNewLog = () => {
    const now = new Date()
    const currentDay = HARI_INDONESIA[now.getDay()]
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setNewLog({
      courseId: '',
      courseName: '',
      day: currentDay,
      date: currentDate,
      time: currentTime,
      photo: null,
      notes: ''
    })
    setPhotoPreviewUrl(null)
  }

  useEffect(() => {
    loadAttendanceData()
    loadPhotoLogs()

    return () => {
      revokeAllObjectURLs()
    }
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

  const loadPhotoLogs = async () => {
    try {
      revokeAllObjectURLs()
      const logs = await db.attendancePhotos.orderBy('createdAt').reverse().toArray()
      
      // Enrich with course color if linked
      const enriched = await Promise.all(logs.map(async log => {
        let color = '#157f6b'
        let courseNameResolved = log.courseName

        if (log.courseId) {
          const course = await db.courses.get(log.courseId)
          if (course) {
            color = course.color || '#157f6b'
            courseNameResolved = course.name
          }
        }
        
        return {
          ...log,
          color,
          courseNameResolved,
          displayPhotoUrl: createSafeObjectURL(log.photo)
        }
      }))

      setPhotoLogs(enriched)
    } catch (e) {
      console.error(e)
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      addToast('Ukuran foto terlalu besar. Maksimal 15MB.', 'warning')
      return
    }

    setNewLog(prev => ({ ...prev, photo: file }))
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  const handleCourseSelect = (e) => {
    const courseId = e.target.value
    if (courseId) {
      const selected = courses.find(c => String(c.id) === String(courseId))
      setNewLog(prev => ({
        ...prev,
        courseId: parseInt(courseId),
        courseName: selected ? selected.name : ''
      }))
    } else {
      setNewLog(prev => ({
        ...prev,
        courseId: '',
        courseName: ''
      }))
    }
  }

  const handleSavePhotoLog = async () => {
    const { courseName, photo, day, date, time } = newLog

    if (!photo) {
      addToast('Harap ambil/pilih foto terlebih dahulu!', 'warning')
      return
    }

    if (!courseName.trim()) {
      addToast('Nama mata kuliah wajib diisi!', 'warning')
      return
    }

    if (!day || !date || !time) {
      addToast('Harap isi semua detail hari, tanggal, dan jam!', 'warning')
      return
    }

    try {
      await db.attendancePhotos.add({
        courseId: newLog.courseId || null,
        courseName: newLog.courseId ? '' : newLog.courseName,
        photo,
        day,
        date,
        time,
        notes: newLog.notes,
        createdAt: new Date()
      })

      addToast('Bukti foto absensi berhasil disimpan!', 'success')
      setShowAddModal(false)
      loadPhotoLogs()
    } catch (e) {
      console.error(e)
      addToast('Gagal menyimpan bukti absensi', 'error')
    }
  }

  const handleDeletePhotoLog = async (id) => {
    if (!window.confirm('Hapus bukti foto absensi ini?')) return

    try {
      await db.attendancePhotos.delete(id)
      addToast('Bukti foto dihapus', 'info')
      loadPhotoLogs()
    } catch (e) {
      console.error(e)
      addToast('Gagal menghapus bukti foto', 'error')
    }
  }

  const getDangerCount = () => {
    return courseSummaries.filter(c => c.doneCount > 0 && c.percentage < 75).length
  }

  const dangerCount = getDangerCount()

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
        <p className={styles.subtitle}>Rekap kehadiran kuliah & log bukti foto absensi kelas</p>
      </div>

      <div className={styles.content}>
        {/* Navigation Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'recap' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('recap')}
          >
            Rekap Kehadiran
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab('photos')
              loadPhotoLogs()
            }}
          >
            Bukti Foto Absensi
          </button>
        </div>

        {activeTab === 'recap' ? (
          /* ==================== TAB 1: REKAP KEHADIRAN ==================== */
          loading ? (
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
          )
        ) : (
          /* ==================== TAB 2: BUKTI FOTO ABSENSI ==================== */
          <div className={styles.photoTab}>
            <div className={styles.actionHeader}>
              <h2 className={styles.sectionTitle}>Log Foto Kehadiran</h2>
              <button
                className={styles.addBtn}
                onClick={() => {
                  initializeNewLog()
                  setShowAddModal(true)
                }}
              >
                <Camera size={14} /> Ambil Bukti Foto
              </button>
            </div>

            {photoLogs.length === 0 ? (
              <div className={styles.emptyState}>
                <Camera size={48} className={styles.emptyIcon} />
                <h3>Belum ada bukti foto</h3>
                <p>Klik tombol di atas untuk mengambil selfie atau upload foto kehadiran saat di kelas.</p>
              </div>
            ) : (
              <div className={styles.photoGrid}>
                {photoLogs.map(log => (
                  <div key={log.id} className={styles.photoCard}>
                    <div
                      className={styles.photoWrapper}
                      onClick={() => setZoomPhotoUrl(log.displayPhotoUrl)}
                    >
                      <img
                        src={log.displayPhotoUrl}
                        alt={`Absen ${log.courseNameResolved}`}
                        className={styles.photoImg}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.cardContent}>
                      <h4 className={styles.cardTitle}>{log.courseNameResolved}</h4>
                      <div className={styles.cardMeta}>
                        <div className={styles.metaItem}>
                          <Calendar size={11} style={{ color: log.color }} />
                          <span>{log.day}, {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Clock size={11} style={{ color: log.color }} />
                          <span>Pukul {log.time} WIB</span>
                        </div>
                      </div>
                      {log.notes && <p className={styles.cardNotes}>{log.notes}</p>}
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeletePhotoLog(log.id)}
                        title="Hapus Bukti"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Photo Log Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className={styles.modalTitle}>
                <span>📸 Log Bukti Kehadiran</span>
                <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className={styles.form}>
                {/* Photo Upload Zone */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Foto Absen / Selfie *</label>
                  {!photoPreviewUrl ? (
                    <label className={styles.fileUploadZone}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        // Trigger device camera directly on mobile if supported
                        capture="environment"
                      />
                      <UploadCloud size={28} className={styles.uploadIcon} />
                      <span className={styles.fileUploadText}>Ambil Foto / Upload Gambar</span>
                      <span className={styles.fileUploadSubtext}>Mendukung kamera langsung atau galeri file</span>
                    </label>
                  ) : (
                    <div className={styles.previewWrapper}>
                      <img src={photoPreviewUrl} alt="Preview absensi" className={styles.previewImg} />
                      <button
                        type="button"
                        className={styles.removePreviewBtn}
                        onClick={() => {
                          setPhotoPreviewUrl(null)
                          setNewLog(prev => ({ ...prev, photo: null }))
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Course Selection */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Pilih Mata Kuliah *</label>
                  <select
                    className={styles.input}
                    value={newLog.courseId}
                    onChange={handleCourseSelect}
                  >
                    <option value="">— Input manual —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Manual Course Name (If manual input chosen) */}
                {!newLog.courseId && (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Nama Mata Kuliah *</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Masukkan nama mata kuliah"
                      value={newLog.courseName}
                      onChange={(e) => setNewLog(prev => ({ ...prev, courseName: e.target.value }))}
                    />
                  </div>
                )}

                {/* Date & Time Row */}
                <div className={styles.timeRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tanggal & Hari</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={newLog.date}
                      onChange={(e) => {
                        const dateVal = e.target.value
                        let dayVal = newLog.day
                        if (dateVal) {
                          dayVal = HARI_INDONESIA[new Date(dateVal).getDay()]
                        }
                        setNewLog(prev => ({ ...prev, date: dateVal, day: dayVal }))
                      }}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Hari</label>
                    <select
                      className={styles.input}
                      value={newLog.day}
                      onChange={(e) => setNewLog(prev => ({ ...prev, day: e.target.value }))}
                    >
                      {HARI_INDONESIA.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Jam Absen</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={newLog.time}
                    onChange={(e) => setNewLog(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                {/* Notes */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Catatan (Opsional)</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Contoh: Pertemuan 3, Dosen telat, dsb."
                    value={newLog.notes}
                    onChange={(e) => setNewLog(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowAddModal(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSavePhotoLog}
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox Photo Preview */}
      <AnimatePresence>
        {zoomPhotoUrl && (
          <motion.div
            className={styles.zoomOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomPhotoUrl(null)}
          >
            <button className={styles.zoomCloseBtn} onClick={() => setZoomPhotoUrl(null)}>
              <X size={20} />
            </button>
            <motion.img
              src={zoomPhotoUrl}
              alt="Bukti Absensi Zoom"
              className={styles.zoomImg}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
