import { create } from 'zustand'
import db from '../db/database'

export const useCoursesStore = create((set, get) => ({
  courses: [],
  loading: false,

  fetchCourses: async () => {
    set({ loading: true })
    const courses = await db.courses.orderBy('name').toArray()
    set({ courses, loading: false })
  },

  addCourse: async (course) => {
    const id = await db.courses.add({
      ...course,
      createdAt: new Date(),
    })
    // Auto-create 16 meetings
    const meetings = Array.from({ length: 16 }, (_, i) => ({
      courseId: id,
      meetingNumber: i + 1,
      date: null,
      topic: `Pertemuan ${i + 1}`,
      status: 'pending', // pending | hadir | tidak_hadir | izin
      notes: '',
      createdAt: new Date(),
    }))
    await db.meetings.bulkAdd(meetings)
    await get().fetchCourses()
    return id
  },

  updateCourse: async (id, data) => {
    await db.courses.update(id, { ...data })
    await get().fetchCourses()
  },

  deleteCourse: async (id) => {
    // Cascade delete
    const meetings = await db.meetings.where('courseId').equals(id).toArray()
    for (const m of meetings) {
      await db.materials.where('meetingId').equals(m.id).delete()
      await db.quizzes.where('meetingId').equals(m.id).delete()
    }
    await db.meetings.where('courseId').equals(id).delete()
    await db.schedules.where('courseId').equals(id).delete()
    await db.courses.delete(id)
    await get().fetchCourses()
  },

  // Meetings
  getMeetings: async (courseId) => {
    return await db.meetings.where('courseId').equals(courseId).sortBy('meetingNumber')
  },

  updateMeeting: async (id, data) => {
    await db.meetings.update(id, { ...data })
  },

  // Materials
  getMaterials: async (meetingId) => {
    return await db.materials.where('meetingId').equals(meetingId).toArray()
  },

  addMaterial: async (material) => {
    return await db.materials.add({ ...material, createdAt: new Date() })
  },

  deleteMaterial: async (id) => {
    await db.materials.delete(id)
  },

  updateMaterialSummary: async (id, summary) => {
    await db.materials.update(id, { summary })
  },

  // Quizzes
  getQuizzes: async (meetingId) => {
    return await db.quizzes.where('meetingId').equals(meetingId).toArray()
  },

  addQuiz: async (quiz) => {
    return await db.quizzes.add({ ...quiz, createdAt: new Date() })
  },

  deleteQuiz: async (id) => {
    await db.quizzes.delete(id)
    await db.quizResults.where('quizId').equals(id).delete()
  },

  saveQuizResult: async (result) => {
    return await db.quizResults.add({ ...result, answeredAt: new Date() })
  },

  getAttendanceSummary: async (courseId) => {
    const meetings = await db.meetings.where('courseId').equals(courseId).toArray()
    const total = meetings.length
    const hadir = meetings.filter(m => m.status === 'hadir').length
    const izin  = meetings.filter(m => m.status === 'izin').length
    const done  = meetings.filter(m => m.status !== 'pending').length
    return { total, hadir, izin, done, percentage: done > 0 ? Math.round((hadir / done) * 100) : 0 }
  },
}))
