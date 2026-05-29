import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Play, RotateCcw, Trash2, BookOpen, CheckCircle2, X } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'
import styles from './Flashcard.module.css'

// ── SM-2 Algorithm ────────────────────────────────────────────────
function sm2(card, rating) {
  // rating: 0=Again, 1=Hard, 2=Good, 3=Easy
  const q = [0, 1, 3, 5][rating] // quality 0-5
  let { interval = 1, repetitions = 0, easeFactor = 2.5 } = card

  if (q < 3) {
    repetitions = 0
    interval = 1
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.round(interval * easeFactor)
    repetitions += 1
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { interval, repetitions, easeFactor, nextReview: nextReview.toISOString() }
}

// ── Rating Config ────────────────────────────────────────────────
const RATINGS = [
  { label: 'Lagi', emoji: '😰', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { label: 'Susah', emoji: '😅', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  { label: 'OK', emoji: '🙂', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { label: 'Mudah', emoji: '😄', color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
]

function isDue(card) {
  if (!card.nextReview) return true
  return new Date(card.nextReview) <= new Date()
}

// ── Deck Card ─────────────────────────────────────────────────────
function DeckCard({ deck, cards, onClick }) {
  const total = cards.length
  const due = cards.filter(isDue).length

  return (
    <motion.div
      className={styles.deckCard}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className={styles.deckEmoji}>📚</div>
      <div className={styles.deckInfo}>
        <div className={styles.deckName}>{deck.name}</div>
        <div className={styles.deckMeta}>{total} kartu{deck.description ? ` · ${deck.description}` : ''}</div>
      </div>
      {due > 0 && <div className={styles.deckDue}>{due} kartu</div>}
    </motion.div>
  )
}

// ── Study View ────────────────────────────────────────────────────
function StudyView({ deck, cards, onBack, onUpdate }) {
  const dueCards = cards.filter(isDue)
  const [queue, setQueue] = useState([...dueCards])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ again: 0, hard: 0, ok: 0, easy: 0 })

  const card = queue[current]

  async function rate(ratingIdx) {
    if (!card) return
    const updated = sm2(card, ratingIdx)
    await db.flashcards.update(card.id, updated)
    const statKeys = ['again', 'hard', 'ok', 'easy']
    setStats(s => ({ ...s, [statKeys[ratingIdx]]: s[statKeys[ratingIdx]] + 1 }))

    if (ratingIdx === 0) {
      // Put card at end of queue (again)
      setQueue(q => {
        const newQ = [...q]
        const [moved] = newQ.splice(current, 1)
        newQ.push({ ...moved, ...updated })
        return newQ
      })
      setFlipped(false)
    } else {
      if (current + 1 >= queue.length - (ratingIdx === 0 ? 0 : 0)) {
        setDone(true)
      } else {
        setCurrent(c => c + 1)
        setFlipped(false)
      }
      if (current + 1 >= queue.length) setDone(true)
    }
    onUpdate()
  }

  if (done || queue.length === 0) {
    return (
      <div className={styles.doneBanner}>
        <CheckCircle2 size={64} color="var(--color-success)" strokeWidth={1.5} />
        <h2 style={{ fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-text)' }}>Sesi Selesai! 🎉</h2>
        <p style={{ color: 'var(--color-text-sub)', fontSize: 'var(--font-size-sm)' }}>
          {dueCards.length === 0
            ? 'Tidak ada kartu yang perlu diulang hari ini.'
            : `Kamu mereview ${dueCards.length} kartu.`}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {RATINGS.map((r, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{r.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: r.color }}>{Object.values(stats)[i]}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{r.label}</div>
            </div>
          ))}
        </div>
        <button onClick={onBack} style={{ padding: '10px 28px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer' }}>
          Kembali ke Deck
        </button>
      </div>
    )
  }

  const progressPct = (current / queue.length) * 100

  return (
    <div className={styles.studyView}>
      {/* Header */}
      <div className={styles.studyHeader}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--color-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-sm)' }}>
          <ArrowLeft size={16} /> {deck.name}
        </button>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {current + 1} / {queue.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className={styles.studyProgress}>
        <div className={styles.studyProgressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {/* Flip card */}
      <div className={styles.cardScene} onClick={() => setFlipped(f => !f)}>
        <div className={`${styles.cardInner} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.cardFace + ' ' + styles.cardFront}>
            <div className={styles.cardHint}>Pertanyaan</div>
            <div className={styles.cardText}>{card?.front}</div>
            {!flipped && (
              <div style={{ marginTop: 'auto', fontSize: '11px', opacity: 0.6, marginTop: 24 }}>Tap untuk lihat jawaban</div>
            )}
          </div>
          <div className={styles.cardFace + ' ' + styles.cardBack}>
            <div className={styles.cardHint} style={{ color: 'var(--color-primary)' }}>Jawaban</div>
            <div className={`${styles.cardText} ${styles.cardTextBack}`}>{card?.back}</div>
          </div>
        </div>
      </div>

      {/* Rating buttons - only show if flipped */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            className={styles.ratingRow}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {RATINGS.map((r, i) => (
              <button
                key={i}
                className={styles.rateBtn}
                style={{ background: r.bg, borderColor: r.border, color: r.color }}
                onClick={() => rate(i)}
              >
                <span style={{ fontSize: 20 }}>{r.emoji}</span>
                <span className={styles.rateLabel}>{r.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Ingat dulu jawabannya, lalu tap kartu
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function Flashcard() {
  const { addToast } = useAppStore()
  const [decks, setDecks] = useState([])
  const [cards, setCards] = useState([]) // all cards
  const [view, setView] = useState('list') // list | deck | study
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [deckCards, setDeckCards] = useState([])
  const [tab, setTab] = useState('cards') // cards | study
  const [showDeckModal, setShowDeckModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [deckForm, setDeckForm] = useState({ name: '', description: '' })
  const [cardForm, setCardForm] = useState({ front: '', back: '' })

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([db.decks.toArray(), db.flashcards.toArray()])
    setDecks(d)
    setCards(c)
  }, [])

  useEffect(() => { load() }, [])

  const openDeck = async (deck) => {
    setSelectedDeck(deck)
    const dc = cards.filter(c => c.deckId === deck.id)
    setDeckCards(dc)
    setView('deck')
    setTab('cards')
  }

  const addDeck = async () => {
    if (!deckForm.name.trim()) { addToast('Nama deck wajib diisi!', 'warning'); return }
    await db.decks.add({ ...deckForm, createdAt: new Date() })
    addToast('Deck ditambahkan!', 'success')
    setDeckForm({ name: '', description: '' })
    setShowDeckModal(false)
    await load()
  }

  const addCard = async () => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      addToast('Depan dan belakang kartu wajib diisi!', 'warning'); return
    }
    await db.flashcards.add({
      deckId: selectedDeck.id, ...cardForm,
      interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: null,
      createdAt: new Date()
    })
    addToast('Kartu ditambahkan!', 'success')
    setCardForm({ front: '', back: '' })
    setShowCardModal(false)
    await load()
    const dc = await db.flashcards.where('deckId').equals(selectedDeck.id).toArray()
    setDeckCards(dc)
  }

  const deleteCard = async (id) => {
    await db.flashcards.delete(id)
    await load()
    const dc = await db.flashcards.where('deckId').equals(selectedDeck.id).toArray()
    setDeckCards(dc)
    addToast('Kartu dihapus', 'info')
  }

  const deleteDeck = async (deckId) => {
    await db.flashcards.where('deckId').equals(deckId).delete()
    await db.decks.delete(deckId)
    setView('list')
    await load()
    addToast('Deck dihapus', 'info')
  }

  // ── Study view
  if (view === 'study' && selectedDeck) {
    return (
      <div className={styles.page}>
        <StudyView
          deck={selectedDeck}
          cards={deckCards}
          onBack={() => { setView('deck'); load() }}
          onUpdate={load}
        />
      </div>
    )
  }

  // ── Deck detail view
  if (view === 'deck' && selectedDeck) {
    const due = deckCards.filter(isDue).length
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <button onClick={() => setView('list')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginBottom: 4 }}>
                <ArrowLeft size={14} /> Semua Deck
              </button>
              <h1 className={styles.title}>{selectedDeck.name}</h1>
              <p className={styles.subtitle}>{deckCards.length} kartu · {due} due hari ini</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={styles.iconBtn} onClick={() => deleteDeck(selectedDeck.id)}
                style={{ background: 'rgba(239,68,68,0.25)' }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.tabRow}>
            <button className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`} onClick={() => setTab('cards')}>
              📚 Kartu ({deckCards.length})
            </button>
            <button className={`${styles.tab} ${tab === 'study' ? styles.tabActive : ''}`} onClick={() => setTab('study')}>
              🎯 Belajar {due > 0 && `(${due})`}
            </button>
          </div>

          {tab === 'study' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', paddingTop: 'var(--space-6)' }}>
              <div style={{ fontSize: 48 }}>🎯</div>
              <h3 style={{ fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-text)', textAlign: 'center' }}>
                {due > 0 ? `${due} kartu siap diulang!` : 'Tidak ada kartu yang due hari ini 🎉'}
              </h3>
              {deckCards.length > 0 && (
                <button onClick={() => setView('study')}
                  style={{ padding: '12px 32px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-sm)' }}>
                  <Play size={16} /> {due > 0 ? 'Mulai Review' : 'Review Semua'}
                </button>
              )}
            </div>
          ) : (
            <div className={styles.cardList}>
              {deckCards.map(card => (
                <div key={card.id} className={styles.cardItem}>
                  <div className={styles.cardItemFront}>{card.front}</div>
                  <div className={styles.cardItemBack}>{card.back}</div>
                  {isDue(card) && <span className={styles.dueLabel}>Due</span>}
                  <button className={styles.deleteBtn} onClick={() => deleteCard(card.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className={styles.addCardBtn} onClick={() => setShowCardModal(true)}>
                <Plus size={16} /> Tambah Kartu
              </button>
            </div>
          )}
        </div>

        {/* Add Card Modal */}
        <AnimatePresence>
          {showCardModal && (
            <>
              <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCardModal(false)} />
              <motion.div className={styles.modal} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
                <h3 className={styles.modalTitle}>Tambah Flashcard</h3>
                <div className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Pertanyaan / Depan *</label>
                    <textarea className={styles.textarea} rows={3} placeholder="Tulis pertanyaan atau konsep..."
                      value={cardForm.front} onChange={e => setCardForm(f => ({ ...f, front: e.target.value }))} autoFocus />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Jawaban / Belakang *</label>
                    <textarea className={styles.textarea} rows={3} placeholder="Tulis jawaban atau penjelasan..."
                      value={cardForm.back} onChange={e => setCardForm(f => ({ ...f, back: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowCardModal(false)}>Batal</button>
                  <button className={styles.saveBtn} onClick={addCard}>Tambah Kartu</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Deck list view
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>🧠 Flashcard</h1>
            <p className={styles.subtitle}>Belajar dengan Spaced Repetition (SM-2)</p>
          </div>
          <button className={styles.iconBtn} onClick={() => setShowDeckModal(true)}>
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {decks.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={56} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Belum ada deck</p>
            <p style={{ fontSize: 'var(--font-size-xs)' }}>Buat deck pertamamu untuk mulai belajar dengan spaced repetition</p>
            <button onClick={() => setShowDeckModal(true)}
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'var(--font-weight-bold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Buat Deck
            </button>
          </div>
        ) : (
          <div className={styles.deckList}>
            {decks.map(deck => (
              <DeckCard
                key={deck.id}
                deck={deck}
                cards={cards.filter(c => c.deckId === deck.id)}
                onClick={() => openDeck(deck)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Deck Modal */}
      <AnimatePresence>
        {showDeckModal && (
          <>
            <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeckModal(false)} />
            <motion.div className={styles.modal} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              <h3 className={styles.modalTitle}>Buat Deck Baru</h3>
              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nama Deck *</label>
                  <input className={styles.input} placeholder="Contoh: Algoritma, Basis Data..."
                    value={deckForm.name} onChange={e => setDeckForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Deskripsi (opsional)</label>
                  <input className={styles.input} placeholder="Deskripsi singkat..."
                    value={deckForm.description} onChange={e => setDeckForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowDeckModal(false)}>Batal</button>
                <button className={styles.saveBtn} onClick={addDeck}>Buat Deck</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
