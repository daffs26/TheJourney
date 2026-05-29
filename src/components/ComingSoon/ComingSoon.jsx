import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Construction } from 'lucide-react'

/**
 * Generic coming-soon placeholder for modules under construction.
 * Usage: export default function Maps() { return <ComingSoon name="Maps & Navigasi" icon={Map} color="var(--color-mod-maps)" /> }
 */
export default function ComingSoon({ name = 'Fitur', icon: Icon = Construction, color = 'var(--color-primary)' }) {
  const navigate = useNavigate()
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, paddingBottom: 'calc(72px + 16px)' }}>
      <motion.div
        style={{ width: 80, height: 80, borderRadius: 20, background: `${color}20`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Icon size={36} color={color} strokeWidth={1.5} />
      </motion.div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>{name}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sedang dikembangkan...<br />Akan segera hadir! 🚀</p>
      </div>
      <button
        onClick={() => navigate('/')}
        style={{ marginTop: 8, padding: '10px 24px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font-family)', fontWeight: 600, cursor: 'pointer' }}
      >
        ← Kembali
      </button>
    </div>
  )
}
