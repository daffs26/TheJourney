import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, CheckCircle2, Circle, ChevronDown, ChevronUp, BookOpen, Trophy } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'

// Kurikulum SI (Sistem Informasi) — representative set
const CURRICULUM = [
  {
    subject: 'Matematika & Logika',
    color: '#3b82f6',
    topics: [
      { id: 'c1', topic: 'Matematika Diskrit', subtopics: ['Logika Proposisi', 'Himpunan & Relasi', 'Graf & Pohon', 'Kombinatorika'] },
      { id: 'c2', topic: 'Kalkulus', subtopics: ['Limit & Turunan', 'Integral', 'Deret'] },
      { id: 'c3', topic: 'Aljabar Linear', subtopics: ['Matriks & Operasi', 'Vektor & Ruang Vektor', 'Nilai Eigen'] },
      { id: 'c4', topic: 'Statistika & Probabilitas', subtopics: ['Distribusi Probabilitas', 'Uji Hipotesis', 'Regresi'] },
    ]
  },
  {
    subject: 'Pemrograman & Algoritma',
    color: '#10b981',
    topics: [
      { id: 'c5', topic: 'Dasar Pemrograman', subtopics: ['Variabel & Tipe Data', 'Percabangan & Perulangan', 'Fungsi & Prosedur'] },
      { id: 'c6', topic: 'Struktur Data', subtopics: ['Array & String', 'Linked List', 'Stack & Queue', 'Tree & Heap', 'Hash Table', 'Graf'] },
      { id: 'c7', topic: 'Algoritma', subtopics: ['Sorting & Searching', 'Dynamic Programming', 'Greedy Algorithm', 'Divide & Conquer', 'Backtracking'] },
      { id: 'c8', topic: 'OOP (Java/Python)', subtopics: ['Class & Object', 'Inheritance', 'Polymorphism', 'Encapsulation', 'Design Pattern'] },
    ]
  },
  {
    subject: 'Sistem & Jaringan',
    color: '#f59e0b',
    topics: [
      { id: 'c9',  topic: 'Sistem Operasi',  subtopics: ['Proses & Thread', 'Manajemen Memori', 'Sistem File', 'Scheduling'] },
      { id: 'c10', topic: 'Jaringan Komputer', subtopics: ['Model OSI & TCP/IP', 'IP Address & Routing', 'DNS & DHCP', 'Keamanan Jaringan'] },
      { id: 'c11', topic: 'Keamanan Informasi', subtopics: ['Kriptografi', 'Ancaman & Serangan', 'Manajemen Risiko', 'Audit SI'] },
    ]
  },
  {
    subject: 'Basis Data',
    color: '#ef4444',
    topics: [
      { id: 'c12', topic: 'Basis Data Relasional', subtopics: ['ERD & Normalisasi', 'SQL DDL', 'SQL DML', 'Join & Subquery', 'Indexing & Optimasi'] },
      { id: 'c13', topic: 'Basis Data NoSQL', subtopics: ['MongoDB (Document)', 'Redis (Key-Value)', 'Neo4j (Graf)', 'Cassandra (Column)'] },
      { id: 'c14', topic: 'Data Warehouse & BI', subtopics: ['OLAP vs OLTP', 'Star & Snowflake Schema', 'ETL Process', 'Visualisasi Data'] },
    ]
  },
  {
    subject: 'Rekayasa Perangkat Lunak',
    color: '#8b5cf6',
    topics: [
      { id: 'c15', topic: 'SDLC & Metodologi', subtopics: ['Waterfall', 'Agile & Scrum', 'Kanban', 'DevOps'] },
      { id: 'c16', topic: 'Rekayasa Kebutuhan', subtopics: ['Use Case Diagram', 'User Story', 'Spesifikasi Kebutuhan'] },
      { id: 'c17', topic: 'Pengujian Perangkat Lunak', subtopics: ['Unit Testing', 'Integration Testing', 'UI Testing', 'Performance Testing'] },
    ]
  },
  {
    subject: 'Web & Mobile Development',
    color: '#06b6d4',
    topics: [
      { id: 'c18', topic: 'Frontend Web', subtopics: ['HTML & CSS', 'JavaScript ES6+', 'React / Vue / Angular', 'Responsive Design'] },
      { id: 'c19', topic: 'Backend Web', subtopics: ['REST API', 'Node.js / Express', 'Python / Django / Flask', 'Autentikasi & JWT'] },
      { id: 'c20', topic: 'Mobile Development', subtopics: ['Android (Kotlin/Java)', 'iOS (Swift)', 'React Native / Flutter', 'PWA'] },
    ]
  },
  {
    subject: 'Manajemen & Bisnis SI',
    color: '#f97316',
    topics: [
      { id: 'c21', topic: 'Manajemen Proyek SI', subtopics: ['Perencanaan & WBS', 'Manajemen Risiko', 'Monitoring & Evaluasi', 'MS Project / Jira'] },
      { id: 'c22', topic: 'Tata Kelola SI', subtopics: ['COBIT Framework', 'ITIL Framework', 'ISO 27001', 'SLA & KPI'] },
      { id: 'c23', topic: 'E-Business', subtopics: ['Model Bisnis Digital', 'E-Commerce', 'Digital Marketing', 'ERP & CRM'] },
    ]
  },
  {
    subject: 'Kecerdasan Buatan & Data',
    color: '#ec4899',
    topics: [
      { id: 'c24', topic: 'Machine Learning', subtopics: ['Supervised Learning', 'Unsupervised Learning', 'Neural Network Dasar', 'Evaluasi Model'] },
      { id: 'c25', topic: 'Deep Learning', subtopics: ['CNN', 'RNN & LSTM', 'Transformer & Attention', 'Transfer Learning'] },
      { id: 'c26', topic: 'Big Data & Cloud', subtopics: ['Hadoop & Spark', 'Cloud (AWS/GCP/Azure)', 'Containerization (Docker/K8s)', 'Streaming Data'] },
    ]
  },
]

