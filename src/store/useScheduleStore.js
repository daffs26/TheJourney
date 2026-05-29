import { create } from 'zustand'
import db from '../db/database'

export const useScheduleStore = create((set, get) => ({
  schedules: [],
  loading: false,
  reminderTimeouts: [],

  fetchSchedules: async () => {
    set({ loading: true })
    const schedules = await db.schedules.toArray()
    // Enrich with course data
    const enriched = await Promise.all(schedules.map(async s => {
      const course = s.courseId ? await db.courses.get(s.courseId) : null
      return { ...s, course }
    }))
    set({ schedules: enriched, loading: false })
    get().scheduleTodayReminders()
  },

  addSchedule: async (schedule) => {
    const id = await db.schedules.add({ ...schedule, createdAt: new Date() })
    await get().fetchSchedules()
    return id
  },

  updateSchedule: async (id, data) => {
    await db.schedules.update(id, { ...data })
    await get().fetchSchedules()
  },

  deleteSchedule: async (id) => {
    await db.schedules.delete(id)
    await get().fetchSchedules()
  },

  getByDay: (day) => {
    return get().schedules
      .filter(s => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  },

  getTodaySchedule: () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const today = days[new Date().getDay()]
    return get().getByDay(today)
  },

  getNextClass: () => {
    const todaySchedule = get().getTodaySchedule()
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    return todaySchedule.find(s => s.startTime > currentTime) || null
  },

  clearReminders: () => {
    get().reminderTimeouts.forEach(clearTimeout)
    set({ reminderTimeouts: [] })
  },

  scheduleTodayReminders: () => {
    get().clearReminders()
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const todaySchedule = get().getTodaySchedule()
    const now = new Date()

    todaySchedule.forEach(sched => {
      const [hours, minutes] = sched.startTime.split(':').map(Number)
      const classTime = new Date()
      classTime.setHours(hours, minutes, 0, 0)

      // Reminder 10 minutes before class
      const reminderTime = new Date(classTime.getTime() - 10 * 60 * 1000)
      const delay = reminderTime.getTime() - now.getTime()

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          new Notification('📚 Kelas Mulai 10 Menit Lagi', {
            body: `${sched.course?.name || sched.courseName} akan dimulai pukul ${sched.startTime} di ${sched.room || 'kelas'}.`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: `sched-${sched.id}`,
          })
        }, delay)
        set(state => ({ reminderTimeouts: [...state.reminderTimeouts, timeoutId] }))
      }
    })
  },
}))
