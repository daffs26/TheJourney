import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, Edit3, Trash2, ChevronDown, ChevronUp, Target } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'

// Grade thresholds (Indonesian university scale)
const GRADE_SCALE = [
  { min: 85, grade: 'A',  point: 4.0, color: '#10b981' },
  { min: 80, grade: 'A-', point: 3.7, color: '#34d399' },
  { min: 75, grade: 'B+', point: 3.3, color: '#3b82f6' },
  { min: 70, grade: 'B',  point: 3.0, color: '#60a5fa' },
  { min: 65, grade: 'B-', point: 2.7, color: '#a78bfa' },
  { min: 60, grade: 'C+', point: 2.3, color: '#f59e0b' },
  { min: 55, grade: 'C',  point: 2.0, color: '#fbbf24' },
  { min: 50, grade: 'C-', point: 1.7, color: '#f97316' },
  { min: 40, grade: 'D',  point: 1.0, color: '#ef4444' },
  { min: 0,  grade: 'E',  point: 0.0, color: '#dc2626' },
]

function getGrade(score) {
  for (const g of GRADE_SCALE) {
    if (score >= g.min) return g
  }
  return GRADE_SCALE[GRADE_SCALE.length - 1]
}

// Default weight: UTS 35%, UAS 40%, Tugas 25%
const DEFAULT_WEIGHTS = { assignment: 25, midterm: 35, final: 40, practice: 0 }

function calcFinal(entry, weights = DEFAULT_WEIGHTS) {
  const { assignmentScore, midtermScore, finalScore, practiceScore } = entry
  const total = weights.assignment + weights.midterm + weights.final + weights.practice
  if (total === 0) return 0
  const weighted =
    (Number(assignmentScore) || 0) * weights.assignment +
    (Number(midtermScore)    || 0) * weights.midterm +
    (Number(finalScore)      || 0) * weights.final +
    (Number(practiceScore)   || 0) * weights.practice
  return weighted / total
}

const FORM_DEFAULT = {
  courseId: '', courseName: '', sks: 3, semester: 1,
  assignmentScore: '', midtermScore: '', finalScore: '', practiceScore: '',
  note: '',
}

