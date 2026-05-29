import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Plus, CheckSquare, AlertTriangle, CheckCircle2, Filter } from 'lucide-react'
import { useTodosStore } from '../../store/useTodosStore'
import { useNavigate } from 'react-router-dom'
import styles from './Deadline.module.css'

const RADIUS = 24
const CIRC = 2 * Math.PI * RADIUS

function daysLeft(deadline) {
  const now = new Date()
  const d = new Date(deadline)
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

function getRingClass(days, completed) {
  if (completed) return styles.ringDone
  if (days <= 0) return styles.ringUrgent
  if (days <= 3) return styles.ringUrgent
  if (days <= 7) return styles.ringSoon
  return styles.ringOk
}

function getBadgeClass(days, completed) {
  if (completed) return styles.badgeDone
  if (days <= 0) return styles.badgeUrgent
  if (days <= 3) return styles.badgeUrgent
  if (days <= 7) return styles.badgeSoon
  return styles.badgeOk
}

function getBorderColor(days, completed) {
  if (completed) return 'var(--color-text-muted)'
  if (days <= 0) return 'var(--color-danger)'
  if (days <= 3) return 'var(--color-danger)'
  if (days <= 7) return 'var(--color-warning)'
  return 'var(--color-success)'
}

function formatDeadline(deadline) {
  return new Date(deadline).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function RingCountdown({ days, completed }) {
  const maxDays = 30
  const clamped = Math.min(Math.max(days, 0), maxDays)
  const fraction = completed ? 1 : clamped / maxDays
  const strokeDasharray = `${CIRC * fraction} ${CIRC * (1 - fraction)}`
  const ringClass = getRingClass(days, completed)

  return (
    <div className={styles.countdownWrapper} style={{ position: 'relative' }}>
      <svg className={styles.countdownSvg} viewBox="0 0 62 62">
        <circle className={styles.ringBg} cx="31" cy="31" r={RADIUS} />
        <circle
          className={`${styles.ringFill} ${ringClass}`}
          cx="31" cy="31" r={RADIUS}
          strokeDasharray={strokeDasharray}
          strokeDashoffset="0"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className={styles.countdownDays}>
          {completed ? '✓' : days <= 0 ? '!' : days}
        </span>
        <span className={styles.countdownLabel}>
          {completed ? 'Done' : days <= 0 ? 'Late' : 'hari'}
        </span>
      </div>
    </div>
  )
}

export default function Deadline() {
  const { todos, fetchTodos } = useTodosStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // all | active | done

  useEffect(() => { fetchTodos() }, [])

  const withDeadline = useMemo(() => {
    return todos
      .filter(t => t.deadline)
      .filter(t => {
        if (filter === 'active') return !t.completed
        if (filter === 'done') return t.completed
        return true
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return new Date(a.deadline) - new Date(b.deadline)
      })
  }, [todos, filter])

  const stats = useMemo(() => {
    const active = todos.filter(t => t.deadline && !t.completed)
    const overdue = active.filter(t => daysLeft(t.deadline) <= 0)
    const soon = active.filter(t => { const d = daysLeft(t.deadline); return d > 0 && d <= 7 })
    const done = todos.filter(t => t.deadline && t.completed)
    return { active: active.length, overdue: overdue.length, soon: soon.length, done: done.length }
  }, [todos])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>⏰ Deadline Wall</h1>
        <p className={styles.subtitle}>Pantau semua tenggat waktu tugasmu</p>
      </div>

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statNum} style={{ color: 'var(--color-danger)' }}>{stats.overdue}</div>
            <div className={styles.statLbl}>Terlambat</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum} style={{ color: 'var(--color-warning)' }}>{stats.soon}</div>
            <div className={styles.statLbl}>≤ 7 Hari</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum} style={{ color: 'var(--color-success)' }}>{stats.done}</div>
            <div className={styles.statLbl}>Selesai</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[['all', 'Semua'], ['active', 'Aktif'], ['done', 'Selesai']].map(([v, l]) => (
            <button key={v}
              onClick={() => setFilter(v)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)',
                background: filter === v ? 'var(--color-primary)' : 'var(--color-surface)',
                color: filter === v ? 'white' : 'var(--color-text)',
                fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >{l}</button>
          ))}
        </div>

        {/* Cards */}
        {withDeadline.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={56} className={styles.emptyIcon} />
            <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>
              {filter === 'done' ? 'Belum ada tugas selesai' : 'Tidak ada deadline aktif 🎉'}
            </p>
            <button
              onClick={() => navigate('/todos')}
              style={{
                padding: '8px 20px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)',
                color: 'white', border: 'none', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}
            >
              <Plus size={14} /> Tambah Tugas
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {withDeadline.map(todo => {
              const days = daysLeft(todo.deadline)
              const borderColor = getBorderColor(days, todo.completed)
              return (
                <motion.div
                  key={todo.id}
                  className={styles.deadlineCard}
                  style={{ borderLeftColor: borderColor }}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, padding: 0, margin: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                  <div className={styles.cardRow}>
                    <div className={styles.cardLeft}>
                      <p className={styles.taskTitle}>{todo.title}</p>
                      <p className={styles.taskCategory}>{todo.category}</p>
                      <span className={`${styles.timeBadge} ${getBadgeClass(days, todo.completed)}`}>
                        {todo.completed
                          ? '✓ Selesai'
                          : days <= 0
                            ? `⚠ Terlambat ${Math.abs(days)} hari`
                            : days === 0
                              ? '⚡ Hari ini!'
                              : `${days} hari lagi`
                        }
                      </span>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {formatDeadline(todo.deadline)}
                      </p>
                    </div>
                    <RingCountdown days={days} completed={todo.completed} />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}

        {/* Go to Todos button */}
        <button
          onClick={() => navigate('/todos')}
          style={{
            width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--color-border)', background: 'transparent',
            color: 'var(--color-text-sub)', fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)'
          }}
        >
          <Plus size={16} /> Kelola Tugas di To-Do
        </button>
      </div>
    </div>
  )
}
