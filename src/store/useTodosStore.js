import { create } from 'zustand'
import db from '../db/database'

let activeTimers = {}

export const useTodosStore = create((set, get) => ({
  todos: [],
  loading: false,
  filter: 'all', // all | active | completed
  sortBy: 'deadline', // deadline | priority | created

  fetchTodos: async () => {
    set({ loading: true })
    let todos = await db.todos.orderBy('createdAt').reverse().toArray()
    set({ todos, loading: false })
    get().rescheduleAllReminders()
  },

  addTodo: async (todo) => {
    const id = await db.todos.add({
      ...todo,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    })
    await get().fetchTodos()
    return id
  },

  updateTodo: async (id, data) => {
    await db.todos.update(id, { ...data })
    await get().fetchTodos()
  },

  toggleTodo: async (id) => {
    const todo = await db.todos.get(id)
    const completed = !todo.completed
    await db.todos.update(id, {
      completed,
      completedAt: completed ? new Date() : null,
    })
    await get().fetchTodos()
  },

  deleteTodo: async (id) => {
    // Delete sub-tasks too
    await db.todos.where('parentId').equals(id).delete()
    await db.todos.delete(id)
    if (activeTimers[id]) {
      clearTimeout(activeTimers[id])
      delete activeTimers[id]
    }
    await get().fetchTodos()
  },

  getSubTasks: async (parentId) => {
    return await db.todos.where('parentId').equals(parentId).toArray()
  },

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),

  getFilteredTodos: () => {
    const { todos, filter } = get()
    let filtered = todos.filter(t => !t.parentId) // top-level only
    if (filter === 'active')    filtered = filtered.filter(t => !t.completed)
    if (filter === 'completed') filtered = filtered.filter(t => t.completed)
    return filtered
  },

  rescheduleAllReminders: () => {
    // Clear all existing timeouts
    Object.keys(activeTimers).forEach(id => {
      clearTimeout(activeTimers[id])
      delete activeTimers[id]
    })

    const { todos } = get()
    // Scan all active (uncompleted) top-level and sub-todos
    todos.forEach(todo => {
      if (!todo.completed) {
        if (todo.reminderType === 'once' || todo.reminderType === 'weekly') {
          get().scheduleReminder(todo.id, todo.title, todo.reminderType, todo.reminderAt, todo.createdAt)
        } else if (todo.reminderAt && !todo.reminderType) {
          // Fallback for legacy todos that have reminderAt but no reminderType
          get().scheduleReminder(todo.id, todo.title, 'once', todo.reminderAt, todo.createdAt)
        }
      }
    })
  },

  scheduleReminder: (todoId, title, reminderType, reminderAt, createdAt) => {
    // Clear any existing timer for this todoId first
    if (activeTimers[todoId]) {
      clearTimeout(activeTimers[todoId])
      delete activeTimers[todoId]
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') return

    let delay = 0
    let targetTime = 0

    if (reminderType === 'once' && reminderAt) {
      targetTime = new Date(reminderAt).getTime()
      delay = targetTime - Date.now()
    } else if (reminderType === 'weekly' && createdAt) {
      const createdTime = new Date(createdAt).getTime()
      const now = Date.now()
      const msPerWeek = 7 * 24 * 60 * 60 * 1000

      if (createdTime > now) {
        targetTime = createdTime + msPerWeek
      } else {
        const diff = now - createdTime
        const weeksPassed = Math.floor(diff / msPerWeek)
        targetTime = createdTime + (weeksPassed + 1) * msPerWeek
      }
      delay = targetTime - now
    }

    if (delay > 0) {
      activeTimers[todoId] = setTimeout(async () => {
        if (Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
            try {
              const registration = await navigator.serviceWorker.ready
              await registration.showNotification('⏰ TheJourney Reminder', {
                body: title,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: `todo-${todoId}`,
                vibrate: [200, 100, 200],
                requireInteraction: true
              })
            } catch (err) {
              console.error('Failed to show SW notification, falling back to window Notification:', err)
              new Notification('⏰ TheJourney Reminder', {
                body: title,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: `todo-${todoId}`,
              })
            }
          } else {
            new Notification('⏰ TheJourney Reminder', {
              body: title,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-72.png',
              tag: `todo-${todoId}`,
            })
          }
        }
        delete activeTimers[todoId]

        // If weekly, schedule the next occurrence
        if (reminderType === 'weekly') {
          get().scheduleReminder(todoId, title, reminderType, reminderAt, createdAt)
        }
      }, delay)
    }
  },

  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  },

  getStats: () => {
    const todos = get().todos.filter(t => !t.parentId)
    const total = todos.length
    const completed = todos.filter(t => t.completed).length
    const overdue = todos.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length
    const today = todos.filter(t => {
      if (!t.deadline) return false
      const d = new Date(t.deadline)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length
    return { total, completed, overdue, today }
  },
}))
