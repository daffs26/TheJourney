import { create } from 'zustand'
import db from '../db/database'

export const useAppStore = create((set, get) => ({
  // User Profile
  profile: { name: '', prodi: 'Sistem Informasi', semester: 1 },
  onboarded: false,

  // UI State
  activeTab: 'home',
  isLoading: false,

  // Toast notifications
  toasts: [],

  // Init
  init: async () => {
    try {
      const onboarded = await db.settings.get('onboarded')
      const profileSetting = await db.settings.get('userProfile')

      set({
        onboarded: onboarded?.value === 'true',
        profile: profileSetting ? JSON.parse(profileSetting.value) : { name: '', prodi: 'Sistem Informasi', semester: 1 },
      })
    } catch (e) {
      console.error('App init error:', e)
    }
  },

  setProfile: async (profile) => {
    await db.settings.put({ key: 'userProfile', value: JSON.stringify(profile), updatedAt: new Date() })
    set({ profile })
  },

  setOnboarded: async () => {
    await db.settings.put({ key: 'onboarded', value: 'true', updatedAt: new Date() })
    set({ onboarded: true })
  },



  setActiveTab: (tab) => set({ activeTab: tab }),

  // Toast system
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    set(state => {
      const newToasts = [...state.toasts, { id, message, type }]
      // Batasi pop-up notifikasi maksimal hanya 2 yang tampil di layar
      if (newToasts.length > 2) {
        return { toasts: newToasts.slice(-2) }
      }
      return { toasts: newToasts }
    })
    setTimeout(() => get().removeToast(id), duration)
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
}))
