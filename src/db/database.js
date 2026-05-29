import Dexie from 'dexie'

export const db = new Dexie('TheJourneyDB')

db.version(3).stores({
  // Mata Kuliah
  courses: '++id, name, code, sks, lecturer, room, semester, color, createdAt',
  
  // Pertemuan per Matkul
  meetings: '++id, courseId, meetingNumber, date, topic, status, notes, createdAt',
  
  // Materi per Pertemuan
  materials: '++id, meetingId, courseId, name, type, content, summary, createdAt',
  
  // Kuis per Pertemuan
  quizzes: '++id, meetingId, courseId, question, options, answer, explanation, createdAt',
  
  // Hasil Kuis
  quizResults: '++id, quizId, meetingId, selectedAnswer, isCorrect, answeredAt',

  // Jadwal Kuliah (weekly schedule)
  schedules: '++id, courseId, day, startTime, endTime, room, color, createdAt',

  // To-Do
  todos: '++id, title, description, category, priority, deadline, reminderAt, completed, completedAt, parentId, courseId, createdAt',

  // AI Chat History
  chatSessions: '++id, title, context, createdAt, updatedAt',
  chatMessages: '++id, sessionId, role, content, createdAt',

  // Referensi Jurnal
  references: '++id, courseId, title, authors, year, journal, doi, abstract, url, pdfUrl, citation_apa, citation_ieee, tags, createdAt',

  // Keuangan
  transactions: '++id, type, amount, category, description, date, createdAt',
  budgets: '++id, category, limit, month, year, createdAt',

  // Lokasi Favorit (Maps)
  savedPlaces: '++id, name, address, lat, lng, type, createdAt',

  // Flashcard
  decks: '++id, courseId, name, description, createdAt',
  flashcards: '++id, deckId, front, back, difficulty, nextReview, interval, repetitions, easeFactor, createdAt',

  // IPK / Nilai
  gradeEntries: '++id, courseId, semester, assignmentScore, midtermScore, finalScore, practiceScore, customComponents, estimatedGrade, createdAt',

  // Mood Tracker
  moodEntries: '++id, mood, energy, note, tags, date, createdAt',

  // Pomodoro Sessions
  pomodoroSessions: '++id, type, duration, completedAt, date',
  pomodoroSettings: '&key, value, updatedAt',

  // Template Laporan / Makalah
  reportTemplates: '++id, name, type, category, content, tags, createdAt',

  // Pembelajaran Mandiri (Kurikulum SI)
  learningTopics: '++id, subject, topic, subtopic, status, notes, completedAt, createdAt',

  // Bibliography
  bibliographies: '++id, courseId, title, authors, year, publisher, journal, volume, issue, pages, doi, url, type, note, createdAt',

  // Dokumen / Upload Dokumen
  documents: '++id, name, type, size, notes, uploadedAt',

  // Pengaturan App
  settings: '&key, value, updatedAt',
})

// Seed initial settings
db.on('ready', async () => {
  const count = await db.settings.count()
  if (count === 0) {
    await db.settings.bulkAdd([
      { key: 'geminiApiKey', value: '', updatedAt: new Date() },
      { key: 'userProfile', value: JSON.stringify({ name: '', prodi: 'Sistem Informasi', semester: 1 }), updatedAt: new Date() },
      { key: 'onboarded', value: 'false', updatedAt: new Date() },
      { key: 'streakData', value: JSON.stringify({ count: 0, lastDate: null }), updatedAt: new Date() },
    ])
  }
})

export default db