function totalTopics(subject) {
  return subject.topics.length
}

function progressPercent(subject, doneSet) {
  const total = subject.topics.reduce((a, t) => a + t.subtopics.length, 0)
  if (total === 0) return 0
  const done = subject.topics.reduce((a, t) => a + t.subtopics.filter(s => doneSet.has(`${t.id}::${s}`)).length, 0)
  return Math.round((done / total) * 100)
}

export default function Learning() {
  const { addToast } = useAppStore()
  const [done, setDone] = useState(new Set()) // Set of "topicId::subtopic"
  const [notes, setNotes] = useState({}) // key: topicId::subtopic → note string
  const [expanded, setExpanded] = useState({}) // topicId → bool
  const [subjectExpanded, setSubjectExpanded] = useState({})
  const [editNote, setEditNote] = useState(null) // {key, value}

  // Load from DB
  const load = async () => {
    const rows = await db.learningTopics.toArray()
    const doneSet = new Set(rows.filter(r => r.status === 'done').map(r => `${r.topic}::${r.subtopic}`))
    const notesMap = {}
    rows.forEach(r => { if (r.notes) notesMap[`${r.topic}::${r.subtopic}`] = r.notes })
    setDone(doneSet)
    setNotes(notesMap)
  }

  useEffect(() => { load() }, [])

  const toggleDone = async (topicId, subtopic) => {
    const key = `${topicId}::${subtopic}`
    const exists = await db.learningTopics.where('[topic+subtopic]').equals([topicId, subtopic]).first()
    if (exists) {
      const newStatus = exists.status === 'done' ? 'not_started' : 'done'
      await db.learningTopics.update(exists.id, { status: newStatus, completedAt: newStatus === 'done' ? new Date() : null })
    } else {
      await db.learningTopics.add({ topic: topicId, subtopic, status: 'done', notes: '', completedAt: new Date(), createdAt: new Date() })
    }
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalAll = CURRICULUM.reduce((a, s) => a + s.topics.reduce((b, t) => b + t.subtopics.length, 0), 0)
  const doneAll = done.size
  const overallPct = Math.round((doneAll / totalAll) * 100)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-h))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top,0px)) var(--space-4) var(--space-5)', background: 'linear-gradient(160deg, #1e1a3e 0%, #2d2a5e 100%)', color: 'white', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900, marginBottom: 4 }}>🎓 Belajar Mandiri</h1>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)' }}>Kurikulum Sistem Informasi — {totalAll} topik</p>

        {/* Overall progress */}
        <div style={{ marginTop: 'var(--space-4)', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Progress Keseluruhan</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>{doneAll} / {totalAll} ({overallPct}%)</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)', borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-12) + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {CURRICULUM.map(subject => {
          const pct = progressPercent(subject, done)
          const isOpen = subjectExpanded[subject.subject]
          return (
            <div key={subject.subject}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', borderLeft: `4px solid ${subject.color}` }}>
              {/* Subject header */}
              <button onClick={() => setSubjectExpanded(e => ({ ...e, [subject.subject]: !e[subject.subject] }))}
                style={{ width: '100%', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{subject.subject}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <div style={{ flex: 1, height: 5, background: 'var(--color-border-light)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: subject.color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: subject.color, flexShrink: 0 }}>{pct}%</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
              </button>

              {/* Topics */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 var(--space-4) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {subject.topics.map(topic => {
                        const topicOpen = expanded[topic.id]
                        const topicDoneCount = topic.subtopics.filter(s => done.has(`${topic.id}::${s}`)).length
                        return (
                          <div key={topic.id} style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                            <button onClick={() => setExpanded(e => ({ ...e, [topic.id]: !e[topic.id] }))}
                              style={{ width: '100%', padding: 'var(--space-3) var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BookOpen size={14} color={subject.color} />
                                <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 'var(--font-size-xs)' }}>{topic.topic}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{topicDoneCount}/{topic.subtopics.length}</span>
                                {topicOpen ? <ChevronUp size={12} color="var(--color-text-muted)" /> : <ChevronDown size={12} color="var(--color-text-muted)" />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {topicOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  style={{ overflow: 'hidden', padding: '0 var(--space-3) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {topic.subtopics.map(sub => {
                                    const key = `${topic.id}::${sub}`
                                    const isDone = done.has(key)
                                    return (
                                      <motion.div key={sub}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
                                        whileTap={{ scale: 0.97 }}>
                                        <button onClick={() => toggleDone(topic.id, sub)}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', color: isDone ? subject.color : 'var(--color-text-muted)' }}>
                                          {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </button>
                                        <span style={{ flex: 1, fontSize: 'var(--font-size-xs)', color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: isDone ? 'line-through' : 'none', fontWeight: isDone ? 400 : 500 }}>
                                          {sub}
                                        </span>
                                        {isDone && <span style={{ fontSize: 10, color: subject.color }}>✓</span>}
                                      </motion.div>
                                    )
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {/* Achievement section */}
        {overallPct >= 25 && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', border: '1px solid #fbbf24', textAlign: 'center' }}>
            <Trophy size={28} color="#d97706" style={{ marginBottom: 4 }} />
            <p style={{ fontWeight: 800, color: '#92400e', fontSize: 'var(--font-size-sm)' }}>
              {overallPct >= 75 ? '🏆 Hampir ahli!' : overallPct >= 50 ? '⭐ Setengah jalan!' : '🎯 Awal yang bagus!'}
            </p>
            <p style={{ fontSize: 11, color: '#b45309' }}>Kamu sudah menguasai {overallPct}% kurikulum SI</p>
          </div>
        )}
      </div>
    </div>
  )
}
