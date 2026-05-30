import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, BookOpen, CheckSquare, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Onboarding.module.css'

const steps = [
  {
    icon: GraduationCap,
    title: 'Selamat Datang di\nTheJourney!',
    subtitle: 'Teman belajarmu yang lengkap untuk kuliah.',
    color: '#2563EB',
  },
  {
    icon: BookOpen,
    title: 'Atur Perkuliahan\nmu',
    subtitle: 'Jadwal, mata kuliah, materi, dan catatan — semua dalam satu tempat.',
    color: '#8B5CF6',
  },
  {
    icon: CheckSquare,
    title: 'Jangan Sampai\nAda yang Terlewat',
    subtitle: 'To-do list dengan reminder otomatis agar tugasmu selesai tepat waktu.',
    color: '#10B981',
  },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [prodi, setProdi] = useState('Sistem Informasi')
  const [semester, setSemester] = useState('1')
  const [avatarColor, setAvatarColor] = useState('blue')
  const [showSetup, setShowSetup] = useState(false)
  const { setProfile, setOnboarded, addToast } = useAppStore()

  const isLastStep = step === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      setShowSetup(true)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleFinish = async () => {
    if (!name.trim()) {
      addToast('Masukkan namamu dulu ya!', 'warning')
      return
    }
    if (!prodi.trim()) {
      addToast('Masukkan program studimu dulu ya!', 'warning')
      return
    }
    await setProfile({ 
      name: name.trim(), 
      prodi: prodi.trim(), 
      semester: parseInt(semester), 
      avatarColor 
    })
    await setOnboarded()
  }

  const avatarGradients = {
    blue: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    purple: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    teal: 'linear-gradient(135deg, #14B8A6, #0F766E)',
    emerald: 'linear-gradient(135deg, #10B981, #047857)',
    orange: 'linear-gradient(135deg, #F97316, #C2410C)'
  }

  const initialLetter = name.trim().charAt(0).toUpperCase() || '?'

  if (showSetup) {
    return (
      <div className={styles.screen}>
        <motion.div
          className={styles.setupCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className={styles.setupHeader}>
            <div className={styles.setupIcon}>
              <GraduationCap size={28} />
            </div>
            <h2 className={styles.setupTitle}>Setup Profil</h2>
            <p className={styles.setupSub}>Sedikit info tentang kamu</p>
          </div>

          <div className={styles.avatarSetup}>
            <div 
              className={styles.avatarPreview}
              style={{ background: avatarGradients[avatarColor] }}
            >
              {initialLetter}
            </div>
            
            <div className={styles.namePreview}>
              {name.trim() || 'Nama Kamu'}
            </div>

            <div className={styles.avatarSelector}>
              {Object.keys(avatarGradients).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.avatarOption} ${avatarColor === color ? styles.avatarOptionActive : ''}`}
                  style={{ background: avatarGradients[color] }}
                  onClick={() => setAvatarColor(color)}
                  title={`Warna ${color}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Nama Kamu *</label>
              <input
                id="onboarding-name"
                className={styles.input}
                type="text"
                placeholder="Contoh: Daffa"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Program Studi *</label>
              <input
                id="onboarding-prodi"
                className={styles.input}
                type="text"
                placeholder="Contoh: Sistem Informasi"
                value={prodi}
                onChange={e => setProdi(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Semester Sekarang</label>
              <select
                id="onboarding-semester"
                className={styles.input}
                value={semester}
                onChange={e => setSemester(e.target.value)}
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i+1} value={i+1}>Semester {i+1}</option>
                ))}
              </select>
            </div>


          </div>

          <motion.button
            id="onboarding-finish"
            className={styles.finishBtn}
            onClick={handleFinish}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Mulai TheJourney 🚀
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const CurrentStep = steps[step]

  return (
    <div className={styles.screen}>
      {/* Progress dots */}
      <div className={styles.dots}>
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className={styles.dot}
            animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        ))}
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className={styles.slide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <motion.div
            className={styles.iconBox}
            style={{ background: `${CurrentStep.color}20`, border: `1.5px solid ${CurrentStep.color}40` }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <CurrentStep.icon size={52} color={CurrentStep.color} strokeWidth={1.5} />
          </motion.div>

          <h1 className={styles.title} style={{ whiteSpace: 'pre-line' }}>
            {CurrentStep.title}
          </h1>
          <p className={styles.subtitle}>{CurrentStep.subtitle}</p>
        </motion.div>
      </AnimatePresence>

      {/* CTA button */}
      <motion.button
        id={`onboarding-next-${step}`}
        className={styles.nextBtn}
        onClick={handleNext}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
      >
        {isLastStep ? 'Setup Profil' : 'Lanjut'}
        <ArrowRight size={18} strokeWidth={2.5} />
      </motion.button>

      {!isLastStep && (
        <button className={styles.skip} onClick={() => setShowSetup(true)}>
          Lewati
        </button>
      )}
    </div>
  )
}
