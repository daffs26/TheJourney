import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Timer, Clock, TrendingUp, Calculator, ClipboardList
} from 'lucide-react'
import styles from './MoreFeatures.module.css'

const FEATURES = [
  { id: 'pomodoro', label: 'Pomodoro',        icon: Timer,         path: '/pomodoro',    color: 'var(--color-mod-pomodoro)' },
  { id: 'deadline', label: 'Deadline Wall',   icon: Clock,         path: '/deadline',    color: 'var(--color-mod-ppt)' },
  { id: 'grades',   label: 'Nilai',           icon: TrendingUp,    path: '/grades',      color: 'var(--color-mod-courses)' },
  { id: 'ipk',      label: 'Kalkulator IPK',  icon: Calculator,    path: '/ipk',         color: 'var(--color-mod-ipk)' },
  { id: 'attend',   label: 'Absensi',         icon: ClipboardList, path: '/attendance',  color: 'var(--color-mod-todo)' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 26 } },
}

export default function MoreFeatures() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Kembali ke Beranda">
          <ArrowLeft size={18} />
        </button>
        <h1 className={styles.title}>Menu Lainnya</h1>
      </div>

      {/* Grid Content */}
      <div className={styles.content}>
        <motion.div
          className={styles.grid}
          variants={container}
          initial="hidden"
          animate="show"
        >
          {FEATURES.map(feat => (
            <motion.button
              key={feat.id}
              className={styles.featureCard}
              style={{ '--feat-color': feat.color }}
              variants={item}
              onClick={() => navigate(feat.path)}
              whileTap={{ scale: 0.97 }}
            >
              <div className={styles.iconWrapper}>
                <feat.icon size={26} strokeWidth={2} />
              </div>
              <span className={styles.label}>{feat.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
