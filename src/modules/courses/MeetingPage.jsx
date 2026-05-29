import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Upload, FileText, Link, Trash2,
  Plus, CheckCircle, XCircle, AlertCircle, Circle,
  Edit2, Save, Calendar, BookOpen
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './MeetingPage.module.css'

const STATUS_CONFIG = {
  pending:     { label: 'Belum Dicatat', icon: Circle,      color: 'var(--color-text-muted)' },
  hadir:       { label: 'Hadir',         icon: CheckCircle, color: 'var(--color-success)' },
  tidak_hadir: { label: 'Tidak Hadir',   icon: XCircle,     color: 'var(--color-danger)' },
  izin:        { label: 'Izin',          icon: AlertCircle, color: 'var(--color-warning)' },
}

export default function MeetingPage() {
  const { courseId, meetingId } = useParams()
  const navigate = useNavigate()
  const { courses, getMeetings, getMaterials, addMaterial, deleteMaterial, updateMeeting } = useCoursesStore()
  const { addToast } = useAppStore()

  const [course, setCourse] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [materials, setMaterials] = useState([])
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'text', content: '' })
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const fileInputRef = useRef()

  const cId = parseInt(courseId)
  const mId = parseInt(meetingId)

  const load = async () => {
    const c = courses.find(c => c.id === cId)
    setCourse(c)
    const mtgs = await getMeetings(cId)
    const mtg = mtgs.find(m => m.id === mId)
    setMeeting(mtg)
    setNotes(mtg?.notes || '')
    setMaterials(await getMaterials(mId))
  }

  useEffect(() => { load() }, [mId, courses])

  // Status cycle
  const handleStatusCycle = async () => {
    const order = ['pending', 'hadir', 'izin', 'tidak_hadir']
    const next = order[(order.indexOf(meeting?.status || 'pending') + 1) % order.length]
    await updateMeeting(mId, { status: next })
    await load()
  }

  // Save notes
  const handleSaveNotes = async () => {
    await updateMeeting(mId, { notes })
    setEditingNotes(false)
    addToast('Catatan disimpan!', 'success')
    await load()
  }

  // Set date
  const handleDateChange = async (date) => {
    await updateMeeting(mId, { date: new Date(date) })
    await load()
  }

  // Add material
  const handleAddMaterial = async () => {
    if (!materialForm.name.trim() || !materialForm.content.trim()) {
      addToast('Nama dan konten wajib diisi', 'warning')
      return
    }
    await addMaterial({ ...materialForm, meetingId: mId, courseId: cId })
    addToast('Materi ditambahkan!', 'success')
    setMaterialForm({ name: '', type: 'text', content: '' })
    setShowAddMaterial(false)
    await load()
  }

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setMaterialForm({ name: file.name, type: 'file', content: ev.target.result })
      setShowAddMaterial(true)
    }
    reader.readAsText(file)
  }

  if (!meeting || !course) return null

  const cfg = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header} style={{ '--course-color': course.color }}>
        <button className={styles.backBtn} onClick={() => navigate(`/courses/${cId}`)}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <p className={styles.courseName}>{course.name}</p>
          <h1 className={styles.meetingTitle}>Pertemuan {meeting.meetingNumber}</h1>
        </div>
      </div>

      {/* Meeting info bar */}
      <div className={styles.infoBar}>
        {/* Status */}
        <button className={styles.statusChip} onClick={handleStatusCycle} style={{ color: cfg.color }}>
          <StatusIcon size={14} strokeWidth={2} />
          <span>{cfg.label}</span>
        </button>

        {/* Date picker */}
        <div className={styles.datePicker}>
          <Calendar size={13} />
          <input
            type="date"
            className={styles.dateInput}
            value={meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : ''}
            onChange={e => handleDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className={styles.notesSection}>
        <div className={styles.notesHeader}>
          <span className={styles.notesLabel}><BookOpen size={13} /> Catatan</span>
          {editingNotes ? (
            <div className={styles.noteActions}>
              <button className={styles.noteActionBtn} onClick={handleSaveNotes}><Save size={13} /> Simpan</button>
              <button className={styles.noteActionBtn} onClick={() => { setEditingNotes(false); setNotes(meeting.notes || '') }}><XCircle size={13} /></button>
            </div>
          ) : (
            <button className={styles.noteEditBtn} onClick={() => setEditingNotes(true)}><Edit2 size={13} /> Edit</button>
          )}
        </div>
        {editingNotes ? (
          <textarea
            className={styles.notesTextarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Tulis catatan pertemuan ini..."
            rows={4}
            autoFocus
          />
        ) : (
          <p className={styles.notesText}>{meeting.notes || <span className={styles.notesEmpty}>Belum ada catatan...</span>}</p>
        )}
      </div>

      {/* Content Section for Materials */}
      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600' }}>
            <FileText size={18} /> Materi Perkuliahan ({materials.length})
          </h2>
        </div>

        {/* Add material buttons */}
        <div className={styles.addMatButtons}>
          <button className={styles.addMatBtn} onClick={() => setShowAddMaterial(true)}>
            <Plus size={14} /> Teks / Link
          </button>
          <button className={styles.addMatBtn} onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload File
          </button>
          <input ref={fileInputRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>

        {/* Add material form */}
        {showAddMaterial && (
          <motion.div
            className={styles.addMatForm}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
          >
            <input
              className={styles.matInput}
              placeholder="Nama materi"
              value={materialForm.name}
              onChange={e => setMaterialForm(f => ({ ...f, name: e.target.value }))}
            />
            <select
              className={styles.matInput}
              value={materialForm.type}
              onChange={e => setMaterialForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="text">Teks / Catatan</option>
              <option value="link">Link / URL</option>
            </select>
            <textarea
              className={styles.matTextarea}
              placeholder={materialForm.type === 'link' ? 'https://...' : 'Paste konten materi di sini...'}
              value={materialForm.content}
              onChange={e => setMaterialForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
            />
            <div className={styles.matFormActions}>
              <button className={styles.cancelMatBtn} onClick={() => setShowAddMaterial(false)}>Batal</button>
              <button className={styles.saveMatBtn} onClick={handleAddMaterial}>Simpan</button>
            </div>
          </motion.div>
        )}

        {/* Material list */}
        {materials.length === 0 ? (
          <div className={styles.emptyTab}>
            <FileText size={36} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p>Belum ada materi</p>
          </div>
        ) : (
          <div className={styles.matList}>
            {materials.map(mat => (
              <div key={mat.id} className={styles.matCard}>
                <div className={styles.matCardHeader}>
                  <div className={styles.matInfo}>
                    {mat.type === 'link' ? <Link size={14} /> : <FileText size={14} />}
                    <span className={styles.matName}>{mat.name}</span>
                  </div>
                  <div className={styles.matCardActions}>
                    <button
                      className={styles.delMatBtn}
                      onClick={() => { deleteMaterial(mat.id); load() }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {mat.type === 'link' ? (
                  <a href={mat.content} target="_blank" rel="noopener noreferrer" className={styles.matLink}>
                    {mat.content}
                  </a>
                ) : (
                  <p className={styles.matContent}>{mat.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
