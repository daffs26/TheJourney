import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookMarked, Copy, Trash2, ExternalLink, Filter } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'

const TYPES = ['Jurnal', 'Buku', 'Prosiding', 'Website', 'Tesis', 'Laporan', 'Lainnya']

const FORM_DEFAULT = {
  title: '', authors: '', year: '', publisher: '', journal: '',
  volume: '', issue: '', pages: '', doi: '', url: '', type: 'Jurnal',
  courseId: '', note: ''
}

function buildAPA(e) {
  const authors = e.authors || '[Nama Penulis]'
  const year = e.year ? `(${e.year})` : '(n.d.)'
  const title = e.title || '[Judul]'
  const doi = e.doi ? ` https://doi.org/${e.doi}` : e.url ? ` ${e.url}` : ''

  if (e.type === 'Jurnal') {
    const journal = e.journal ? `*${e.journal}*` : '[Nama Jurnal]'
    const vol = e.volume ? `, *${e.volume}*` : ''
    const issue = e.issue ? `(${e.issue})` : ''
    const pages = e.pages ? `, ${e.pages}` : ''
    return `${authors} ${year}. ${title}. ${journal}${vol}${issue}${pages}.${doi}`
  }
  if (e.type === 'Buku') {
    const publisher = e.publisher ? `${e.publisher}.` : '[Penerbit].'
    return `${authors} ${year}. *${title}*. ${publisher}`
  }
  return `${authors} ${year}. ${title}.${doi}`
}

function buildIEEE(e, idx = 1) {
  const authors = e.authors || 'N. N. Penulis'
  const year = e.year || 'n.d.'
  const title = `"${e.title || 'Judul'}"`
  const doi = e.doi ? ` doi: ${e.doi}.` : e.url ? ` [Online]. Available: ${e.url}` : ''

  if (e.type === 'Jurnal') {
    const journal = e.journal ? `*${e.journal}*` : '[Nama Jurnal]'
    return `[${idx}] ${authors}, ${title}, ${journal}, vol. ${e.volume || '?'}, no. ${e.issue || '?'}, pp. ${e.pages || '?'}, ${year}.${doi}`
  }
  if (e.type === 'Buku') {
    return `[${idx}] ${authors}, *${e.title}*. ${e.publisher || '[Penerbit]'}, ${year}.`
  }
  return `[${idx}] ${authors}, ${title}, ${year}.${doi}`
}

