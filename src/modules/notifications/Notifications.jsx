import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Bell, Calendar, Clock, AlertCircle,
  CheckCircle, Info, ChevronRight, BookOpen, AlertTriangle
} from 'lucide-react'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useTodosStore } from '../../store/useTodosStore'
import styles from './Notifications.module.css'

export default function Notifications() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // all | class | todo

  const { getTodaySchedule, fetchSchedules } = useScheduleStore()
  const { todos, fetchTodos } = useTodosStore()

  const [todaySchedule, setTodaySchedule] = useState([])

  useEffect(() => {
    const load = async () => {
      await fetchSchedules()
      await fetchTodos()
      setTodaySchedule(getTodaySchedule())
    }
    load()
  }, [])

  // Helper to check if date is today
  const isToday = (dateInput) => {
    if (!dateInput) return false
    const d = new Date(dateInput)
    const today = new Date()
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  }

  // Helper to check if date is tomorrow
  const isTomorrow = (dateInput) => {
    if (!dateInput) return false
    const d = new Date(dateInput)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
  }

  // Build dynamic notifications array
  const notificationsList = useMemo(() => {
    const list = []
    const now = new Date()
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // 1. Map Today's Classes
    todaySchedule.forEach(sched => {
      const isOngoing = currentHourMin >= sched.startTime && currentHourMin <= sched.endTime
      const isPast = currentHourMin > sched.endTime
      const courseName = sched.course?.name || sched.courseName || 'Mata Kuliah'
      const timeRange = `${sched.startTime} - ${sched.endTime}`
      const roomInfo = sched.room ? `di Ruang ${sched.room}` : 'di kelas'

      let title = ''
      let body = ''
      let icon = Clock
      let color = 'var(--color-primary)'
      let priority = 3 // default priority

      if (isOngoing) {
        title = 'Kelas Sedang Berlangsung 📚'
        body = `Kelas "${courseName}" sedang berlangsung saat ini (${timeRange} ${roomInfo}).`
        color = '#10B981' // Green
        priority = 1
      } else if (isPast) {
        title = 'Kelas Telah Selesai ✅'
        body = `Kelas "${courseName}" (${timeRange}) telah selesai berlangsung hari ini.`
        color = 'var(--color-text-muted)'
        icon = CheckCircle
        priority = 5
      } else {
        title = 'Kelas Mendatang Hari Ini ⏰'
        body = `Kelas "${courseName}" akan dimulai hari ini pukul ${sched.startTime} ${roomInfo}.`
        color = '#F59E0B' // Orange
        priority = 2
      }

      list.push({
        id: `class-${sched.id}-${sched.startTime}`,
        type: 'class',
        title,
        body,
        icon,
        color,
        time: sched.startTime,
        priority,
        actionLabel: 'Lihat Jadwal',
        actionPath: '/schedule'
      })
    })

    // 2. Map Uncompleted Tasks (Todos)
    const activeTodos = todos.filter(t => !t.completed && !t.parentId)
    activeTodos.forEach(todo => {
      if (!todo.deadline) return

      const deadlineDate = new Date(todo.deadline)
      const isOverdueVal = deadlineDate < now
      const isTodayVal = isToday(todo.deadline)
      const isTomorrowVal = isTomorrow(todo.deadline)

      let title = ''
      let body = ''
      let icon = AlertCircle
      let color = 'var(--color-danger)'
      let priority = 4
      let timeText = new Date(todo.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

      if (isOverdueVal) {
        title = 'Tugas Terlambat (Overdue) ⚠️'
        body = `Tugas "${todo.title}" sudah melewati batas waktu pengumpulan!`
        color = '#EF4444' // Red
        priority = 1.5
        icon = AlertTriangle
      } else if (isTodayVal) {
        title = 'Tugas Berakhir Hari Ini 🔥'
        body = `Batas waktu pengumpulan tugas "${todo.title}" adalah hari ini!`
        color = '#F97316' // Orange-red
        priority = 2.5
      } else if (isTomorrowVal) {
        title = 'Tugas Berakhir Besok ⏳'
        body = `Jangan lupa kerjakan tugas "${todo.title}" yang berakhir besok.`
        color = '#3B82F6' // Blue
        priority = 4.5
      } else {
        // Future deadline
        return
      }

      list.push({
        id: `todo-${todo.id}`,
        type: 'todo',
        title,
        body,
        icon,
        color,
        time: timeText,
        priority,
        actionLabel: 'Buka Tugas',
        actionPath: '/todos'
      })
    })

    // 3. System Static Info
    list.push({
      id: 'sys-pwa',
      type: 'system',
      title: 'Aplikasi Offline Siap (PWA) 📱',
      body: 'TheJourney berjalan secara offline di browser Anda. Semua data tersimpan aman di database lokal (IndexedDB).',
      icon: Info,
      color: '#06B6D4', // Cyan
      time: 'Sistem',
      priority: 6,
      actionLabel: 'Pelajari Offline',
      actionPath: '/settings'
    })

    // Sort by priority (ascending, smaller number = higher priority)
    return list.sort((a, b) => a.priority - b.priority)
  }, [todaySchedule, todos])

  // Filter list by active tab
  const filteredList = useMemo(() => {
    if (activeTab === 'all') return notificationsList
    return notificationsList.filter(item => item.type === activeTab)
  }, [notificationsList, activeTab])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Kembali ke Beranda">
          <ArrowLeft size={18} />
        </button>
        <h1 className={styles.title}>Notifikasi</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Semua
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'class' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('class')}
        >
          Kelas
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'todo' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          Tugas
        </button>
      </div>

      {/* Notifications List */}
      <div className={styles.list}>
        {filteredList.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={48} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p>Tidak ada pemberitahuan baru</p>
          </div>
        ) : (
          filteredList.map((notif, idx) => {
            const IconComponent = notif.icon
            return (
              <motion.div
                key={notif.id}
                className={styles.card}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 350, damping: 28 }}
              >
                <div className={styles.indicator} style={{ background: notif.color }} />
                <div className={styles.iconWrapper} style={{ background: `${notif.color}15`, color: notif.color }}>
                  <IconComponent size={20} />
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{notif.title}</h3>
                    <span className={styles.timeTag}>{notif.time}</span>
                  </div>
                  <p className={styles.cardBody}>{notif.body}</p>
                  {notif.actionLabel && (
                    <button className={styles.actionLink} onClick={() => navigate(notif.actionPath)}>
                      {notif.actionLabel} <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
