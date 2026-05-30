import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './LoadingScreen.module.css'

export default function LoadingScreen() {
  const { profile } = useAppStore()
  const name = profile?.name?.trim()

  return (
    <div className={styles.screen}>
      <div className={styles.glow} />
      
      <div className={styles.brandContainer}>
        <motion.div
          className={styles.logo}
          initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <GraduationCap size={44} strokeWidth={1.5} />
        </motion.div>
        
        <motion.h1 
          className={styles.title}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          TheJourney
        </motion.h1>
        
        <motion.p 
          className={name ? styles.userName : styles.subtitle}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          {name || 'Super App Mahasiswa SI'}
        </motion.p>
      </div>

      <motion.div
        className={styles.dots}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className={styles.dot}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </div>
  )
}
