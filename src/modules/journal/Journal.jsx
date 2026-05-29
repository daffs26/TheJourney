import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Copy,
  Check,
  Save,
  Trash2,
  BookOpen,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import db from '../../db/database'
import styles from './Journal.module.css'

export default function Journal() {
  const { courses, fetchCourses } = useCoursesStore()
  const { addToast } = useAppStore()

  // State
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'collection'
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [expandedPaperId, setExpandedPaperId] = useState(null)
  
  // Save modal state
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [saveCourseId, setSaveCourseId] = useState('')
  const [saveTags, setSaveTags] = useState('')

  // Collection state
  const [collection, setCollection] = useState([])
  const [filterCourseId, setFilterCourseId] = useState('all')
  const [localSearch, setLocalSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null) // { id, type }

  useEffect(() => {
    fetchCourses()
    loadCollection()
  }, [])

  useEffect(() => {
    loadCollection()
  }, [filterCourseId])

  const loadCollection = async () => {
    try {
      let refs = []
      if (filterCourseId === 'all') {
        refs = await db.references.orderBy('createdAt').reverse().toArray()
      } else {
        refs = await db.references
          .where('courseId')
          .equals(parseInt(filterCourseId))
          .toArray()
        // Dexie query doesn't sort by default in reverse unless we do manually or use compound index
        refs.sort((a, b) => b.createdAt - a.createdAt)
      }
      setCollection(refs)
    } catch (e) {
      console.error('Gagal mengambil koleksi:', e)
    }
  }



  // Semantic Scholar search
  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    if (!query.trim()) {
      addToast('Masukkan topik atau kata kunci pencarian!', 'warning')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setExpandedPaperId(null)

    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        query
      )}&limit=10&fields=title,authors,year,journal,venue,externalIds,abstract,openAccessPdf,citationCount`
      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error('API Semantic Scholar merespon dengan error')
      }

      const data = await res.json()
      if (data.data && data.data.length > 0) {
        setSearchResults(data.data)
      } else {
        addToast('Tidak ditemukan jurnal yang cocok.', 'info')
      }
    } catch (err) {
      addToast('Gagal mencari jurnal: ' + err.message, 'error')
    } finally {
      setIsSearching(false)
    }
  }

  // Citation formatting helpers
  const formatAPAAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Anonim'
    const formatted = authors.map((a) => {
      const parts = a.name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0]
      const lastName = parts[parts.length - 1]
      const initials = parts
        .slice(0, parts.length - 1)
        .map((p) => p[0] + '.')
        .join(' ')
      return `${lastName}, ${initials}`
    })

    if (formatted.length === 1) return formatted[0]
    if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`
    if (formatted.length > 7) {
      return `${formatted.slice(0, 6).join(', ')}, ... ${formatted[formatted.length - 1]}`
    }
    return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`
  }

  const formatIEEEAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Anonim'
    const formatted = authors.map((a) => {
      const parts = a.name.trim().split(/\s+/)
      if (parts.length === 1) return parts[0]
      const lastName = parts[parts.length - 1]
      const initials = parts
        .slice(0, parts.length - 1)
        .map((p) => p[0] + '.')
        .join(' ')
      return `${initials} ${lastName}`
    })

    if (formatted.length === 1) return formatted[0]
    if (formatted.length === 2) return `${formatted[0]} and ${formatted[1]}`
    return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`
  }

  const generateAPACitation = (paper) => {
    const authors = formatAPAAuthors(paper.authors)
    const year = paper.year ? `(${paper.year})` : '(n.d.)'
    const title = paper.title ? `${paper.title}.` : ''
    const journal = paper.journal?.name || paper.venue || ''
    const journalPart = journal ? `${journal}.` : ''
    const doi = paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : ''
    const urlPart = doi || `https://api.semanticscholar.org/${paper.paperId}`
    
    return `${authors} ${year}. ${title} ${journalPart} Retrieved from ${urlPart}`.replace(/\s+/g, ' ').trim()
  }

  const generateIEEECitation = (paper) => {
    const authors = formatIEEEAuthors(paper.authors)
    const title = paper.title ? `"${paper.title},"` : ''
    const journal = paper.journal?.name || paper.venue || ''
    const journalPart = journal ? `${journal},` : ''
    const yearPart = paper.year ? `${paper.year},` : ''
    const doi = paper.externalIds?.DOI ? `doi: ${paper.externalIds.DOI}.` : ''
    
    return `${authors}, ${title} ${journalPart} ${yearPart} ${doi}`.replace(/\s+/g, ' ').trim()
  }

  // Handle Save Reference
  const handleSaveReference = async () => {
    if (!saveCourseId) {
      addToast('Pilih Mata Kuliah terlebih dahulu!', 'warning')
      return
    }

    try {
      const paper = selectedPaper
      const citation_apa = generateAPACitation(paper)
      const citation_ieee = generateIEEECitation(paper)

      const tagsArray = saveTags
        ? saveTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : []

      await db.references.add({
        courseId: parseInt(saveCourseId),
        title: paper.title,
        authors: paper.authors || [],
        year: paper.year || null,
        journal: paper.journal?.name || paper.venue || 'No Journal Info',
        doi: paper.externalIds?.DOI || '',
        abstract: paper.abstract || '',
        url: paper.url || `https://api.semanticscholar.org/${paper.paperId}`,
        pdfUrl: paper.openAccessPdf?.url || '',
        citation_apa,
        citation_ieee,
        tags: tagsArray,
        createdAt: new Date(),
      })

      addToast('Referensi disimpan ke koleksi!', 'success')
      setSelectedPaper(null)
      setSaveCourseId('')
      setSaveTags('')
      loadCollection()
    } catch (e) {
      addToast('Gagal menyimpan referensi: ' + e.message, 'error')
    }
  }

  const handleDeleteSaved = async (id, title) => {
    if (confirm(`Hapus referensi "${title}" dari koleksi?`)) {
      await db.references.delete(id)
      addToast('Referensi dihapus.', 'info')
      loadCollection()
    }
  }

  // Clipboard copies
  const handleCopyCitation = (text, id, type) => {
    navigator.clipboard.writeText(text)
    setCopiedId({ id, type })
    addToast(`Sitasi (${type.toUpperCase()}) disalin ke clipboard!`, 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyAllCitations = (type) => {
    if (collection.length === 0) {
      addToast('Koleksi kosong!', 'warning')
      return
    }

    const compiled = collection
      .map((ref) => (type === 'apa' ? ref.citation_apa : ref.citation_ieee))
      .sort()
      .join('\n\n')

    navigator.clipboard.writeText(compiled)
    addToast(`Berhasil menyalin ${collection.length} sitasi (${type.toUpperCase()})!`, 'success')
  }

  const filteredCollection = collection.filter((ref) => {
    if (!localSearch.trim()) return true
    const term = localSearch.toLowerCase()
    return (
      ref.title.toLowerCase().includes(term) ||
      (ref.journal && ref.journal.toLowerCase().includes(term)) ||
      ref.authors.some((a) => a.name.toLowerCase().includes(term))
    )
  })

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Crosscheck Jurnal</h1>
        <p className={styles.subtitle}>Cari jurnal referensi terpercaya dari draf makalahmu</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔎 Cari Jurnal
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'collection' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          📚 Koleksi Referensi ({collection.length})
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'search' ? (
          <div>
            {/* Input Card */}
            <div className={styles.formCard}>
              <label className={styles.label}>
                Cari Jurnal Referensi
              </label>

              <div className={styles.searchContainer}>
                <input
                  className={styles.input}
                  placeholder="Ketik topik, judul, atau kata kunci pencarian jurnal..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  className={styles.searchBtn}
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 size={18} className={styles.loadingSpinner} />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <h2 className={styles.resultsTitle}>
                Ditemukan {searchResults.length} Jurnal Relevan
              </h2>
            )}

            {isSearching ? (
              <div className={styles.loadingWrapper}>
                <Loader2 size={32} className={styles.loadingSpinner} />
                <span>Mencari jurnal di Semantic Scholar database...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3>Belum Ada Pencarian</h3>
                <p>Masukkan topik atau ekstrak kata kunci untuk mencari referensi jurnal terpercaya.</p>
              </div>
            ) : (
              <div>
                {searchResults.map((paper) => {
                  const isExpanded = expandedPaperId === paper.paperId
                  const hasPdf = paper.openAccessPdf?.url

                  return (
                    <div key={paper.paperId} className={styles.paperCard}>
                      <div className={styles.paperHeader}>
                        <h3 className={styles.paperTitle}>{paper.title}</h3>
                        <div className={styles.paperMeta}>
                          {paper.year && <span className={styles.metaItem}>📅 {paper.year}</span>}
                          {paper.authors && paper.authors.length > 0 && (
                            <span className={styles.metaItem}>
                              ✍️ {paper.authors.slice(0, 3).map((a) => a.name).join(', ')}
                              {paper.authors.length > 3 ? ' et al.' : ''}
                            </span>
                          )}
                          {(paper.journal?.name || paper.venue) && (
                            <span className={styles.metaItem}>
                              📖 {paper.journal?.name || paper.venue}
                            </span>
                          )}
                          {hasPdf && <span className={`${styles.badge} ${styles.oaBadge}`}>Open Access PDF</span>}
                          {paper.citationCount !== undefined && (
                            <span className={`${styles.badge} ${styles.citationBadge}`}>
                              Cited by {paper.citationCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable abstract */}
                      {paper.abstract && (
                        <button
                          className={styles.abstractBtn}
                          onClick={() => setExpandedPaperId(isExpanded ? null : paper.paperId)}
                        >
                          {isExpanded ? (
                            <>
                              Sembunyikan Abstrak <ChevronUp size={14} />
                            </>
                          ) : (
                            <>
                              Lihat Abstrak <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      )}

                      <AnimatePresence>
                        {isExpanded && paper.abstract && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={styles.abstractContent}
                          >
                            <p>{paper.abstract}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className={styles.cardActions}>
                        {hasPdf && (
                          <a
                            href={paper.openAccessPdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                          >
                            <Download size={14} /> PDF
                          </a>
                        )}
                        <a
                          href={paper.url || `https://api.semanticscholar.org/${paper.paperId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                        >
                          <ExternalLink size={14} /> Link Jurnal
                        </a>
                        <button
                          className={`${styles.actionBtn} ${styles.primaryBtn}`}
                          onClick={() => setSelectedPaper(paper)}
                        >
                          <Save size={14} /> Simpan
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* Collection Tab */
          <div>
            {/* Filter and local search */}
            <div className={styles.filterRow}>
              <select
                className={styles.select}
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
              >
                <option value="all">Semua Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                placeholder="Cari referensi tersimpan..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </div>

            {/* Quick action: copy all */}
            {filteredCollection.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  className={styles.copyAllBtn}
                  onClick={() => handleCopyAllCitations('apa')}
                >
                  <Copy size={12} /> Salin Semua (APA)
                </button>
                <button
                  className={styles.copyAllBtn}
                  onClick={() => handleCopyAllCitations('ieee')}
                >
                  <Copy size={12} /> Salin Semua (IEEE)
                </button>
              </div>
            )}

            {filteredCollection.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3>Koleksi Masih Kosong</h3>
                <p>Belum ada referensi jurnal yang disimpan untuk filter ini.</p>
              </div>
            ) : (
              <div>
                {filteredCollection.map((ref) => {
                  const course = courses.find((c) => c.id === ref.courseId)
                  const isExpanded = expandedPaperId === ref.id

                  return (
                    <div
                      key={ref.id}
                      className={`${styles.paperCard} ${styles.savedCard}`}
                      style={{ borderLeftColor: course?.color || 'var(--color-mod-journal)' }}
                    >
                      {course && (
                        <span
                          className={styles.courseTag}
                          style={{
                            backgroundColor: `${course.color}15`,
                            color: course.color,
                          }}
                        >
                          {course.name}
                        </span>
                      )}
                      <h3 className={styles.paperTitle}>{ref.title}</h3>
                      <p className={styles.paperMeta} style={{ margin: '4px 0 12px 0' }}>
                        ✍️ {ref.authors.slice(0, 3).map((a) => a.name).join(', ')}
                        {ref.authors.length > 3 ? ' et al.' : ''} · 📅 {ref.year}
                      </p>

                      {/* Expandable abstract */}
                      {ref.abstract && (
                        <button
                          className={styles.abstractBtn}
                          onClick={() => setExpandedPaperId(isExpanded ? null : ref.id)}
                          style={{ marginBottom: '12px' }}
                        >
                          {isExpanded ? (
                            <>
                              Sembunyikan Abstrak <ChevronUp size={14} />
                            </>
                          ) : (
                            <>
                              Lihat Abstrak <ChevronDown size={14} />
                            </>
                          )}
                        </button>
                      )}

                      <AnimatePresence>
                        {isExpanded && ref.abstract && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className={styles.abstractContent}
                            style={{ marginBottom: '12px', marginTop: 0 }}
                          >
                            <p>{ref.abstract}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* APA Citation box */}
                      <div className={styles.citationBox}>
                        <div className={styles.citationTitle}>
                          Format APA
                          <button
                            className={styles.copyInlineBtn}
                            onClick={() =>
                              handleCopyCitation(ref.citation_apa, ref.id, 'apa')
                            }
                            title="Salin APA Citation"
                          >
                            {copiedId?.id === ref.id && copiedId?.type === 'apa' ? (
                              <Check size={14} style={{ color: 'var(--color-success)' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <p className={styles.citationText}>{ref.citation_apa}</p>
                      </div>

                      {/* IEEE Citation box */}
                      <div className={styles.citationBox}>
                        <div className={styles.citationTitle}>
                          Format IEEE
                          <button
                            className={styles.copyInlineBtn}
                            onClick={() =>
                              handleCopyCitation(ref.citation_ieee, ref.id, 'ieee')
                            }
                            title="Salin IEEE Citation"
                          >
                            {copiedId?.id === ref.id && copiedId?.type === 'ieee' ? (
                              <Check size={14} style={{ color: 'var(--color-success)' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <p className={styles.citationText}>{ref.citation_ieee}</p>
                      </div>

                      <div className={styles.cardActions}>
                        {ref.pdfUrl && (
                          <a
                            href={ref.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                          >
                            <Download size={14} /> PDF
                          </a>
                        )}
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                        >
                          <ExternalLink size={14} /> Link Jurnal
                        </a>
                        <button
                          className={styles.actionBtn}
                          style={{ borderColor: 'var(--color-danger-pale)', color: 'var(--color-danger)' }}
                          onClick={() => handleDeleteSaved(ref.id, ref.title)}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {selectedPaper && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPaper(null)}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Simpan ke Referensi Kuliah</h3>
              
              <div className={styles.modalForm}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    Pilih Mata Kuliah *
                  </label>
                  <select
                    className={styles.select}
                    value={saveCourseId}
                    onChange={(e) => setSaveCourseId(e.target.value)}
                  >
                    <option value="">-- Pilih Matkul --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className={styles.label} style={{ marginBottom: 0 }}>
                    Tags (pisahkan dengan koma)
                  </label>
                  <input
                    className={styles.input}
                    placeholder="Contoh: basisdata, sql, normalisasi"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                  />
                </div>

                <div className={styles.formActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setSelectedPaper(null)}
                  >
                    Batal
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.primaryBtn}`}
                    onClick={handleSaveReference}
                  >
                    Simpan Referensi
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
