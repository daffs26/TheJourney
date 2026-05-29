import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Presentation as PptIcon,
  Sparkles,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Presentation.module.css'
import pptxgen from 'pptxgenjs'

const THEMES = [
  { id: 'midnight', label: 'Midnight Blue', bg: '#0e1c3d', text: '#ffffff', accent: '#f59e0b', subtext: '#94a3b8' },
  { id: 'emerald', label: 'Emerald Clean', bg: '#ffffff', text: '#0f172a', accent: '#10b981', subtext: '#475569' },
  { id: 'sunset', label: 'Sunset Glow', bg: '#3b0764', text: '#ffffff', accent: '#f43f5e', subtext: '#fb7185' },
  { id: 'slate', label: 'Minimalist Slate', bg: '#f8fafc', text: '#0f172a', accent: '#2563eb', subtext: '#64748b' }
]

export default function Presentation() {
  const { addToast } = useAppStore()

  // Setup state
  const [topic, setTopic] = useState('')
  const [slideCount, setSlideCount] = useState(8)
  const [selectedTheme, setSelectedTheme] = useState('midnight')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Outline state
  const [outline, setOutline] = useState(null) // { title, slides: [...] }

  // Generate Presentation Outline Statically (Without AI)
  const handleGenerateOutline = async () => {
    if (!topic.trim()) {
      addToast('Masukkan topik presentasi terlebih dahulu!', 'warning')
      return
    }

    setIsGenerating(true)
    setOutline(null)
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const generatedSlides = []
      
      // Slide 1: Title
      generatedSlides.push({
        slideNumber: 1,
        title: topic,
        type: 'title',
        bullets: [],
        speakerNotes: `Selamat pagi/siang rekan-rekan dan dosen. Hari ini saya akan mempresentasikan tentang: ${topic}.`
      })

      // Slide 2: Introduction
      generatedSlides.push({
        slideNumber: 2,
        title: 'Pendahuluan & Latar Belakang',
        type: 'content',
        bullets: [
          `Definisi umum dan esensi utama dari ${topic}`,
          'Mengapa topik ini penting untuk dibahas saat ini',
          'Latar belakang masalah dan tantangan yang mendasar'
        ],
        speakerNotes: 'Slide ini menjelaskan pengantar umum dan signifikansi penting dari topik bahasan kita.'
      })

      // Dynamic middle slides based on count
      const midSlideCount = slideCount - 3
      for (let i = 0; i < midSlideCount; i++) {
        const slideNo = i + 3
        let slideTitle = `Pembahasan Utama Bagian ${i + 1}`
        let bullets = [
          `Analisis mendalam poin ke-${i + 1} terkait ${topic}`,
          'Faktor-faktor yang memengaruhi dan data pendukung',
          'Studi kasus atau contoh implementasi nyata di lapangan'
        ]
        
        if (i === 0) {
          slideTitle = `Tinjauan Teoritis ${topic}`
          bullets = [
            `Konsep dasar dan landasan teori terkait ${topic}`,
            'Perspektif akademik dan riset terdahulu',
            'Model referensi yang digunakan dalam analisis'
          ]
        } else if (i === midSlideCount - 1 && midSlideCount > 1) {
          slideTitle = 'Tantangan & Peluang Kerja'
          bullets = [
            'Hambatan utama dalam implementasi praktis',
            'Peluang pengembangan dan inovasi masa depan',
            'Solusi mitigasi risiko'
          ]
        }

        generatedSlides.push({
          slideNumber: slideNo,
          title: slideTitle,
          type: 'content',
          bullets: bullets,
          speakerNotes: `Di slide ke-${slideNo} ini, kita fokus membedah aspek: ${slideTitle}.`
        })
      }

      // Slide N-1: Solutions
      generatedSlides.push({
        slideNumber: slideCount - 1,
        title: 'Rekomendasi & Solusi',
        type: 'content',
        bullets: [
          'Langkah-langkah strategis pemecahan masalah',
          'Rekomendasi taktis untuk jangka pendek dan panjang',
          'Hasil yang diharapkan dari penerapan solusi'
        ],
        speakerNotes: 'Bagian ini memaparkan kesimpulan solusi operasional dan rekomendasi strategis.'
      })

      // Slide N: Conclusion
      generatedSlides.push({
        slideNumber: slideCount,
        title: 'Kesimpulan & Tanya Jawab',
        type: 'closing',
        bullets: [
          'Ringkasan poin-poin utama presentasi',
          'Implikasi akhir dari analisis yang dilakukan',
          'Sesi diskusi dan tanya jawab dibuka'
        ],
        speakerNotes: 'Demikian presentasi dari saya. Terima kasih atas perhatiannya. Sekarang saya membuka sesi diskusi.'
      })

      setOutline({
        title: topic,
        slides: generatedSlides
      })
      addToast('Outline presentasi berhasil dibuat!', 'success')
    } catch (e) {
      addToast('Gagal menyusun outline: ' + e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle slide field updates
  const handleUpdateSlideTitle = (index, value) => {
    setOutline(prev => {
      const updatedSlides = [...prev.slides]
      updatedSlides[index] = { ...updatedSlides[index], title: value }
      return { ...prev, slides: updatedSlides }
    })
  }

  const handleUpdateSlideNotes = (index, value) => {
    setOutline(prev => {
      const updatedSlides = [...prev.slides]
      updatedSlides[index] = { ...updatedSlides[index], speakerNotes: value }
      return { ...prev, slides: updatedSlides }
    })
  }

  const handleUpdateBullet = (slideIndex, bulletIndex, value) => {
    setOutline(prev => {
      const updatedSlides = [...prev.slides]
      const updatedBullets = [...updatedSlides[slideIndex].bullets]
      updatedBullets[bulletIndex] = value
      updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bullets: updatedBullets }
      return { ...prev, slides: updatedSlides }
    })
  }

  const handleAddBullet = (slideIndex) => {
    setOutline(prev => {
      const updatedSlides = [...prev.slides]
      const updatedBullets = [...(updatedSlides[slideIndex].bullets || []), '']
      updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bullets: updatedBullets }
      return { ...prev, slides: updatedSlides }
    })
  }

  const handleRemoveBullet = (slideIndex, bulletIndex) => {
    setOutline(prev => {
      const updatedSlides = [...prev.slides]
      const updatedBullets = updatedSlides[slideIndex].bullets.filter((_, idx) => idx !== bulletIndex)
      updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], bullets: updatedBullets }
      return { ...prev, slides: updatedSlides }
    })
  }

  // Compile and Export presentation using PptxGenJS
  const handleExportPPTX = () => {
    if (!outline) return

    try {
      const pptx = new pptxgen()
      pptx.layout = 'LAYOUT_16x9'
      pptx.title = outline.title || 'Presentasi Akademik'

      // Get color scheme
      const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0]
      // Convert HEX colors (clean # for pptxgen)
      const bgColor = theme.bg.replace('#', '')
      const textColor = theme.text.replace('#', '')
      const accentColor = theme.accent.replace('#', '')
      const subtextColor = theme.subtext.replace('#', '')

      // Loop through slides in the outline
      outline.slides.forEach(slide => {
        const pptSlide = pptx.addSlide()

        // Set Slide Background
        pptSlide.background = { fill: bgColor }

        // Layout depending on slide type
        if (slide.type === 'title') {
          // Main Title Slide
          pptSlide.addText(slide.title, {
            x: 0.5,
            y: 2.2,
            w: 9.0,
            h: 1.5,
            fontSize: 34,
            bold: true,
            color: accentColor,
            align: 'center',
            fontFace: 'Arial'
          })

          pptSlide.addText('Outline Presentasi Akademik • Dibuat oleh TheJourney', {
            x: 0.5,
            y: 4.0,
            w: 9.0,
            h: 0.5,
            fontSize: 14,
            color: subtextColor,
            align: 'center',
            fontFace: 'Arial'
          })
        } else if (slide.type === 'section') {
          // Section Divider Slide
          pptSlide.addText(slide.title, {
            x: 0.5,
            y: 2.5,
            w: 9.0,
            h: 1.5,
            fontSize: 28,
            bold: true,
            color: accentColor,
            align: 'center',
            fontFace: 'Arial'
          })
        } else {
          // Standard Content Slide
          // Header Text
          pptSlide.addText(slide.title, {
            x: 0.6,
            y: 0.5,
            w: 8.8,
            h: 0.8,
            fontSize: 22,
            bold: true,
            color: accentColor,
            fontFace: 'Arial'
          })

          // Bullet List Objects
          const bullets = slide.bullets || []
          const bulletObjects = bullets
            .filter(b => b.trim() !== '')
            .map(b => ({
              text: b,
              options: { bullet: true, color: textColor, fontSize: 16 }
            }))

          if (bulletObjects.length > 0) {
            pptSlide.addText(bulletObjects, {
              x: 0.6,
              y: 1.6,
              w: 8.8,
              h: 4.2,
              lineSpacing: 24,
              fontFace: 'Arial'
            })
          }
        }

        // Add Speaker Notes
        if (slide.speakerNotes) {
          pptSlide.note = slide.speakerNotes
        }
      })

      // Write presentation file
      const filename = `${(outline.title || 'presentasi').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pptx`
      pptx.writeFile({ fileName: filename }).then(() => {
        addToast('File PPTX berhasil diunduh!', 'success')
      })
    } catch (err) {
      addToast('Gagal mengekspor file PPTX: ' + err.message, 'error')
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>PPT Generator</h1>
        <p className={styles.subtitle}>Buat outline presentasi kuliah instan & terstruktur</p>
      </div>

      <div className={styles.content}>
        {/* Setup card */}
        <div className={styles.setupCard}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className={styles.label}>Topik Presentasi *</label>
            <input
              className={styles.input}
              placeholder="Contoh: Blockchain dalam logistik, Dampak inflasi..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div className={styles.row2}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className={styles.label}>Jumlah Slide</label>
              <select
                className={styles.select}
                value={slideCount}
                onChange={e => setSlideCount(parseInt(e.target.value))}
              >
                {[5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                  <option key={n} value={n}>
                    {n} Slide
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className={styles.label}>Tema Desain</label>
              <select
                className={styles.select}
                value={selectedTheme}
                onChange={e => setSelectedTheme(e.target.value)}
              >
                {THEMES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>



          <button
            className={styles.generateBtn}
            onClick={handleGenerateOutline}
            disabled={isGenerating || !topic.trim()}
          >
            {isGenerating ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <Sparkles size={16} />
            )}
            {isGenerating ? 'Menyusun Outline...' : 'Buat Outline Presentasi'}
          </button>
        </div>

        {/* Loading status */}
        {isGenerating && (
          <div className={styles.loadingWrapper}>
            <Loader2 size={32} className={styles.spinner} />
            <span>Sedang menyusun sub-bab presentasi dan draf catatan...</span>
          </div>
        )}

        {/* Empty outline state */}
        {!isGenerating && !outline && (
          <div className={styles.emptyState}>
            <PptIcon size={48} className={styles.emptyIcon} />
            <h3>Outline Kosong</h3>
            <p>Masukkan topik di atas untuk menyusun draf outline presentasi PowerPoint secara instan.</p>
          </div>
        )}

        {/* Workspace editor */}
        {!isGenerating && outline && (
          <div>
            <div className={styles.workspaceHeader}>
              <h2 className={styles.workspaceTitle}>Draf Outline: {outline.title}</h2>
              <button className={styles.downloadBtn} onClick={handleExportPPTX}>
                <Download size={14} /> Unduh PPTX
              </button>
            </div>

            {/* Slide loop */}
            {outline.slides.map((slide, sIdx) => (
              <div key={sIdx} className={styles.slideCard}>
                <div className={styles.slideCardHeader}>
                  <span className={styles.slideNumber}>Slide {slide.slideNumber}</span>
                  <span className={styles.slideTypeBadge}>{slide.type.toUpperCase()}</span>
                </div>

                <div className={styles.slideCardBody}>
                  {/* Title field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className={styles.label} style={{ fontSize: '10px' }}>Judul Slide</label>
                    <input
                      className={styles.input}
                      style={{ height: '36px' }}
                      value={slide.title}
                      onChange={e => handleUpdateSlideTitle(sIdx, e.target.value)}
                    />
                  </div>

                  {/* Bullet points editor (only if not section/title) */}
                  {slide.type !== 'section' && slide.type !== 'title' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label className={styles.label} style={{ fontSize: '10px' }}>Poin Konten</label>
                      {slide.bullets?.map((b, bIdx) => (
                        <div key={bIdx} className={styles.bulletRow}>
                          <span className={styles.bulletNum}>{bIdx + 1}.</span>
                          <input
                            className={styles.input}
                            style={{ height: '32px', flex: 1 }}
                            value={b}
                            onChange={e => handleUpdateBullet(sIdx, bIdx, e.target.value)}
                          />
                          <button
                            className={styles.removeBulletBtn}
                            onClick={() => handleRemoveBullet(sIdx, bIdx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        className={styles.addBulletBtn}
                        onClick={() => handleAddBullet(sIdx)}
                      >
                        <Plus size={12} /> Tambah Poin
                      </button>
                    </div>
                  )}

                  {/* Speaker notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className={styles.label} style={{ fontSize: '10px' }}>Catatan Pembicara (Speaker Notes)</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Masukkan catatan pendukung presentasi di sini..."
                      value={slide.speakerNotes || ''}
                      onChange={e => handleUpdateSlideNotes(sIdx, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
