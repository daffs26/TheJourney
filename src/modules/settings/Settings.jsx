import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings2, User, Info, ArrowLeft, Save } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import styles from './Settings.module.css'

const AVATAR_GRADIENTS = {
  blue: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  purple: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  teal: 'linear-gradient(135deg, #14B8A6, #0F766E)',
  emerald: 'linear-gradient(135deg, #10B981, #047857)',
  orange: 'linear-gradient(135deg, #F97316, #C2410C)'
}

export default function Settings() {
  const navigate = useNavigate()
  const { profile, setProfile, addToast } = useAppStore()
  const [name, setName] = useState(profile.name)
  const [semester, setSemester] = useState(String(profile.semester))
  const [avatarColor, setAvatarColor] = useState(profile.avatarColor || 'blue')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await setProfile({ 
      ...profile, 
      name: name.trim(), 
      semester: parseInt(semester),
      avatarColor 
    })
    addToast('Pengaturan disimpan!', 'success')
    setSaving(false)
  }

  const initialLetter = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Pengaturan</h1>
      </div>

      <div className={styles.content}>
        <Section title="Profil" icon={User}>
          <div className={styles.avatarSetup}>
            <div 
              className={styles.avatarPreview}
              style={{ background: AVATAR_GRADIENTS[avatarColor] }}
            >
              {initialLetter}
            </div>
            <div className={styles.avatarSelector}>
              {Object.keys(AVATAR_GRADIENTS).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.avatarOption} ${avatarColor === color ? styles.avatarOptionActive : ''}`}
                  style={{ background: AVATAR_GRADIENTS[color] }}
                  onClick={() => setAvatarColor(color)}
                  title={`Warna ${color}`}
                />
              ))}
            </div>
          </div>

          <Field label="Nama Kamu">
            <input
              id="settings-name"
              className={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama kamu"
            />
          </Field>
          <Field label="Program Studi">
            <input className={styles.input} value="Sistem Informasi" disabled />
          </Field>
          <Field label="Semester">
            <select id="settings-semester" className={styles.input} value={semester} onChange={e => setSemester(e.target.value)}>
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i+1} value={i+1}>Semester {i+1}</option>
              ))}
            </select>
          </Field>
        </Section>



        <Section title="Tentang App" icon={Info}>
          <div className={styles.about}>
            <div className={styles.appLogo}>🎓</div>
            <div>
              <p className={styles.appName}>TheJourney</p>
              <p className={styles.appVersion}>v1.0.0 · Sistem Informasi Edition</p>
              <p className={styles.appDesc}>All-in-one student productivity app</p>
            </div>
          </div>
        </Section>

        <motion.button
          id="settings-save"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Save size={18} />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </motion.button>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon size={16} className={styles.sectionIcon} />
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}
