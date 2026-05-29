import { create } from 'zustand'
import db from '../db/database'

export const useFinanceStore = create((set, get) => ({
  transactions: [],
  budgets: [],
  loading: false,

  fetchTransactions: async () => {
    set({ loading: true })
    const txs = await db.transactions.orderBy('date').reverse().toArray()
    set({ transactions: txs, loading: false })
  },

  addTransaction: async (tx) => {
    const id = await db.transactions.add({
      ...tx,
      createdAt: new Date(),
    })
    await get().fetchTransactions()
    return id
  },

  deleteTransaction: async (id) => {
    await db.transactions.delete(id)
    await get().fetchTransactions()
  },

  fetchBudgets: async (month = new Date().getMonth(), year = new Date().getFullYear()) => {
    const bgts = await db.budgets.where({ month, year }).toArray()
    set({ budgets: bgts })
  },

  setBudget: async (category, limit, month = new Date().getMonth(), year = new Date().getFullYear()) => {
    const existing = await db.budgets.where({ category, month, year }).first()
    if (existing) {
      await db.budgets.update(existing.id, { limit })
    } else {
      await db.budgets.add({
        category,
        limit,
        month,
        year,
        createdAt: new Date(),
      })
    }
    await get().fetchBudgets(month, year)
  },

  getMonthlySummary: (month = new Date().getMonth(), year = new Date().getFullYear()) => {
    const { transactions } = get()
    let income = 0
    let expense = 0

    transactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (t.type === 'income') {
          income += t.amount
        } else {
          expense += t.amount
        }
      }
    })

    return { income, expense, balance: income - expense }
  },

  getCategoryStats: (month = new Date().getMonth(), year = new Date().getFullYear()) => {
    const { transactions, budgets } = get()
    const stats = {}

    // Group expenses by category
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getMonth() === month && d.getFullYear() === year && t.type === 'expense') {
        if (!stats[t.category]) {
          stats[t.category] = { amount: 0, limit: 0 }
        }
        stats[t.category].amount += t.amount
      }
    })

    // Attach budgets
    budgets.forEach(b => {
      if (!stats[b.category]) {
        stats[b.category] = { amount: 0, limit: 0 }
      }
      stats[b.category].limit = b.limit
    })

    return Object.entries(stats).map(([category, data]) => ({
      category,
      amount: data.amount,
      limit: data.limit,
      percentage: data.limit > 0 ? Math.min(Math.round((data.amount / data.limit) * 100), 100) : 0,
      overBudget: data.limit > 0 && data.amount > data.limit,
    }))
  },
}))

export default useFinanceStore
