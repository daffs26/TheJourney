import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Copy, Download, Trash2, Eye, X } from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'

// Built-in templates
const BUILTIN_TEMPLATES = [
  {
    id: 'bi-1', name: 'Laporan Praktikum', type: 'built-in', category: 'Praktikum',
    content: `LAPORAN PRAKTIKUM
[Nama Mata Kuliah]

Disusun oleh:
Nama    : [Nama Lengkap]
NIM     : [NIM]
Kelas   : [Kelas]
Tanggal : [Tanggal]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I. TUJUAN PRAKTIKUM
[Tuliskan tujuan praktikum di sini]

II. DASAR TEORI
[Tuliskan dasar teori yang relevan di sini]

III. ALAT DAN BAHAN
1. [Alat/Bahan 1]
2. [Alat/Bahan 2]
3. [Alat/Bahan 3]

IV. LANGKAH KERJA
1. [Langkah pertama]
2. [Langkah kedua]
3. [Langkah ketiga]

V. HASIL DAN PEMBAHASAN
A. Hasil
[Tuliskan hasil praktikum di sini, bisa termasuk tabel atau gambar]

B. Pembahasan
[Analisis dan jelaskan hasil yang diperoleh]

VI. KESIMPULAN
[Tuliskan kesimpulan dari praktikum]

VII. DAFTAR PUSTAKA
[1] [Penulis]. ([Tahun]). [Judul]. [Penerbit/Jurnal].`
  },
  {
    id: 'bi-2', name: 'Makalah Akademik', type: 'built-in', category: 'Makalah',
    content: `MAKALAH
[JUDUL MAKALAH]

Disusun untuk memenuhi tugas mata kuliah [Nama Mata Kuliah]

Disusun oleh:
[Nama Lengkap] — [NIM]

Program Studi [Prodi]
Fakultas [Fakultas]
[Nama Universitas]
[Tahun]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KATA PENGANTAR

Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa, atas rahmat dan hidayah-Nya sehingga penulis dapat menyelesaikan makalah berjudul "[Judul]" ini dengan baik.

Makalah ini disusun untuk memenuhi tugas mata kuliah [Mata Kuliah]. Penulis berharap makalah ini dapat bermanfaat bagi pembaca.

[Kota], [Tanggal]

Penulis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DAFTAR ISI
I.   Pendahuluan ........ 1
II.  Tinjauan Pustaka ... 2
III. Pembahasan ......... 3
IV.  Kesimpulan ......... 5
     Daftar Pustaka ..... 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB I — PENDAHULUAN

A. Latar Belakang
[Uraikan konteks dan alasan pemilihan topik]

B. Rumusan Masalah
1. [Pertanyaan penelitian pertama]
2. [Pertanyaan penelitian kedua]

C. Tujuan Penulisan
1. [Tujuan pertama]
2. [Tujuan kedua]

D. Manfaat Penulisan
[Uraikan manfaat teoritis dan praktis]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB II — TINJAUAN PUSTAKA

[Uraikan teori-teori yang relevan dengan topik]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB III — PEMBAHASAN

[Analisis dan bahas topik secara mendalam]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB IV — PENUTUP

A. Kesimpulan
[Tuliskan kesimpulan]

B. Saran
[Tuliskan saran]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DAFTAR PUSTAKA

[1] [Nama Belakang], [Inisial Nama Depan]. ([Tahun]). [Judul Buku]. [Kota]: [Penerbit].
[2] [Nama Belakang], [Inisial]. ([Tahun]). [Judul Artikel]. [Nama Jurnal], [Volume]([Issue]), [Halaman]. https://doi.org/[doi]`
  },
  {
    id: 'bi-3', name: 'Proposal Penelitian', type: 'built-in', category: 'Proposal',
    content: `PROPOSAL PENELITIAN

Judul    : [Judul Penelitian]
Nama     : [Nama Peneliti]
NIM      : [NIM]
Prodi    : [Program Studi]
Semester : [Semester]
Tahun    : [Tahun Akademik]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. LATAR BELAKANG MASALAH
[Uraikan konteks, masalah, dan urgensi penelitian]

B. IDENTIFIKASI MASALAH
1. [Masalah 1]
2. [Masalah 2]

C. RUMUSAN MASALAH
1. [Pertanyaan penelitian 1]
2. [Pertanyaan penelitian 2]

D. TUJUAN PENELITIAN
1. [Tujuan 1]
2. [Tujuan 2]

E. MANFAAT PENELITIAN
1. Manfaat Teoritis: [...]
2. Manfaat Praktis: [...]

F. TINJAUAN PUSTAKA
[Rangkuman teori dan penelitian terdahulu]

G. METODOLOGI PENELITIAN
1. Jenis Penelitian    : [Kualitatif/Kuantitatif/Mixed]
2. Subjek Penelitian   : [Populasi/Sampel]
3. Teknik Pengumpulan  : [Observasi/Wawancara/Kuesioner]
4. Analisis Data       : [Teknik analisis yang digunakan]

H. JADWAL PENELITIAN
[Tabel timeline penelitian]

I. DAFTAR PUSTAKA
[1] [Referensi APA format]`
  },
  {
    id: 'bi-4', name: 'Laporan KKN/PKL', type: 'built-in', category: 'Laporan',
    content: `LAPORAN KKN/PKL
[Nama Instansi/Lembaga]

Periode: [Tanggal Mulai] — [Tanggal Selesai]

Disusun oleh:
Nama    : [Nama Lengkap]
NIM     : [NIM]
Prodi   : [Program Studi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB I — PENDAHULUAN

A. Latar Belakang
[Latar belakang pelaksanaan KKN/PKL]

B. Tujuan
[Tujuan pelaksanaan KKN/PKL]

C. Waktu dan Tempat
Waktu  : [Tanggal Pelaksanaan]
Tempat : [Nama dan Alamat Instansi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB II — GAMBARAN UMUM INSTANSI

A. Sejarah Singkat
[Sejarah dan profil instansi]

B. Visi dan Misi
[Visi dan misi instansi]

C. Struktur Organisasi
[Deskripsi struktur organisasi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB III — PELAKSANAAN KEGIATAN

A. Jadwal Kegiatan
[Tabel jadwal kegiatan harian/mingguan]

B. Uraian Kegiatan
[Deskripsi detail kegiatan yang dilakukan]

C. Kendala dan Solusi
[Kendala yang dihadapi dan solusinya]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BAB IV — PENUTUP

A. Kesimpulan
[Kesimpulan pelaksanaan KKN/PKL]

B. Saran
[Saran untuk instansi dan program studi]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAMPIRAN
- Daftar Hadir
- Dokumentasi Foto
- Surat Keterangan`
  },
]

