import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, BookOpen, Calendar, CheckSquare 
} from 'lucide-react'
import styles from './BottomNav.module.css'

const navItems = [
  { path: '/',        icon: Home,        label: 'Beranda' },
  { path: '/courses', icon: BookOpen,    label: 'Matkul' },
  { path: '/schedule',icon: Calendar,    label: 'Jadwal' },
  { path: '/todos',   icon: CheckSquare, label: 'Tugas' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <nav className={styles.nav}>
      {navItems.map(({ path, icon: Icon, label }) => {
        const active = isActive(path)
        return (
          <button
            key={path}
            id={`nav-${label.toLowerCase()}`}
            className={`${styles.item} ${active ? styles.active : ''}`}
            onClick={() => navigate(path)}
            aria-label={label}
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className={styles.indicator}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className={styles.iconWrap}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
