import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Trash2,
  Utensils,
  Car,
  BookOpen,
  Coffee,
  Home,
  CreditCard,
  PlusCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { useAppStore } from '../../store/useAppStore'
import styles from './Finance.module.css'

const CATEGORIES = [
  { name: 'Makanan & Minuman', icon: Utensils, color: '#f59e0b' },
  { name: 'Transportasi', icon: Car, color: '#3b82f6' },
  { name: 'Kuliah & Buku', icon: BookOpen, color: '#10b981' },
  { name: 'Hiburan & Nongkrong', icon: Coffee, color: '#ec4899' },
  { name: 'Kost / Bulanan', icon: Home, color: '#8b5cf6' },
  { name: 'Lain-lain', icon: CreditCard, color: '#64748b' }
]

const DEFAULT_TX_FORM = {
  type: 'expense',
  amount: '',
  category: CATEGORIES[0].name,
  description: '',
  date: new Date().toISOString().split('T')[0]
}

export default function Finance() {
  const navigate = useNavigate()
  const { addToast } = useAppStore()
  const {
    transactions,
    budgets,
    loading,
    fetchTransactions,
    fetchBudgets,
    addTransaction,
    deleteTransaction,
    setBudget,
    getMonthlySummary,
    getCategoryStats
  } = useFinanceStore()

  // State
  const [showTxModal, setShowTxModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [txForm, setTxForm] = useState(DEFAULT_TX_FORM)
  const [budgetFormValues, setBudgetFormValues] = useState({})

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchTransactions()
    fetchBudgets(currentMonth, currentYear)
  }, [])

  useEffect(() => {
    // Populate budget edit form when budgets are loaded
    const initialValues = {}
    CATEGORIES.forEach(cat => {
      const b = budgets.find(x => x.category === cat.name)
      initialValues[cat.name] = b ? b.limit : ''
    })
    setBudgetFormValues(initialValues)
  }, [budgets])

  const summary = getMonthlySummary(currentMonth, currentYear)
  const categoryStats = getCategoryStats(currentMonth, currentYear)

  // Format currency helpers
  const formatRp = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Handle transaction save
  const handleAddTx = async (e) => {
    e.preventDefault()
    const amt = parseFloat(txForm.amount)
    if (!amt || amt <= 0) {
      addToast('Masukkan nominal transaksi yang valid!', 'warning')
      return
    }
    if (!txForm.description.trim()) {
      addToast('Masukkan keterangan transaksi!', 'warning')
      return
    }

    try {
      await addTransaction({
        type: txForm.type,
        amount: amt,
        category: txForm.category,
        description: txForm.description,
        date: txForm.date
      })
      addToast('Transaksi berhasil dicatat!', 'success')
      setTxForm(DEFAULT_TX_FORM)
      setShowTxModal(false)
    } catch (err) {
      addToast('Gagal mencatat transaksi', 'error')
    }
  }

  // Handle budget save
  const handleSaveBudgets = async () => {
    try {
      for (const [category, value] of Object.entries(budgetFormValues)) {
        const limit = value === '' ? 0 : parseFloat(value)
        await setBudget(category, limit, currentMonth, currentYear)
      }
      addToast('Anggaran bulanan diperbarui!', 'success')
      setShowBudgetModal(false)
    } catch (err) {
      addToast('Gagal menyimpan anggaran', 'error')
    }
  }

  const handleDeleteTx = async (id, desc) => {
    if (confirm(`Hapus catatan transaksi "${desc}"?`)) {
      await deleteTransaction(id)
      addToast('Transaksi dihapus', 'info')
    }
  }

  // Render Category Icon Helper
  const getCategoryIcon = (catName) => {
    const matched = CATEGORIES.find(c => c.name === catName)
    const IconComponent = matched ? matched.icon : HelpCircle
    const color = matched ? matched.color : '#64748b'
    return <IconComponent size={18} style={{ color }} />
  }

  // Donut Chart Calculation
  const getDonutSegments = () => {
    const expensesOnly = categoryStats.filter(c => c.amount > 0)
    const totalExpenses = expensesOnly.reduce((acc, curr) => acc + curr.amount, 0)
    
    if (totalExpenses === 0) return []

    let accumulatedPercentage = 0
    return expensesOnly.map(stat => {
      const catInfo = CATEGORIES.find(c => c.name === stat.category)
      const color = catInfo ? catInfo.color : '#64748b'
      const percentage = (stat.amount / totalExpenses) * 100
      
      const segment = {
        category: stat.category,
        amount: stat.amount,
        percentage,
        color,
        offset: accumulatedPercentage
      }
      accumulatedPercentage += percentage
      return segment
    })
  }

  const donutSegments = getDonutSegments()
  const r = 40
  const circ = 2 * Math.PI * r // ~251.32

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
            <h1 className={styles.title} style={{ margin: 0 }}>Keuangan Saya</h1>
            <p className={styles.subtitle} style={{ margin: 0 }}>Pantau pengeluaran dan kelola anggaran bulanan</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Sisa Saldo Bulan Ini</div>
          <div className={styles.balanceAmount}>{formatRp(summary.balance)}</div>

          <div className={styles.flowRow}>
            <div className={styles.flowItem}>
              <div className={`${styles.flowIcon} styles.incomeIcon`}>
                <ArrowUpRight size={18} style={{ color: 'var(--color-success)' }} />
              </div>
              <div className={styles.flowInfo}>
                <span className={styles.flowLabel}>Pemasukan</span>
                <span className={styles.flowAmount}>{formatRp(summary.income)}</span>
              </div>
            </div>
            <div className={styles.flowItem}>
              <div className={`${styles.flowIcon} styles.expenseIcon`}>
                <ArrowDownRight size={18} style={{ color: 'var(--color-danger)' }} />
              </div>
              <div className={styles.flowInfo}>
                <span className={styles.flowLabel}>Pengeluaran</span>
                <span className={styles.flowAmount}>{formatRp(summary.expense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className={styles.actionRow}>
          <button className={`${styles.actionBtn} ${styles.primaryAction}`} onClick={() => setShowTxModal(true)}>
            <Plus size={16} /> Catat Transaksi
          </button>
          <button className={styles.actionBtn} onClick={() => setShowBudgetModal(true)}>
            <Settings size={16} /> Atur Anggaran
          </button>
        </div>

        {/* Expense share donut chart */}
        {donutSegments.length > 0 && (
          <div className={styles.chartCard}>
            <h2 className={styles.sectionTitle}>Proporsi Pengeluaran</h2>
            <div className={styles.donutWrapper}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className={styles.donutSvg}>
                  <circle className={styles.donutBg} cx="55" cy="55" r={r} />
                  {donutSegments.map((seg, idx) => {
                    const strokeLength = (seg.percentage / 100) * circ
                    const strokeOffset = -(seg.offset / 100) * circ
                    return (
                      <circle
                        key={idx}
                        className={styles.donutSegment}
                        cx="55"
                        cy="55"
                        r={r}
                        stroke={seg.color}
                        strokeDasharray={`${strokeLength} ${circ - strokeLength}`}
                        strokeDashoffset={strokeOffset}
                      />
                    )
                  })}
                </svg>
                <div className={styles.donutCenter}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-sub)', display: 'block' }}>Total</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    Rp{(summary.expense / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>

              <div className={styles.legendList}>
                {donutSegments.slice(0, 4).map((seg, idx) => (
                  <div key={idx} className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: seg.color }} />
                    <span className={styles.legendLabel}>{seg.category.split(' ')[0]}</span>
                    <span className={styles.legendVal}>{Math.round(seg.percentage)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Budgets Tracker Card */}
        {categoryStats.some(c => c.limit > 0) && (
          <div className={styles.budgetCard}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Progress Anggaran</h2>
            {categoryStats
              .filter(c => c.limit > 0)
              .map((bgt, idx) => {
                const isOver = bgt.amount > bgt.limit
                const pct = bgt.limit > 0 ? Math.round((bgt.amount / bgt.limit) * 100) : 0
                const fillPct = Math.min(pct, 100)
                
                let fillClass = styles.progressSafe
                if (pct >= 85 && pct < 100) fillClass = styles.progressWarning
                if (isOver) fillClass = styles.progressOver

                return (
                  <div key={idx} className={styles.budgetItem}>
                    <div className={styles.budgetHeader}>
                      <span className={styles.budgetCat}>{bgt.category}</span>
                      <span className={styles.budgetMeta}>
                        {formatRp(bgt.amount)} / {formatRp(bgt.limit)} ({pct}%)
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={`${styles.progressFill} ${fillClass}`} style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        )}

        {/* Transactions List */}
        <h2 className={styles.sectionTitle}>Riwayat Transaksi</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-sub)' }}>
            Loading transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <Wallet size={40} className={styles.emptyIcon} />
            <h3>Belum ada transaksi</h3>
            <p>Mulai catat pemasukan atau pengeluaran pertamamu untuk melacak keuangan.</p>
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.map(tx => {
              const matchedCat = CATEGORIES.find(c => c.name === tx.category)
              const catBg = matchedCat ? `${matchedCat.color}15` : 'var(--color-border-light)'
              const isExpense = tx.type === 'expense'

              return (
                <div key={tx.id} className={styles.txCard}>
                  <div className={styles.txIcon} style={{ backgroundColor: catBg }}>
                    {getCategoryIcon(tx.category)}
                  </div>
                  <div className={styles.txBody}>
                    <h4 className={styles.txTitle}>{tx.description}</h4>
                    <div className={styles.txMeta}>
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div className={`${styles.txAmount} ${isExpense ? styles.amtExpense : styles.amtIncome}`}>
                    {isExpense ? '-' : '+'}{formatRp(tx.amount)}
                  </div>
                  <button className={styles.deleteTxBtn} onClick={() => handleDeleteTx(tx.id, tx.description)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showTxModal && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTxModal(false)}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Catat Transaksi Baru</h3>
              <form onSubmit={handleAddTx} className={styles.form}>
                <div className={styles.typeSelector}>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${txForm.type === 'expense' ? styles.typeActiveExpense : ''}`}
                    onClick={() => setTxForm(f => ({ ...f, type: 'expense' }))}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    className={`${styles.typeBtn} ${txForm.type === 'income' ? styles.typeActiveIncome : ''}`}
                    onClick={() => setTxForm(f => ({ ...f, type: 'income' }))}
                  >
                    Pemasukan
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Nominal (Rp) *</label>
                  <input
                    type="number"
                    className={styles.input}
                    placeholder="Contoh: 15000"
                    value={txForm.amount}
                    onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className={styles.grid2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Kategori</label>
                    <select
                      className={styles.select}
                      value={txForm.category}
                      onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tanggal</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={txForm.date}
                      onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Keterangan *</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Contoh: Nasi padang siang, Print makalah"
                    value={txForm.description}
                    onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowTxModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className={styles.saveBtn}>
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Budget Modal */}
      <AnimatePresence>
        {showBudgetModal && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetModal(false)}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <h3 className={styles.modalTitle}>Atur Anggaran Bulanan</h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '16px' }}>
                Atur batas pengeluaran bulanan untuk tiap kategori. Kosongkan atau isi 0 jika tidak dianggarkan.
              </p>
              
              <div className={styles.form}>
                {CATEGORIES.map(cat => (
                  <div key={cat.name} className={styles.budgetFormRow}>
                    <span className={styles.budgetFormLabel}>{cat.name}</span>
                    <input
                      type="number"
                      className={styles.budgetFormInput}
                      placeholder="0"
                      value={budgetFormValues[cat.name] || ''}
                      onChange={e => setBudgetFormValues(prev => ({ ...prev, [cat.name]: e.target.value }))}
                    />
                  </div>
                ))}

                <div className={styles.formActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowBudgetModal(false)}>
                    Batal
                  </button>
                  <button type="button" className={styles.saveBtn} onClick={handleSaveBudgets}>
                    Simpan Anggaran
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
