import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, Calendar, Heart } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'

const MOODS = [
  { value: 5, emoji: '😄', label: 'Luar Biasa', color: '#10b981', bg: '#d1fae5' },
  { value: 4, emoji: '🙂', label: 'Baik',       color: '#3b82f6', bg: '#dbeafe' },
  { value: 3, emoji: '😐', label: 'Biasa',      color: '#f59e0b', bg: '#fef3c7' },
  { value: 2, emoji: '😔', label: 'Kurang',     color: '#f97316', bg: '#ffedd5' },
  { value: 1, emoji: '😢', label: 'Buruk',      color: '#ef4444', bg: '#fee2e2' },
]

const ENERGY_LABELS = ['', 'Sangat Lelah', 'Lelah', 'Normal', 'Bersemangat', 'Sangat Berenergi']

const TAGS = ['😴 Kurang Tidur', '📚 Belajar Keras', '💪 Olahraga', '🍕 Makan Enak', '😰 Stres', '🎮 Hiburan', '👥 Bersosialisasi', '🌧 Cuaca Buruk', '☀️ Cuaca Cerah', '💊 Sakit']

function getMood(value) { return MOODS.find(m => m.value === value) || MOODS[2] }

function weekDates() {
  const dates = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

export default function MoodTracker() {
  const { addToast } = useAppStore()
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ mood: 3, energy: 3, note: '', tags: [] })
  const [view, setView] = useState('today') // today | history

  const load = async () => {
    const rows = await db.moodEntries.orderBy('createdAt').reverse().toArray()
    setEntries(rows)
  }

  useEffect(() => { load() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find(e => e.date === today)
  const last7 = weekDates()
  const moodMap = Object.fromEntries(entries.map(e => [e.date, e]))

  const avgMood = entries.length > 0
    ? (entries.slice(0, 7).reduce((a, e) => a + (e.mood || 3), 0) / Math.min(entries.length, 7)).toFixed(1)
    : '—'

  const toggleTag = (tag) => setForm(f => ({
    ...f,
    tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
  }))

  const handleSave = async () => {
    const data = { ...form, date: today, createdAt: new Date() }
    if (todayEntry) {
      await db.moodEntries.update(todayEntry.id, data)
      addToast('Mood diperbarui!', 'success')
    } else {
      await db.moodEntries.add(data)
      addToast('Mood dicatat!', 'success')
    }
    setShowModal(false)
    load()
  }

  const selectedMood = getMood(form.mood)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-h))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top,0px)) var(--space-4) var(--space-5)', background: 'linear-gradient(160deg, #3b1a6e 0%, #5b2d8e 100%)', color: 'white', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>💜 Mood & Wellbeing</h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Pantau kesehatan mentalmu setiap hari</p>
          </div>
          <button onClick={() => { setForm(todayEntry ? { mood: todayEntry.mood, energy: todayEntry.energy, note: todayEntry.note || '', tags: todayEntry.tags || [] } : { mood: 3, energy: 3, note: '', tags: [] }); setShowModal(true) }}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            {todayEntry ? '✏️' : <Plus size={20} />}
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', padding: '8px 14px' }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{avgMood}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Rata-rata 7 Hari</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-lg)', padding: '8px 14px' }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{entries.length}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Total Entri</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-12) + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Tab */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[['today', '📅 Hari Ini'], ['history', '📊 Riwayat']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: view === v ? 'var(--color-primary)' : 'var(--color-surface)', color: view === v ? 'white' : 'var(--color-text-sub)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
              {l}
            </button>
          ))}
        </div>

        {view === 'today' ? (
          <>
            {/* Today's mood card */}
            {todayEntry ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', border: `2px solid ${getMood(todayEntry.mood).color}`, boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 8 }}>{getMood(todayEntry.mood).emoji}</div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900, color: getMood(todayEntry.mood).color }}>{getMood(todayEntry.mood).label}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-sub)', marginTop: 4 }}>Energi: {ENERGY_LABELS[todayEntry.energy] || '—'}</div>
                {todayEntry.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                    {todayEntry.tags.map(t => (
                      <span key={t} style={{ background: getMood(todayEntry.mood).bg, color: getMood(todayEntry.mood).color, padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}
                {todayEntry.note && <p style={{ marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-sub)', fontStyle: 'italic' }}>"{todayEntry.note}"</p>}
                <button onClick={() => { setForm({ mood: todayEntry.mood, energy: todayEntry.energy, note: todayEntry.note || '', tags: todayEntry.tags || [] }); setShowModal(true) }}
                  style={{ marginTop: 16, padding: '8px 20px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-sub)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}>
                  Edit Mood
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', border: '2px dashed var(--color-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: 56 }}>🌟</div>
                <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>Bagaimana perasaanmu hari ini?</p>
                <button onClick={() => setShowModal(true)}
                  style={{ padding: '10px 28px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={16} /> Catat Mood
                </button>
              </motion.div>
            )}

            {/* 7-day mood strip */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
              <p style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>7 Hari Terakhir</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {last7.map(date => {
                  const entry = moodMap[date]
                  const isToday = date === today
                  const dayName = new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })
                  const mood = entry ? getMood(entry.mood) : null
                  return (
                    <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-md)', background: mood ? mood.bg : 'var(--color-surface-2)', border: `2px solid ${isToday ? 'var(--color-primary)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {mood ? mood.emoji : ''}
                      </div>
                      <span style={{ fontSize: 9, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: isToday ? 700 : 400 }}>{dayName}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* History view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-sub)' }}>
                <Heart size={48} strokeWidth={1} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>Belum ada riwayat mood</p>
              </div>
            ) : entries.map(e => {
              const mood = getMood(e.mood)
              return (
                <motion.div key={e.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ fontSize: 28 }}>{mood.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: mood.color, fontSize: 'var(--font-size-sm)' }}>{mood.label}</p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                      {new Date(e.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                      {e.energy ? ` · Energi: ${ENERGY_LABELS[e.energy]}` : ''}
                    </p>
                    {e.note && <p style={{ fontSize: 11, color: 'var(--color-text-sub)', marginTop: 2, fontStyle: 'italic' }}>"{e.note}"</p>}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} />
            <motion.div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 'var(--space-6)', zIndex: 101, paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom,0px))', maxHeight: '85vh', overflowY: 'auto' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              <h3 style={{ fontWeight: 900, fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', marginBottom: 'var(--space-5)', textAlign: 'center' }}>
                {todayEntry ? 'Update Mood Hari Ini' : 'Bagaimana perasaanmu? 💜'}
              </h3>

              {/* Mood selector */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 'var(--space-5)' }}>
                {MOODS.map(m => (
                  <button key={m.value} onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--radius-lg)', transition: 'all var(--transition-fast)', transform: form.mood === m.value ? 'scale(1.2)' : 'scale(1)', background: form.mood === m.value ? m.bg : 'transparent' }}>
                    <span style={{ fontSize: 32 }}>{m.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: form.mood === m.value ? m.color : 'var(--color-text-muted)' }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Energy slider */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 8 }}>
                  ⚡ Tingkat Energi: <span style={{ color: selectedMood.color }}>{ENERGY_LABELS[form.energy]}</span>
                </label>
                <input type="range" min="1" max="5" value={form.energy}
                  onChange={e => setForm(f => ({ ...f, energy: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: selectedMood.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  <span>Sangat Lelah</span><span>Sangat Berenergi</span>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 8 }}>🏷 Faktor (pilih yang relevan)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TAGS.map(tag => {
                    const selected = form.tags.includes(tag)
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${selected ? selectedMood.color : 'var(--color-border)'}`, background: selected ? selectedMood.bg : 'transparent', color: selected ? selectedMood.color : 'var(--color-text-sub)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition-fast)' }}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 6 }}>💬 Catatan (opsional)</label>
                <textarea rows={2} placeholder="Apa yang ada di pikiranmu hari ini?"
                  style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', resize: 'none', boxSizing: 'border-box' }}
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>

              <button onClick={handleSave}
                style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: 'none', background: `linear-gradient(135deg, ${selectedMood.color}, ${selectedMood.color}aa)`, color: 'white', fontWeight: 700, fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                {todayEntry ? 'Update Mood' : 'Simpan Mood'} {selectedMood.emoji}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
