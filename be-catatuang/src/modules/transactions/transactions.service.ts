import { Context } from 'hono'
import { Env } from '../../config/env'
import { transactionsRepository } from './transactions.repository'
import { NotFoundError } from '../../lib/errors'
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionQuery,
} from './transactions.validator'

export const transactionsService = (c: Context<Env>) => {
  const repo = transactionsRepository(c)

  return {
    list: async (userId: number, query: ListTransactionQuery) => {
      const rows = await repo.findAll({ userId, ...query })

      const totalMasuk = rows
        .filter((t) => t.type === 'masuk')
        .reduce((sum, t) => sum + t.amount, 0)
      const totalKeluar = rows
        .filter((t) => t.type === 'keluar')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        data: rows,
        total: rows.length,
        limit: query.limit,
        offset: query.offset,
        totalMasuk,
        totalKeluar,
      }
    },

    create: async (userId: number, input: CreateTransactionInput) => {
      return repo.create({ ...input, userId })
    },

    update: async (
      userId: number,
      id: number,
      input: UpdateTransactionInput
    ) => {
      const existing = await repo.findById(id, userId)
      if (!existing) throw new NotFoundError('Transaksi tidak ditemukan')

      const updated = await repo.update(id, userId, input)
      return updated
    },

    delete: async (userId: number, id: number) => {
      const existing = await repo.findById(id, userId)
      if (!existing) throw new NotFoundError('Transaksi tidak ditemukan')

      await repo.delete(id, userId)
      return null
    },

    monthlySummary: async (userId: number, last: number) => {
      const months = getPastMonths(last)
      const rows = await repo.monthlySummary(userId, months)

      return rows.map((r) => ({
        ...r,
        cashflow: r.pemasukan - r.pengeluaran,
      }))
    },
  }
}

// Hasilkan array ["YYYY-MM", ...] dari `last` bulan ke belakang (termasuk bulan ini)
function getPastMonths(last: number): string[] {
  const result: string[] = []
  const now = new Date()

  for (let i = last - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    result.push(`${yyyy}-${mm}`)
  }

  return result
}
