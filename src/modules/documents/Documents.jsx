import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, FileText, FileImage, File, Search,
  Download, Trash2, Plus, UploadCloud, X, Edit3, Eye, FileUp
} from 'lucide-react'
import { db } from '../../db/database'
import { useAppStore } from '../../store/useAppStore'
import styles from './Documents.module.css'

// Helper to format file sizes
function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Helper to format date
function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Determine file category icon and color
function getFileIcon(type, name) {
  if (type === 'application/pdf') {
    return { Icon: FileText, color: '#EF4444', label: 'PDF' } // Red
  }
  if (type.startsWith('image/')) {
    return { Icon: FileImage, color: '#10B981', label: 'Gambar' } // Green
  }
  if (type.startsWith('text/') || name.endsWith('.md') || name.endsWith('.json')) {
    return { Icon: FileText, color: '#3B82F6', label: 'Teks' } // Blue
  }
  return { Icon: File, color: '#94A3B8', label: 'File' } // Slate
}

export default function Documents() {
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const fileInputRef = useRef(null)

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // all | pdf | image | text | other
  const [dragActive, setDragActive] = useState(false)

  // Modals state
  const [noteDoc, setNoteDoc] = useState(null) // Document being edited
  const [noteText, setNoteText] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null) // Document being previewed
  const [previewContent, setPreviewContent] = useState({ type: '', data: null }) // Data url or string content

  // Fetch all documents from Dexie DB
  const loadDocs = async () => {
    setLoading(true)
    try {
      const rows = await db.documents.orderBy('uploadedAt').reverse().toArray()
      setDocuments(rows)
    } catch (err) {
      console.error('Error loading documents:', err)
      addToast('Gagal memuat dokumen', 'danger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  // Handle file import
  const handleFileSave = async (file) => {
    // Check file size (limit: 20MB)
    const MAX_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      addToast('File terlalu besar! Maksimal 20MB.', 'warning')
      return
    }

    try {
      // Store in IndexedDB
      await db.documents.add({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        notes: '',
        fileData: file, // Store the File object / Blob directly
        uploadedAt: new Date()
      })
      addToast('Dokumen berhasil diunggah!', 'success')
      loadDocs()
    } catch (err) {
      console.error('Error saving file:', err)
      addToast('Gagal menyimpan file', 'danger')
    }
  }

  // Handle browse selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSave(e.target.files[0])
    }
  }

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSave(e.dataTransfer.files[0])
    }
  }

  // Delete document
  const handleDelete = async (id) => {
    if (window.confirm('Hapus dokumen ini secara permanen?')) {
      try {
        await db.documents.delete(id)
        addToast('Dokumen dihapus', 'info')
        loadDocs()
      } catch (err) {
        console.error('Error deleting doc:', err)
        addToast('Gagal menghapus dokumen', 'danger')
      }
    }
  }

  // Download document
  const handleDownload = (doc) => {
    try {
      const url = URL.createObjectURL(doc.fileData)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Revoke the object URL after download finishes
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error('Error downloading:', err)
      addToast('Gagal mengunduh dokumen', 'danger')
    }
  }

  // Edit notes
  const openNoteModal = (doc) => {
    setNoteDoc(doc)
    setNoteText(doc.notes || '')
  }

  const saveNotes = async () => {
    if (!noteDoc) return
    try {
      await db.documents.update(noteDoc.id, { notes: noteText.trim() })
      addToast('Catatan disimpan', 'success')
      setNoteDoc(null)
      loadDocs()
    } catch (err) {
      console.error('Error saving notes:', err)
      addToast('Gagal menyimpan catatan', 'danger')
    }
  }

  // Preview file in-app
  const handlePreview = async (doc) => {
    setPreviewDoc(doc)
    const { type, fileData } = doc

    if (type.startsWith('image/')) {
      // Create Object URL for image rendering
      const url = URL.createObjectURL(fileData)
      setPreviewContent({ type: 'image', data: url })
    } else if (type.startsWith('text/') || doc.name.endsWith('.md') || doc.name.endsWith('.json')) {
      // Read Blob content as plain text
      try {
        const text = await new Response(fileData).text()
        setPreviewContent({ type: 'text', data: text })
      } catch (err) {
        console.error('Error reading text file:', err)
        setPreviewContent({ type: 'error', data: 'Gagal membaca isi dokumen teks.' })
      }
    } else {
      // PDF or other formats
      setPreviewContent({ type: 'other', data: null })
    }
  }

  const closePreview = () => {
    if (previewContent.type === 'image' && previewContent.data) {
      URL.revokeObjectURL(previewContent.data)
    }
    setPreviewDoc(null)
    setPreviewContent({ type: '', data: null })
  }

  // Open PDF/Other in new tab
  const openInNewTab = (doc) => {
    try {
      const url = URL.createObjectURL(doc.fileData)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Error opening tab:', err)
      addToast('Gagal membuka dokumen', 'danger')
    }
  }

  // Search & Filter Memoized List
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Match Filter type
      const isPdf = doc.type === 'application/pdf'
      const isImg = doc.type.startsWith('image/')
      const isTxt = doc.type.startsWith('text/') || doc.name.endsWith('.md') || doc.name.endsWith('.json')

      if (activeFilter === 'pdf' && !isPdf) return false
      if (activeFilter === 'image' && !isImg) return false
      if (activeFilter === 'text' && !isTxt) return false
      if (activeFilter === 'other' && (isPdf || isImg || isTxt)) return false

      // Match Search keyword
      if (search.trim()) {
        const query = search.toLowerCase()
        const nameMatch = doc.name.toLowerCase().includes(query)
        const noteMatch = (doc.notes || '').toLowerCase().includes(query)
        return nameMatch || noteMatch
      }

      return true
    })
  }, [documents, search, activeFilter])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Kembali ke Beranda">
          <ArrowLeft size={20} />
        </button>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>Dokumen Saya</h1>
          <p className={styles.subtitle}>{documents.length} dokumen tersimpan secara lokal</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Drag and Drop Zone */}
        <div
          className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className={styles.fileInput}
            onChange={handleFileChange}
          />
          <UploadCloud className={styles.uploadIcon} size={40} strokeWidth={1.5} />
          <p className={styles.uploadTitle}>Sentuh untuk unggah dokumen</p>
          <p className={styles.uploadDesc}>Mendukung PDF, Gambar, Teks, Excel, dll. (Maks. 20MB)</p>
        </div>

        {/* Search & Filters */}
        <div className={styles.searchFilterRow}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Cari dokumen atau catatan..."
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterBar}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pdf', label: 'PDF' },
              { id: 'image', label: 'Gambar' },
              { id: 'text', label: 'Teks/Catatan' },
              { id: 'other', label: 'Lainnya' }
            ].map(f => (
              <button
                key={f.id}
                className={`${styles.filterBtn} ${activeFilter === f.id ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
            Memuat dokumen...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className={styles.emptyState}>
            <FileUp className={styles.emptyIcon} size={48} strokeWidth={1.2} />
            <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Tidak ada dokumen ditemukan</p>
            <p style={{ fontSize: 'var(--font-size-xs)' }}>Silakan unggah dokumen baru melalui panel di atas.</p>
          </div>
        ) : (
          <div className={styles.docList}>
            <AnimatePresence mode="popLayout">
              {filteredDocs.map(doc => {
                const { Icon, color, label } = getFileIcon(doc.type, doc.name)
                return (
                  <motion.div
                    key={doc.id}
                    className={styles.docCard}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <div className={styles.docMain}>
                      <div className={styles.docIconWrap} style={{ background: `${color}15`, color }}>
                        <Icon size={22} strokeWidth={2} />
                      </div>
                      <div className={styles.docInfo}>
                        <h4 className={styles.docName}>{doc.name}</h4>
                        <div className={styles.docMeta}>
                          <span style={{ color, fontWeight: 600 }}>{label}</span>
                          <span className={styles.docMetaDot} />
                          <span>{formatBytes(doc.size)}</span>
                          <span className={styles.docMetaDot} />
                          <span>{formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {doc.notes && (
                      <div className={styles.docNotes} style={{ borderLeftColor: color }}>
                        {doc.notes}
                      </div>
                    )}

                    <div className={styles.docActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={() => handlePreview(doc)}
                        title="Pratinjau"
                      >
                        <Eye size={13} /> Pratinjau
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDownload(doc)}
                        title="Unduh"
                      >
                        <Download size={13} /> Unduh
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openNoteModal(doc)}
                        title="Catatan"
                      >
                        <Edit3 size={13} /> Catatan
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDelete(doc.id)}
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Notes Modal */}
      <AnimatePresence>
        {noteDoc && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteDoc(null)}
            />
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Catatan Dokumen</h3>
              <button className={styles.modalCloseBtn} onClick={() => setNoteDoc(null)} aria-label="Tutup">
                <X size={16} />
              </button>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-sub)', wordBreak: 'break-all' }}>
                File: {noteDoc.name}
              </p>
              <textarea
                className={styles.noteTextarea}
                placeholder="Tulis catatan, nama mata kuliah, atau keperluan dokumen..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                maxLength={400}
              />
              <div className={styles.modalActions}>
                <button className={styles.modalBtn} onClick={() => setNoteDoc(null)}>Batal</button>
                <button className={`${styles.modalBtn} ${styles.modalBtnPrimary}`} onClick={saveNotes}>Simpan</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePreview}
            />
            <motion.div
              className={styles.modal}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Pratinjau Dokumen</h3>
              <button className={styles.modalCloseBtn} onClick={closePreview} aria-label="Tutup">
                <X size={16} />
              </button>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-sub)', wordBreak: 'break-all', paddingRight: '20px' }}>
                File: {previewDoc.name}
              </p>

              <div className={styles.previewArea}>
                {previewContent.type === 'image' && (
                  <img
                    src={previewContent.data}
                    alt={previewDoc.name}
                    className={styles.previewImage}
                  />
                )}
                {previewContent.type === 'text' && (
                  <pre className={styles.previewText}>{previewContent.data}</pre>
                )}
                {previewContent.type === 'error' && (
                  <div className={styles.previewPlaceholder}>
                    <p style={{ color: 'var(--color-danger)' }}>{previewContent.data}</p>
                  </div>
                )}
                {previewContent.type === 'other' && (
                  <div className={styles.previewPlaceholder}>
                    <File size={40} className={styles.emptyIcon} />
                    <p style={{ fontWeight: 600 }}>Tipe file tidak didukung untuk pratinjau langsung</p>
                    <p style={{ fontSize: 11 }}>Dokumen ini berupa file {previewDoc.type.split('/')[1]?.toUpperCase() || 'Biner'}.</p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={() => openInNewTab(previewDoc)}
                      >
                        Buka di Tab Baru
                      </button>
                      <button
                        className={styles.modalBtn}
                        onClick={() => handleDownload(previewDoc)}
                      >
                        Unduh File
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.modalBtn} onClick={closePreview}>Tutup</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
