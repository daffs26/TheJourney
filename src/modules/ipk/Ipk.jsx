import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Info,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'
import { useCoursesStore } from '../../store/useCoursesStore'
import { useAppStore } from '../../store/useAppStore'
import db from '../../db/database'
import styles from './Ipk.module.css'

const GRADE_VALUES = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'E': 0.0,
  '': null
}

export default function Ipk() {
  const navigate = useNavigate()
  const { courses, fetchCourses } = useCoursesStore()
  const { addToast } = useAppStore()

  // State
  const [activeTab, setActiveTab] = useState('calculator') // 'calculator' | 'planner'
  const [activeSemester, setActiveSemester] = useState(1)
  
  // Local list of courses with grades
  const [localCourses, setLocalCourses] = useState([])

  // Manual IPS & SKS state
  const [manualGpa, setManualGpa] = useState({})
  const [manualIpsInput, setManualIpsInput] = useState('')
  const [manualSksInput, setManualSksInput] = useState('')

  // Planner inputs
  const [currentIpk, setCurrentIpk] = useState('')
  const [currentSks, setCurrentSks] = useState('')
  const [targetIpk, setTargetIpk] = useState('')
  const [plannedSks, setPlannedSks] = useState('')
  const [plannerResult, setPlannerResult] = useState(null)

  useEffect(() => {
    fetchCourses()
    // Load manual GPA data
    const loadManualData = async () => {
      try {
        const data = await db.settings.get('manualGpaData')
        if (data) {
          setManualGpa(JSON.parse(data.value))
        }
      } catch (e) {
        console.error('Failed to load manual gpa data:', e)
      }
    }
    loadManualData()
  }, [])

  useEffect(() => {
    // When course list updates, load details
    setLocalCourses(courses)
  }, [courses])

  // Sync inputs with activeSemester manualGpa data
  useEffect(() => {
    if (manualGpa[activeSemester]) {
      setManualIpsInput(String(manualGpa[activeSemester].ips))
      setManualSksInput(String(manualGpa[activeSemester].sks))
    } else {
      setManualIpsInput('')
      setManualSksInput('')
    }
  }, [activeSemester, manualGpa])

  const handleSaveManual = async () => {
    const ips = parseFloat(manualIpsInput)
    const sks = parseInt(manualSksInput)
    
    if (isNaN(ips) || ips < 0 || ips > 4.0) {
      addToast('IPS harus bernilai antara 0.00 s/d 4.00!', 'warning')
      return
    }
    if (isNaN(sks) || sks < 1 || sks > 30) {
      addToast('SKS harus bernilai antara 1 s/d 30!', 'warning')
      return
    }
    
    const updated = {
      ...manualGpa,
      [activeSemester]: { ips, sks }
    }
    
    try {
      await db.settings.put({ key: 'manualGpaData', value: JSON.stringify(updated), updatedAt: new Date() })
      setManualGpa(updated)
      addToast(`Data IPS Semester ${activeSemester} berhasil disimpan!`, 'success')
    } catch (e) {
      addToast('Gagal menyimpan data manual', 'error')
    }
  }

  const handleDeleteManual = async () => {
    const updated = { ...manualGpa }
    delete updated[activeSemester]
    
    try {
      await db.settings.put({ key: 'manualGpaData', value: JSON.stringify(updated), updatedAt: new Date() })
      setManualGpa(updated)
      setManualIpsInput('')
      setManualSksInput('')
      addToast(`Data IPS Semester ${activeSemester} dihapus!`, 'success')
    } catch (e) {
      addToast('Gagal menghapus data manual', 'error')
    }
  }

  // Handle grade change
  const handleGradeChange = async (courseId, grade) => {
    try {
      await db.courses.update(courseId, { grade })
      // Update local state
      setLocalCourses(prev =>
        prev.map(c => (c.id === courseId ? { ...c, grade } : c))
      )
      addToast('Nilai mata kuliah diperbarui!', 'success')
    } catch (e) {
      addToast('Gagal memperbarui nilai', 'error')
    }
  }

  // Calculations
  const calculateMetrics = () => {
    let totalPoints = 0
    let totalSks = 0
    let totalAttemptedSks = 0

    // Loop through semesters 1..8
    for (let sem = 1; sem <= 8; sem++) {
      if (manualGpa[sem]) {
        const m = manualGpa[sem]
        totalPoints += m.ips * m.sks
        totalSks += m.sks
        totalAttemptedSks += m.sks
      } else {
        // Automatic calculation from database courses for this semester
        const semCourses = localCourses.filter(c => c.semester === sem)
        const gradedSemCourses = semCourses.filter(c => c.grade && GRADE_VALUES[c.grade] !== null)
        
        let semPoints = 0
        let semSks = 0
        gradedSemCourses.forEach(c => {
          semPoints += c.sks * GRADE_VALUES[c.grade]
          semSks += c.sks
        })
        
        totalPoints += semPoints
        totalSks += semSks
        totalAttemptedSks += semCourses.reduce((acc, curr) => acc + curr.sks, 0)
      }
    }

    // Cumulative IPK
    const cumulativeIpk = totalSks > 0 ? (totalPoints / totalSks).toFixed(2) : '0.00'

    // Active Semester IPS
    let activeSemIps = '0.00'
    let activeSemSks = 0
    
    if (manualGpa[activeSemester]) {
      const m = manualGpa[activeSemester]
      activeSemIps = m.ips.toFixed(2)
      activeSemSks = m.sks
    } else {
      const activeSemCourses = localCourses.filter(c => c.semester === activeSemester)
      const gradedActiveSemCourses = activeSemCourses.filter(c => c.grade && GRADE_VALUES[c.grade] !== null)
      
      let activePoints = 0
      let activeSks = 0
      gradedActiveSemCourses.forEach(c => {
        activePoints += c.sks * GRADE_VALUES[c.grade]
        activeSks += c.sks
      })
      activeSemIps = activeSks > 0 ? (activePoints / activeSks).toFixed(2) : '0.00'
      activeSemSks = activeSemCourses.reduce((acc, curr) => acc + curr.sks, 0)
    }

    return {
      cumulativeIpk,
      totalSks,
      semesterIps: activeSemIps,
      activeSemTotalSks: activeSemSks,
      totalAttemptedSks
    }
  }

  const metrics = calculateMetrics()

  // SKS Target Planner Calculator
  const handleCalculatePlanner = (e) => {
    e.preventDefault()

    const currIpk = parseFloat(currentIpk)
    const currSks = parseInt(currentSks)
    const tgtIpk = parseFloat(targetIpk)
    const planSks = parseInt(plannedSks)

    if (isNaN(currIpk) || isNaN(currSks) || isNaN(tgtIpk) || isNaN(planSks)) {
      addToast('Isi semua field planner dengan benar!', 'warning')
      return
    }

    if (currIpk < 0 || currIpk > 4.0 || tgtIpk < 0 || tgtIpk > 4.0) {
      addToast('IPK harus bernilai antara 0.00 s/d 4.00!', 'warning')
      return
    }

    if (planSks <= 0) {
      addToast('SKS rencana harus bernilai lebih besar dari 0!', 'warning')
      return
    }

    // Formula: TargetIPS = ((TargetIPK * (CurrentSKS + PlannedSKS)) - (CurrentIPK * CurrentSKS)) / PlannedSKS
    const totalSksFinal = currSks + planSks
    const targetIps = ((tgtIpk * totalSksFinal) - (currIpk * currSks)) / planSks

    let message = ''
    let impossible = false
    let targetText = targetIps.toFixed(2)

    if (targetIps > 4.0) {
      impossible = true
      message = `Tidak mungkin dicapai. Target IP semester ini melebihi 4.00 (${targetText}). Coba turunkan target IPK atau ambil SKS lebih banyak.`
    } else if (targetIps <= 0.0) {
      message = `Sangat mudah dicapai! Kamu tidak memerlukan nilai khusus semester ini karena target IPK sudah terlampaui.`
      targetText = '0.00'
    } else {
      // Find average grade required
      let requiredGrade = 'A'
      if (targetIps <= 2.0) requiredGrade = 'C'
      else if (targetIps <= 2.3) requiredGrade = 'C+'
      else if (targetIps <= 2.7) requiredGrade = 'B-'
      else if (targetIps <= 3.0) requiredGrade = 'B'
      else if (targetIps <= 3.3) requiredGrade = 'B+'
      else if (targetIps <= 3.7) requiredGrade = 'A-'
      
      message = `Kamu membutuhkan rata-rata IPS minimal ${targetText} di semester ini untuk mencapai target IPK ${tgtIpk.toFixed(2)}. Setara dengan rata-rata nilai: ${requiredGrade}.`
    }

    setPlannerResult({
      targetIps: targetText,
      message,
      impossible
    })
  }

  // Filter courses for active semester
  const activeSemesterCourses = localCourses.filter(c => c.semester === activeSemester)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-full)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.2s ease',
            }}
            aria-label="Kembali"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.title} style={{ margin: 0 }}>Kalkulator IPK</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Pantau pencapaian akademik dan rencanakan target kelulusan</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'calculator' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          Hitung IPK & IPS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'planner' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          Target & SKS Planner
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'calculator' ? (
          <div>
            {/* Dashboard Cards */}
            <div className={styles.overviewCard}>
              <div>
                <span className={styles.metricTitle}>IPK Kumulatif</span>
                <div className={styles.metricValue} style={{ color: 'var(--color-primary)' }}>
                  {metrics.cumulativeIpk}
                </div>
                <span className={styles.metricSubtext}>
                  {metrics.totalSks} SKS Dinilai / {metrics.totalAttemptedSks} Total
                </span>
              </div>
              <div>
                <span className={styles.metricTitle}>IPS Semester {activeSemester}</span>
                <div className={styles.metricValue} style={{ color: 'var(--color-success)' }}>
                  {metrics.semesterIps}
                </div>
                <span className={styles.metricSubtext}>
                  {metrics.activeSemTotalSks} SKS Terdaftar
                </span>
              </div>
            </div>

            {/* Semester Navigation Bar */}
            <div className={styles.semesterRow}>
              <button
                className={styles.navBtn}
                disabled={activeSemester <= 1}
                onClick={() => setActiveSemester(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className={styles.semesterTitle}>Semester {activeSemester}</h2>
              <button
                className={styles.navBtn}
                disabled={activeSemester >= 8}
                onClick={() => setActiveSemester(prev => prev + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Manual GPA/SKS Card */}
            <div className={styles.manualCard}>
              <div className={styles.manualCardHeader}>
                <h4 className={styles.manualCardTitle}>
                  Input Manual IPS & SKS (Semester {activeSemester})
                </h4>
                {manualGpa[activeSemester] && (
                  <span className={styles.manualBadge}>Manual</span>
                )}
              </div>
              
              <div className={styles.manualCardBody}>
                <div className={styles.manualInputGroup}>
                  <div className={styles.manualField}>
                    <label className={styles.manualLabel}>IPS (IP Semester)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      className={styles.manualInput}
                      placeholder="Contoh: 3.50"
                      value={manualIpsInput}
                      onChange={e => setManualIpsInput(e.target.value)}
                    />
                  </div>
                  <div className={styles.manualField}>
                    <label className={styles.manualLabel}>SKS Lulus</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      className={styles.manualInput}
                      placeholder="Contoh: 20"
                      value={manualSksInput}
                      onChange={e => setManualSksInput(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className={styles.manualActions}>
                  <button 
                    onClick={handleSaveManual} 
                    className={styles.manualSaveBtn}
                  >
                    Simpan
                  </button>
                  {manualGpa[activeSemester] && (
                    <button 
                      onClick={handleDeleteManual} 
                      className={styles.manualDeleteBtn}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Course Grades List */}
            {activeSemesterCourses.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={48} className={styles.emptyIcon} />
                <h3 style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                  Tidak ada mata kuliah
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>
                  Tambahkan mata kuliah untuk Semester {activeSemester} di modul Mata Kuliah terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className={styles.courseList}>
                {activeSemesterCourses.map(course => (
                  <div
                    key={course.id}
                    className={styles.courseItem}
                    style={{ borderLeftColor: course.color }}
                  >
                    <div className={styles.courseInfo}>
                      <h4 className={styles.courseName}>{course.name}</h4>
                      <span className={styles.courseMeta}>
                        {course.code ? `${course.code} • ` : ''} {course.sks} SKS
                      </span>
                    </div>

                    <select
                      className={styles.gradeSelect}
                      value={course.grade || ''}
                      onChange={e => handleGradeChange(course.id, e.target.value)}
                    >
                      <option value="">—</option>
                      {Object.keys(GRADE_VALUES)
                        .filter(Boolean)
                        .map(g => (
                          <option key={g} value={g}>
                            {g} ({GRADE_VALUES[g].toFixed(1)})
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SKS Planner Tab */
          <div>
            <form onSubmit={handleCalculatePlanner} className={styles.plannerForm}>
              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>IPK Saat Ini</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    className={styles.input}
                    placeholder="Contoh: 3.20"
                    value={currentIpk}
                    onChange={e => setCurrentIpk(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>SKS Terkumpul</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Contoh: 64"
                    value={currentSks}
                    onChange={e => setCurrentSks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target IPK Kelulusan</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    className={styles.input}
                    placeholder="Contoh: 3.50"
                    value={targetIpk}
                    onChange={e => setTargetIpk(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rencana SKS Semester Ini</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Contoh: 20"
                    value={plannedSks}
                    onChange={e => setPlannedSks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.calcBtn}>
                Hitung Rencana Target IPS
              </button>
            </form>

            {/* Results Panel */}
            {plannerResult && (
              <div className={styles.resultsCard}>
                <h3 className={styles.resultTitle}>Hasil Perencanaan</h3>
                <div
                  className={`${styles.targetGpa} ${
                    plannerResult.impossible ? styles.impossible : ''
                  }`}
                >
                  {plannerResult.impossible ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={24} />
                      <span>Impossible</span>
                    </div>
                  ) : (
                    <span>IPS Target: {plannerResult.targetIps}</span>
                  )}
                </div>
                <p className={styles.resultDesc}>
                  {plannerResult.impossible ? (
                    <span style={{ color: 'var(--color-danger)' }}>{plannerResult.message}</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                      <span>{plannerResult.message}</span>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