export default function Bibliography() {
  const { addToast } = useAppStore()
  const [entries, setEntries] = useState([])
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(FORM_DEFAULT)
  const [editing, setEditing] = useState(null)
  const [typeFilter, setTypeFilter] = useState('Semua')
  const [citationStyle, setCitationStyle] = useState('APA') // APA | IEEE
  const [copyDone, setCopyDone] = useState(null)

  const load = async () => {
    const [e, c] = await Promise.all([db.bibliographies.orderBy('createdAt').reverse().toArray(), db.courses.toArray()])
    setEntries(e)
    setCourses(c)
  }

  useEffect(() => { load() }, [])

  const filtered = typeFilter === 'Semua' ? entries : entries.filter(e => e.type === typeFilter)

  const handleSave = async () => {
    if (!form.title.trim()) { addToast('Judul wajib diisi!', 'warning'); return }
    if (editing) {
      await db.bibliographies.update(editing, { ...form, updatedAt: new Date() })
      addToast('Referensi diperbarui!', 'success')
    } else {
      await db.bibliographies.add({ ...form, createdAt: new Date() })
      addToast('Referensi ditambahkan!', 'success')
    }
    setShowModal(false)
    setForm(FORM_DEFAULT)
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    await db.bibliographies.delete(id)
    addToast('Referensi dihapus', 'info')
    load()
  }

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text)
    setCopyDone(id)
    addToast('Sitasi disalin!', 'success')
    setTimeout(() => setCopyDone(null), 2000)
  }

  const handleCopyAll = async () => {
    const all = filtered.map((e, i) => citationStyle === 'APA' ? buildAPA(e) : buildIEEE(e, i + 1)).join('\n\n')
    await navigator.clipboard.writeText(all)
    addToast(`${filtered.length} sitasi ${citationStyle} disalin!`, 'success')
  }

  const handleEdit = (entry) => {
    setForm({ ...entry })
    setEditing(entry.id)
    setShowModal(true)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-h))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top,0px)) var(--space-4) var(--space-5)', background: 'linear-gradient(160deg, #1c1a3a 0%, #2e2a5a 100%)', color: 'white', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>📚 Bibliography</h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{entries.length} referensi tersimpan</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {filtered.length > 0 && (
              <button onClick={handleCopyAll}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', padding: '8px 12px', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Copy size={14} /> Semua
              </button>
            )}
            <button onClick={() => { setForm(FORM_DEFAULT); setEditing(null); setShowModal(true) }}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-12) + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>

        {/* Style & Filter row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 3, gap: 3 }}>
            {['APA', 'IEEE'].map(s => (
              <button key={s} onClick={() => setCitationStyle(s)}
                style={{ padding: '5px 14px', borderRadius: 'var(--radius-md)', border: 'none', background: citationStyle === s ? 'var(--color-primary)' : 'transparent', color: citationStyle === s ? 'white' : 'var(--color-text-sub)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 6 }}>
            {['Semua', ...TYPES].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: typeFilter === t ? 'var(--color-primary)' : 'var(--color-surface)', color: typeFilter === t ? 'white' : 'var(--color-text-sub)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all var(--transition-fast)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Reference cards */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12) var(--space-6)', textAlign: 'center', color: 'var(--color-text-sub)', gap: 'var(--space-3)' }}>
            <BookMarked size={56} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p style={{ fontWeight: 700 }}>Belum ada referensi</p>
            <button onClick={() => { setForm(FORM_DEFAULT); setEditing(null); setShowModal(true) }}
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} /> Tambah Referensi
            </button>
          </div>
        ) : filtered.map((e, i) => {
          const citation = citationStyle === 'APA' ? buildAPA(e) : buildIEEE(e, i + 1)
          return (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: '#e0e7ff', color: '#4f46e5', textTransform: 'uppercase', flexShrink: 0 }}>{e.type}</span>
                    {e.year && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{e.year}</span>}
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 'var(--font-size-xs)', lineHeight: 1.4 }}>{e.title}</p>
                  {e.authors && <p style={{ fontSize: 10, color: 'var(--color-text-sub)', marginTop: 2 }}>{e.authors}</p>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {e.doi && (
                    <a href={`https://doi.org/${e.doi}`} target="_blank" rel="noopener noreferrer"
                      style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <button onClick={() => handleEdit(e)} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(e.id)} style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', border: 'none', background: '#fee2e2', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Citation preview */}
              <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', position: 'relative' }}>
                <p style={{ fontSize: 10, fontStyle: 'italic', color: 'var(--color-text-sub)', lineHeight: 1.6, fontFamily: 'serif', paddingRight: 32 }}>
                  {citation}
                </p>
                <button onClick={() => handleCopy(citation, e.id)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 'var(--radius-md)', border: 'none', background: copyDone === e.id ? 'var(--color-success)' : 'var(--color-primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {copyDone === e.id ? '✓' : <Copy size={11} />}
                </button>
              </div>
              {e.note && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6, fontStyle: 'italic' }}>📝 {e.note}</p>}
            </motion.div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} />
            <motion.div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 'var(--space-6)', zIndex: 101, paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom,0px))', maxHeight: '90vh', overflowY: 'auto' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              <h3 style={{ fontWeight: 900, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
                {editing ? '✏️ Edit Referensi' : '➕ Tambah Referensi'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={lStyle}>Tipe Referensi</label>
                  <select style={iStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lStyle}>Judul *</label>
                  <input style={iStyle} placeholder="Judul publikasi..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label style={lStyle}>Penulis</label>
                  <input style={iStyle} placeholder="Nama, A., & Nama, B. (format APA)" value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lStyle}>Tahun</label>
                    <input type="number" style={iStyle} placeholder="2024" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lStyle}>Mata Kuliah</label>
                    <select style={iStyle} value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                      <option value="">Umum</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                {(form.type === 'Jurnal' || form.type === 'Prosiding') && (
                  <>
                    <div>
                      <label style={lStyle}>Nama Jurnal/Prosiding</label>
                      <input style={iStyle} placeholder="Nama jurnal..." value={form.journal} onChange={e => setForm(f => ({ ...f, journal: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                      <div>
                        <label style={lStyle}>Volume</label>
                        <input style={iStyle} placeholder="Vol" value={form.volume} onChange={e => setForm(f => ({ ...f, volume: e.target.value }))} />
                      </div>
                      <div>
                        <label style={lStyle}>Issue</label>
                        <input style={iStyle} placeholder="No" value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} />
                      </div>
                      <div>
                        <label style={lStyle}>Halaman</label>
                        <input style={iStyle} placeholder="1-20" value={form.pages} onChange={e => setForm(f => ({ ...f, pages: e.target.value }))} />
                      </div>
                    </div>
                  </>
                )}
                {form.type === 'Buku' && (
                  <div>
                    <label style={lStyle}>Penerbit</label>
                    <input style={iStyle} placeholder="Nama penerbit..." value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={lStyle}>DOI</label>
                  <input style={iStyle} placeholder="10.xxxx/xxxxx" value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} />
                </div>
                <div>
                  <label style={lStyle}>URL</label>
                  <input style={iStyle} placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                </div>
                <div>
                  <label style={lStyle}>Catatan</label>
                  <input style={iStyle} placeholder="Catatan opsional..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>

                {/* Live citation preview */}
                {form.title && (
                  <div style={{ background: '#eff6ff', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', border: '1px solid #bfdbfe' }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4 }}>Preview {citationStyle}</p>
                    <p style={{ fontSize: 10, fontStyle: 'italic', color: '#1e40af', lineHeight: 1.6, fontFamily: 'serif' }}>
                      {citationStyle === 'APA' ? buildAPA(form) : buildIEEE(form)}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 'var(--space-4)' }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSave}
                  style={{ flex: 2, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const lStyle = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }
const iStyle = { width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }
