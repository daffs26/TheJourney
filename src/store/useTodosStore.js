import { create } from 'zustand'
import db from '../db/database'

export const useTodosStore = create((set, get) => ({
  todos: [],
  loading: false,
  filter: 'all', // all | active | completed
  sortBy: 'deadline', // deadline | priority | created

  fetchTodos: async () => {
    set({ loading: true })
    let todos = await db.todos.orderBy('createdAt').reverse().toArray()
    set({ todos, loading: false })
  },

  addTodo: async (todo) => {
    const id = await db.todos.add({
      ...todo,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    })
    if (todo.reminderAt) {
      get().scheduleReminder(id, todo.title, todo.reminderAt)
    }
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

  scheduleReminder: (todoId, title, reminderAt) => {
    const delay = new Date(reminderAt) - new Date()
    if (delay > 0 && 'Notification' in window) {
      setTimeout(async () => {
        if (Notification.permission === 'granted') {
          new Notification('⏰ TheJourney Reminder', {
            body: title,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: `todo-${todoId}`,
          })
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