const CATEGORIES = ['Semua', 'Praktikum', 'Makalah', 'Proposal', 'Laporan', 'Kustom']

export default function Templates() {
  const { addToast } = useAppStore()
  const [customTemplates, setCustomTemplates] = useState([])
  const [catFilter, setCatFilter] = useState('Semua')
  const [preview, setPreview] = useState(null) // template being previewed
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Kustom', content: '' })
  const [copyDone, setCopyDone] = useState(null)

  const load = async () => {
    const rows = await db.reportTemplates.toArray()
    setCustomTemplates(rows)
  }

  useEffect(() => { load() }, [])

  const allTemplates = [
    ...BUILTIN_TEMPLATES,
    ...customTemplates.map(t => ({ ...t, type: 'custom' }))
  ]

  const filtered = allTemplates.filter(t =>
    catFilter === 'Semua' ? true :
    catFilter === 'Kustom' ? t.type === 'custom' :
    t.category === catFilter
  )

  const handleCopy = async (content, id) => {
    await navigator.clipboard.writeText(content)
    setCopyDone(id)
    addToast('Template disalin ke clipboard!', 'success')
    setTimeout(() => setCopyDone(null), 2000)
  }

  const handleDownload = (template) => {
    const blob = new Blob([template.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Template diunduh!', 'success')
  }

  const handleAddCustom = async () => {
    if (!form.name.trim()) { addToast('Nama template wajib diisi!', 'warning'); return }
    if (!form.content.trim()) { addToast('Konten template wajib diisi!', 'warning'); return }
    await db.reportTemplates.add({ ...form, tags: [], createdAt: new Date() })
    addToast('Template tersimpan!', 'success')
    setForm({ name: '', category: 'Kustom', content: '' })
    setShowAddModal(false)
    load()
  }

  const handleDelete = async (id) => {
    await db.reportTemplates.delete(id)
    addToast('Template dihapus', 'info')
    load()
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-h))', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: 'calc(var(--space-6) + env(safe-area-inset-top,0px)) var(--space-4) var(--space-5)', background: 'linear-gradient(160deg, #1a2e1a 0%, #2d4a2d 100%)', color: 'white', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 900 }}>📄 Template Laporan</h1>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{allTemplates.length} template tersedia</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--radius-full)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', paddingBottom: 'calc(var(--space-12) + env(safe-area-inset-bottom,0px))', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding: '5px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: catFilter === c ? 'var(--color-primary)' : 'var(--color-surface)', color: catFilter === c ? 'white' : 'var(--color-text-sub)', fontSize: 'var(--font-size-xs)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all var(--transition-fast)', flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>

        {/* Template cards */}
        {filtered.map(template => (
          <motion.div key={template.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: template.type === 'built-in' ? '#dcfce7' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} color={template.type === 'built-in' ? '#16a34a' : '#2563eb'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{template.name}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: template.type === 'built-in' ? '#dcfce7' : '#dbeafe', color: template.type === 'built-in' ? '#16a34a' : '#2563eb' }}>
                    {template.type === 'built-in' ? 'Bawaan' : 'Kustom'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{template.category}</p>
              </div>
            </div>

            {/* Preview snippet */}
            <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', maxHeight: 60, overflow: 'hidden', position: 'relative' }}>
              <pre style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--color-text-sub)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {template.content.slice(0, 200)}...
              </pre>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-3)' }}>
              <button onClick={() => setPreview(template)}
                style={{ flex: 1, padding: '7px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-sub)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Eye size={13} /> Preview
              </button>
              <button onClick={() => handleCopy(template.content, template.id)}
                style={{ flex: 1, padding: '7px', borderRadius: 'var(--radius-lg)', border: 'none', background: copyDone === template.id ? 'var(--color-success)' : 'var(--color-primary)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Copy size={13} /> {copyDone === template.id ? 'Tersalin!' : 'Salin'}
              </button>
              <button onClick={() => handleDownload(template)}
                style={{ padding: '7px 10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-sub)', cursor: 'pointer' }}>
                <Download size={13} />
              </button>
              {template.type === 'custom' && (
                <button onClick={() => handleDelete(template.id)}
                  style={{ padding: '7px 10px', borderRadius: 'var(--radius-lg)', border: 'none', background: '#fee2e2', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.8 }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreview(null)} />
            <motion.div style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', flexDirection: 'column', margin: 'var(--space-4)', marginBottom: 'var(--space-6)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', maxHeight: '90vh' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>{preview.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{preview.category}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCopy(preview.content, preview.id)}
                    style={{ padding: '7px 14px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Copy size={13} /> Salin
                  </button>
                  <button onClick={() => setPreview(null)}
                    style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', border: 'none', background: 'var(--color-surface-2)', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
                <pre style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, margin: 0 }}>
                  {preview.content}
                </pre>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Custom Template Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} />
            <motion.div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 'var(--space-6)', zIndex: 101, paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom,0px))', maxHeight: '85vh', overflowY: 'auto' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}>
              <h3 style={{ fontWeight: 900, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>➕ Buat Template Sendiri</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Nama Template *</label>
                  <input style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                    placeholder="Nama template..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Kategori</label>
                  <select style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', boxSizing: 'border-box' }}
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {['Kustom', 'Praktikum', 'Makalah', 'Proposal', 'Laporan'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-sub)', display: 'block', marginBottom: 4 }}>Konten Template *</label>
                  <textarea rows={10} style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 12, fontFamily: 'monospace', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                    placeholder="Ketik konten template di sini..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleAddCustom}
                  style={{ flex: 2, padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  Simpan Template
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
