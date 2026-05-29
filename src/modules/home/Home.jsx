import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, Calendar, CheckSquare,
  Wallet, Presentation, Timer, Calculator, ClipboardList,
  Clock, TrendingUp, FileText, Bell,
  ChevronRight, Sun, Moon, Sunset
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useTodosStore } from '../../store/useTodosStore'
import styles from './Home.module.css'

const MODULES = [
  // Row 1 — Primary (large)
  { id: 'courses',  label: 'Mata Kuliah',    icon: BookOpen,      path: '/courses',  color: 'var(--color-mod-courses)',  size: 'large' },
  { id: 'schedule', label: 'Jadwal',          icon: Calendar,      path: '/schedule', color: 'var(--color-mod-schedule)', size: 'large' },
  // Row 2 — Secondary
  { id: 'todos',    label: 'To-Do',           icon: CheckSquare,   path: '/todos',    color: 'var(--color-mod-todo)',     size: 'medium' },
  { id: 'documents',label: 'Dokumen',         icon: FileText,      path: '/documents',color: 'var(--color-info)',         size: 'medium' },
  // Row 3
  { id: 'finance',  label: 'Keuangan',        icon: Wallet,        path: '/finance',  color: 'var(--color-mod-finance)',  size: 'medium' },
  { id: 'ppt',      label: 'Presentasi',      icon: Presentation,  path: '/ppt',      color: 'var(--color-mod-ppt)',      size: 'medium' },
  // Row 4 — Bonus (small)
  { id: 'pomodoro', label: 'Pomodoro',        icon: Timer,         path: '/pomodoro',    color: 'var(--color-mod-pomodoro)', size: 'small' },
  { id: 'deadline', label: 'Deadline Wall',   icon: Clock,         path: '/deadline',    color: 'var(--color-mod-ppt)',      size: 'small' },
  { id: 'grades',   label: 'Nilai',           icon: TrendingUp,    path: '/grades',      color: 'var(--color-mod-courses)',  size: 'small' },
  { id: 'ipk',      label: 'Kalkulator IPK',  icon: Calculator,    path: '/ipk',         color: 'var(--color-mod-ipk)',      size: 'small' },
  { id: 'attend',   label: 'Absensi',         icon: ClipboardList, path: '/attendance',  color: 'var(--color-mod-todo)',     size: 'small' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return { text: 'Selamat Pagi', icon: Sun }
  if (h < 15) return { text: 'Selamat Siang', icon: Sun }
  if (h < 18) return { text: 'Selamat Sore', icon: Sunset }
  return { text: 'Selamat Malam', icon: Moon }
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.85, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,
             transition: { type: 'spring', stiffness: 350, damping: 22 } },
}

const AVATAR_GRADIENTS = {
  blue: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  purple: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  teal: 'linear-gradient(135deg, #14B8A6, #0F766E)',
  emerald: 'linear-gradient(135deg, #10B981, #047857)',
  orange: 'linear-gradient(135deg, #F97316, #C2410C)'
}

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useAppStore()
  const { getTodaySchedule, fetchSchedules } = useScheduleStore()
  const { getStats, fetchTodos } = useTodosStore()
  const [todaySchedule, setTodaySchedule] = useState([])
  const [todoStats, setTodoStats] = useState({ total: 0, completed: 0, overdue: 0, today: 0 })

  const greeting = getGreeting()
  const GreetIcon = greeting.icon

  useEffect(() => {
    const load = async () => {
      await fetchSchedules()
      await fetchTodos()
      setTodaySchedule(getTodaySchedule())
      setTodoStats(getStats())
    }
    load()
  }, [])

  const firstName = profile.name?.split(' ')[0] || 'Pengguna'
  const now = new Date()
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`

  const avatarColor = profile.avatarColor || 'blue'
  const avatarGradient = AVATAR_GRADIENTS[avatarColor] || AVATAR_GRADIENTS.blue
  const initialLetter = profile.name?.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.userBlock}>
            <div 
              className={styles.avatarHeader}
              style={{ background: avatarGradient }}
              onClick={() => navigate('/settings')}
              title="Pengaturan Profil"
            >
              {initialLetter}
            </div>
            <div className={styles.greetingBlock}>
              <div className={styles.greeting}>
                <GreetIcon size={16} className={styles.greetIcon} />
                <span>{greeting.text},</span>
              </div>
              <h1 className={styles.name}>{firstName}! 👋</h1>
              <p className={styles.date}>{dateStr}</p>
            </div>
          </div>
          <button
            id="home-notifications"
            className={styles.notifBtn}
            onClick={() => navigate('/settings')}
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* Quick stats */}
        <div className={styles.stats}>
          <StatChip
            label="Kuliah Hari Ini"
            value={todaySchedule.length}
            color="var(--color-mod-schedule)"
            onClick={() => navigate('/schedule')}
          />
          <StatChip
            label="Tugas Aktif"
            value={todoStats.total - todoStats.completed}
            color="var(--color-mod-todo)"
            onClick={() => navigate('/todos')}
          />
          {todoStats.overdue > 0 && (
            <StatChip
              label="Overdue!"
              value={todoStats.overdue}
              color="var(--color-danger)"
              onClick={() => navigate('/todos')}
            />
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Today's schedule preview */}
        {todaySchedule.length > 0 && (
          <section className={styles.section}>
            <SectionHeader title="Jadwal Hari Ini" onMore={() => navigate('/schedule')} />
            <div className={styles.scheduleList}>
              {todaySchedule.slice(0, 3).map(s => (
                <div key={s.id} className={styles.scheduleItem} style={{ borderLeftColor: s.color || 'var(--color-primary)' }}>
                  <div className={styles.scheduleTime}>
                    {s.startTime} – {s.endTime}
                  </div>
                  <div className={styles.scheduleName}>{s.course?.name || s.courseName || 'Mata Kuliah'}</div>
                  <div className={styles.scheduleRoom}>{s.room || '—'}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Module grid */}
        <section className={styles.section}>
          <SectionHeader title="Menu Utama" />
          <motion.div
            className={styles.grid}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {MODULES.map(mod => (
              <motion.button
                key={mod.id}
                id={`home-module-${mod.id}`}
                className={`${styles.moduleBtn} ${styles[mod.size]}`}
                style={{ '--mod-color': mod.color }}
                variants={item}
                onClick={() => navigate(mod.path)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={styles.modIcon}>
                  <mod.icon size={mod.size === 'large' ? 28 : mod.size === 'medium' ? 22 : 18} strokeWidth={1.8} />
                </div>
                <span className={styles.modLabel}>{mod.label}</span>
              </motion.button>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  )
}

function StatChip({ label, value, color, onClick }) {
  return (
    <button className={styles.statChip} onClick={onClick} style={{ '--chip-color': color }}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </button>
  )
}

function SectionHeader({ title, onMore }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {onMore && (
        <button className={styles.moreBtn} onClick={onMore}>
          Lihat semua <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
