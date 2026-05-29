import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Toast.module.css'

const icons = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
}

export default function Toast({ toasts }) {
  const { removeToast } = useAppStore()

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map(toast => {
          const Icon = icons[toast.type] || Info
          return (
            <motion.div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.type]}`}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              layout
            >
              <Icon size={16} strokeWidth={2} className={styles.icon} />
              <span className={styles.message}>{toast.message}</span>
              <button className={styles.close} onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