export default function Grades() {
  const { addToast } = useAppStore()
  const [entries, setEntries] = useState([])
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(FORM_DEFAULT)
  const [editing, setEditing] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS)
  const [showWeights, setShowWeights] = useState(false)
  const [semFilter, setSemFilter] = useState('all')

  const load = async () => {
    const [e, c] = await Promise.all([db.gradeEntries.toArray(), db.courses.toArray()])
    setEntries(e)
    setCourses(c)
  }

  useEffect(() => { load() }, [])

  const semesters = [...new Set(entries.map(e => e.semester).filter(Boolean))].sort()
  const filtered = semFilter === 'all' ? entries : entries.filter(e => String(e.semester) === String(semFilter))

  // Compute stats
  const stats = (() => {
    const withFinal = filtered.filter(e => e.finalScore !== '' && e.finalScore !== null && e.finalScore !== undefined)
    if (withFinal.length === 0) return { avg: 0, gpa: 0, totalSks: 0 }
    const totalSks = withFinal.reduce((a, e) => a + (Number(e.sks) || 3), 0)
    const weightedPoints = withFinal.reduce((a, e) => {
      const score = calcFinal(e, weights)
      const g = getGrade(score)
      return a + g.point * (Number(e.sks) || 3)
    }, 0)
    const avg = withFinal.reduce((a, e) => a + calcFinal(e, weights), 0) / withFinal.length
    return { avg: avg.toFixed(1), gpa: (weightedPoints / totalSks).toFixed(2), totalSks }
  })()

  const handleSave = async () => {
    if (!form.courseName.trim()) { addToast('Nama mata kuliah wajib diisi!', 'warning'); return }
    const data = { ...form, sks: Number(form.sks), semester: Number(form.semester), updatedAt: new Date() }
    if (editing) {
      await db.gradeEntries.update(editing, data)
      addToast('Nilai diperbarui!', 'success')
    } else {
      await db.gradeEntries.add({ ...data, createdAt: new Date() })
      addToast('Nilai ditambahkan!', 'success')
    }
    setShowModal(false)
    setForm(FORM_DEFAULT)
    setEditing(null)
    load()
  }

  const handleEdit = (entry) => {
    setForm({ ...entry })
    setEditing(entry.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    await db.gradeEntries.delete(id)
    addToast('Entri dihapus', 'info')
    load()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-h))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top,0px)) var(--space-4) var(--space-5)', background: 'linear-gradient(160deg, #0c2040 0%, #1e3a5f 100%)', color: 'white', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-extrabold)' }}>📊 Nilai & Estimasi</h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Pantau performa akademikmu</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowWeights(v => !v)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
              <Target size={18} />
            </button>
            <button onClick={() => { setForm(FORM_DEFAULT); setEditing(null); setShowModal(true) }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          {[
            { label: 'Rata-rata', value: `${stats.avg}`, color: '#60a5fa' },
            { label: 'Est. IPK', value: stats.gpa, color: '#34d399' },
            { label: 'Total SKS', value: stats.totalSks, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', padding: '6px 14px' }}>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-extrabold)', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-12) + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Weights editor */}
        <AnimatePresence>
          {showWeights && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', overflow: 'hidden' }}
            >
              <p style={{ fontWeight: 'var(--font-weight-bold)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', color: 'var(--color-text)' }}>⚖️ Bobot Penilaian (%)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                {[['assignment', 'Tugas'], ['midterm', 'UTS'], ['final', 'UAS'], ['practice', 'Praktikum']].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type="number" min="0" max="100"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                      value={weights[key]}
                      onChange={e => setWeights(w => ({ ...w, [key]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 8 }}>
                Total: {Object.values(weights).reduce((a, b) => a + b, 0)}% {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && '⚠️ Harus 100%'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Semester filter */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {['all', ...semesters].map(s => (
            <button key={s} onClick={() => setSemFilter(String(s))}
              style={{ padding: '5px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: semFilter === String(s) ? 'var(--color-primary)' : 'var(--color-surface)', color: semFilter === String(s) ? 'white' : 'var(--color-text)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
              {s === 'all' ? 'Semua' : `Semester ${s}`}
            </button>
          ))}
        </div>

        {/* Grade cards */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12) var(--space-6)', textAlign: 'center', color: 'var(--color-text-sub)', gap: 'var(--space-3)' }}>
            <TrendingUp size={56} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p style={{ fontWeight: 700 }}>Belum ada data nilai</p>
            <button onClick={() => { setForm(FORM_DEFAULT); setEditing(null); setShowModal(true) }}
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} /> Tambah Nilai
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(entry => {
              const score = calcFinal(entry, weights)
              const grade = getGrade(score)
              const expanded = expandedId === entry.id
              const hasAllScores = entry.assignmentScore !== '' && entry.midtermScore !== '' && entry.finalScore !== ''

              return (
                <motion.div key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${grade.color}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Grade badge */}
                    <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: `${grade.color}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: 18, color: grade.color }}>{grade.grade}</span>
                      <span style={{ fontSize: 9, color: grade.color, opacity: 0.8 }}>{grade.point.toFixed(1)}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.courseName}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-sub)' }}>{entry.sks} SKS · Sem {entry.semester}</p>
                      {hasAllScores && (
                        <p style={{ fontSize: 11, color: grade.color, fontWeight: 700, marginTop: 2 }}>
                          Estimasi: {score.toFixed(1)} / 100
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleEdit(entry)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: 4, opacity: 0.6 }}><Trash2 size={14} /></button>
                      <button onClick={() => setExpandedId(expanded ? null : entry.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border-light)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2)' }}>
                          {[
                            ['Tugas', entry.assignmentScore, weights.assignment],
                            ['UTS', entry.midtermScore, weights.midterm],
                            ['UAS', entry.finalScore, weights.final],
                            ['Praktikum', entry.practiceScore, weights.practice],
                          ].filter(([, , w]) => w > 0).map(([label, val, w]) => (
                            <div key={label} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label} ({w}%)</div>
                              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 900, color: val !== '' ? getGrade(Number(val)).color : 'var(--color-text-muted)' }}>
                                {val !== '' ? Number(val).toFixed(0) : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                        {entry.note && <p style={{ marginTop: 'var(--space-2)', fontSize: 11, color: 'var(--color-text-sub)' }}>📝 {entry.note}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} />
            <motion.div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 'var(--space-6)', zIndex: 101, paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom,0px))', maxHeight: '85vh', overflowY: 'auto' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
                {editing ? '✏️ Edit Nilai' : '➕ Tambah Nilai'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Nama Mata Kuliah *</label>
                  {courses.length > 0 ? (
                    <select style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                      value={form.courseName}
                      onChange={e => {
                        const c = courses.find(c => c.name === e.target.value)
                        setForm(f => ({ ...f, courseName: e.target.value, sks: c?.sks || 3 }))
                      }}>
                      <option value="">Pilih mata kuliah...</option>
                      {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      <option value="_custom_">+ Ketik manual</option>
                    </select>
                  ) : (
                    <input style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                      placeholder="Nama mata kuliah" value={form.courseName}
                      onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
                  )}
                  {form.courseName === '_custom_' && (
                    <input style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box', marginTop: 8 }}
                      placeholder="Ketik nama mata kuliah..." autoFocus
                      onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>SKS</label>
                    <input type="number" min="1" max="6"
                      style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                      value={form.sks} onChange={e => setForm(f => ({ ...f, sks: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Semester</label>
                    <input type="number" min="1" max="8"
                      style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                      value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  {[['assignmentScore', 'Nilai Tugas'], ['midtermScore', 'Nilai UTS'], ['finalScore', 'Nilai UAS'], ['practiceScore', 'Nilai Praktikum']].map(([key, label]) => (
                    <div key={key}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>{label}</label>
                      <input type="number" min="0" max="100" placeholder="0-100"
                        style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                        value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                {/* Live estimate */}
                {(form.assignmentScore || form.midtermScore || form.finalScore) && (
                  <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-sub)', fontWeight: 600 }}>Estimasi Nilai Akhir:</span>
                    <span style={{ fontWeight: 900, fontSize: 'var(--font-size-xl)', color: getGrade(calcFinal(form, weights)).color }}>
                      {calcFinal(form, weights).toFixed(1)} ({getGrade(calcFinal(form, weights)).grade})
                    </span>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Catatan</label>
                  <input style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                    placeholder="Catatan opsional..." value={form.note || ''}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSave}
                  style={{ flex: 2, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
