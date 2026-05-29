import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, RotateCcw, Maximize2, Minimize2,
  Coffee, Brain, CheckCircle2, Settings as SettingsIcon, X
} from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'
import styles from './Pomodoro.module.css'

const MODES = [
  { id: 'focus',  label: '🍅 Fokus',        defaultMin: 25, color: '#6366f1' },
  { id: 'short',  label: '☕ Istirahat',     defaultMin: 5,  color: '#10b981' },
  { id: 'long',   label: '🌙 Istirahat Panjang', defaultMin: 15, color: '#3b82f6' },
]

const RADIUS = 90
const CIRC = 2 * Math.PI * RADIUS

function fmt(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Pomodoro() {
  const { addToast } = useAppStore()

  // Settings
  const [settings, setSettings] = useState({
    focusMin: 25, shortMin: 5, longMin: 15, sessionsBeforeLong: 4
  })
  const [showSettings, setShowSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)

  // Timer state
  const [mode, setMode] = useState('focus')
  const [seconds, setSeconds] = useState(settings.focusMin * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0) // completed focus sessions today
  const [sessionsDone, setSessionsDone] = useState(0) // in current cycle
  const [focusMode, setFocusMode] = useState(false) // fullscreen focus
  const [task, setTask] = useState('')
  const [todaySessions, setTodaySessions] = useState([])

  const intervalRef = useRef(null)
  const startRef = useRef(null)
  const initialRef = useRef(settings.focusMin * 60)

  // Load today's sessions from DB
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    db.pomodoroSessions.where('date').equals(today).toArray().then(rows => {
      setTodaySessions(rows)
      const focusDone = rows.filter(r => r.type === 'focus').length
      setSessions(focusDone)
    })
  }, [])

  // Update seconds when mode/settings change
  useEffect(() => {
    const map = { focus: settings.focusMin, short: settings.shortMin, long: settings.longMin }
    const newSec = (map[mode] || 25) * 60
    setSeconds(newSec)
    initialRef.current = newSec
    setRunning(false)
    clearInterval(intervalRef.current)
  }, [mode, settings])

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current)
        setRunning(false)
        handleComplete()
        return 0
      }
      return prev - 1
    })
  }, [mode, sessions, sessionsDone])

  function handleComplete() {
    const type = mode
    const today = new Date().toISOString().slice(0, 10)
    const dur = mode === 'focus' ? settings.focusMin : mode === 'short' ? settings.shortMin : settings.longMin

    db.pomodoroSessions.add({ type, duration: dur, completedAt: new Date(), date: today })
    addToast(type === 'focus' ? '🍅 Sesi fokus selesai! Waktunya istirahat.' : '✅ Istirahat selesai! Siap fokus lagi.', 'success')

    if (type === 'focus') {
      const newDone = sessionsDone + 1
      setSessions(s => s + 1)
      setTodaySessions(prev => [...prev, { type, duration: dur }])
      if (newDone >= settings.sessionsBeforeLong) {
        setSessionsDone(0)
        setMode('long')
      } else {
        setSessionsDone(newDone)
        setMode('short')
      }
    } else {
      setMode('focus')
    }

    // Vibrate if available
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  }

  const handlePlay = () => {
    if (running) {
      clearInterval(intervalRef.current)
      setRunning(false)
    } else {
      intervalRef.current = setInterval(tick, 1000)
      setRunning(true)
    }
  }

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    const map = { focus: settings.focusMin, short: settings.shortMin, long: settings.longMin }
    const newSec = (map[mode] || 25) * 60
    setSeconds(newSec)
    initialRef.current = newSec
  }

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const currentMode = MODES.find(m => m.id === mode)
  const fraction = seconds / initialRef.current
  const arcLen = CIRC * fraction
  const todayFocus = todaySessions.filter(s => s.type === 'focus').length
  const todayMins = todaySessions.filter(s => s.type === 'focus').reduce((a, s) => a + (s.duration || 25), 0)

  // Session dots for current cycle
  const cycleDots = Array.from({ length: settings.sessionsBeforeLong }, (_, i) => i < sessionsDone)

  function saveSettings() {
    setSettings(tempSettings)
    setShowSettings(false)
    addToast('Pengaturan disimpan!', 'success')
  }

  const TimerContent = ({ dark = false }) => (
    <>
      {/* Mode Selector */}
      <div className={styles.modeSelector} style={dark ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' } : {}}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={`${styles.modeBtn} ${mode === m.id ? styles.modeBtnActive : ''}`}
            style={dark && mode === m.id ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : dark ? { color: 'rgba(255,255,255,0.6)' } : {}}
            onClick={() => { if (!running) setMode(m.id) }}
          >{m.label}</button>
        ))}
      </div>

      {/* Ring Timer */}
      <div className={styles.timerContainer}>
        <svg className={styles.timerSvg} viewBox="0 0 200 200">
          <circle className={styles.timerBg} cx="100" cy="100" r={RADIUS} />
          <circle
            className={styles.timerArc}
            cx="100" cy="100" r={RADIUS}
            stroke={currentMode.color}
            strokeDasharray={`${arcLen} ${CIRC - arcLen}`}
            strokeDashoffset="0"
          />
        </svg>
        <div className={styles.timerCenter}>
          <div className={`${styles.timerTime} ${dark ? styles.timerTimeDark : ''}`}>{fmt(seconds)}</div>
          <div className={`${styles.timerLabel} ${dark ? styles.timerLabelDark : ''}`}>{currentMode.label}</div>
        </div>
      </div>

      {/* Session dots */}
      <div className={styles.sessions}>
        {cycleDots.map((done, i) => (
          <div key={i} className={`${styles.sessionDot} ${done ? (dark ? styles.sessionDotDoneDark : styles.sessionDotDone) : ''}`} />
        ))}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.ctrlBtn} onClick={handleReset} style={dark ? { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}>
          <RotateCcw size={20} />
        </button>
        <button className={styles.playBtn} onClick={handlePlay} style={{ background: `linear-gradient(135deg, ${currentMode.color}, ${currentMode.color}aa)` }}>
          {running ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button
          className={styles.ctrlBtn}
          onClick={() => setFocusMode(v => !v)}
          style={dark ? { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white' } : {}}
        >
          {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
    </>
  )

  return (
    <div className={styles.page}>
      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            className={styles.focusMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className={styles.focusModeClose} onClick={() => setFocusMode(false)}>
              <X size={20} />
            </button>
            {task && (
              <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', textAlign: 'center', maxWidth: '80%' }}>
                🎯 {task}
              </p>
            )}
            <TimerContent dark />
            <button className={styles.focusBtn} onClick={handlePlay}>
              {running ? <><Pause size={16} /> Jeda</> : <><Play size={16} /> Mulai</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.title}>🍅 Pomodoro</h1>
            <p className={styles.subtitle}>Teknik fokus 25 menit untuk produktivitas maksimal</p>
          </div>
          <button onClick={() => { setTempSettings(settings); setShowSettings(true) }}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Focus task */}
        <div className={styles.focusTaskBox} style={{ width: '100%' }}>
          <p style={{ fontSize: '10px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Sedang mengerjakan:</p>
          <input
            className={styles.focusTaskInput}
            placeholder="Ketik nama tugas yang sedang kamu kerjakan..."
            value={task}
            onChange={e => setTask(e.target.value)}
          />
        </div>

        <TimerContent />

        {/* Today's stats */}
        <div className={styles.historyCard}>
          <div className={styles.historyTitle}>
            <span>Statistik Hari Ini</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className={styles.historyStats}>
            <div className={styles.histStat}>
              <div className={styles.histStatNum}>{todayFocus}</div>
              <div className={styles.histStatLbl}>Sesi Fokus</div>
            </div>
            <div className={styles.histStat}>
              <div className={styles.histStatNum}>{todayMins}</div>
              <div className={styles.histStatLbl}>Menit Fokus</div>
            </div>
            <div className={styles.histStat}>
              <div className={styles.histStatNum}>{Math.floor(todayFocus / settings.sessionsBeforeLong)}</div>
              <div className={styles.histStatLbl}>Siklus Penuh</div>
            </div>
          </div>

          {/* Mini session list */}
          {todaySessions.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {todaySessions.slice(-16).map((s, i) => (
                <div key={i} style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: s.type === 'focus' ? 'var(--color-primary)' : 'var(--color-success)',
                  opacity: 0.8, title: s.type
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)} />
            <motion.div
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 'var(--space-6)', zIndex: 101, paddingBottom: 'calc(var(--space-8) + env(safe-area-inset-bottom, 0px))' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <h3 style={{ fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', color: 'var(--color-text)' }}>
                ⚙️ Pengaturan Timer
              </h3>
              <div className={styles.settingsCard} style={{ border: 'none', padding: 0, marginBottom: 'var(--space-4)' }}>
                {[
                  ['focusMin', '🍅 Durasi Fokus (menit)', 1, 60],
                  ['shortMin', '☕ Istirahat Pendek (menit)', 1, 30],
                  ['longMin', '🌙 Istirahat Panjang (menit)', 5, 60],
                  ['sessionsBeforeLong', '🔁 Sesi sebelum istirahat panjang', 1, 8],
                ].map(([key, label, min, max]) => (
                  <div key={key} className={styles.settingRow}>
                    <span className={styles.settingLabel}>{label}</span>
                    <input
                      type="number" min={min} max={max}
                      className={styles.settingInput}
                      value={tempSettings[key]}
                      onChange={e => setTempSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
              <button onClick={saveSettings}
                style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                Simpan Pengaturan
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
