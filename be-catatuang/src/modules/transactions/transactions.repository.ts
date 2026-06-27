import { Context } from 'hono'
import { Env } from '../../config/env'
import { getDb } from '../../db/client'
import { transactions, Transaction, NewTransaction } from '../../db'
import { eq, and, like, sql, desc } from 'drizzle-orm'

export const transactionsRepository = (c: Context<Env>) => {
  const db = getDb(c)

  return {
    findAll: async (params: {
      userId: number
      month?: string
      q?: string
      type?: 'masuk' | 'keluar'
      limit?: number | string // antisipasi kalau tipenya string dari query params
      offset?: number | string
    }): Promise<Transaction[]> => {
      const conditions = [eq(transactions.userId, params.userId)]

      if (params.month) {
        conditions.push(like(transactions.date, `${params.month}%`))
      }
      if (params.q) {
        conditions.push(like(transactions.description, `%${params.q}%`))
      }
      if (params.type) {
        conditions.push(eq(transactions.type, params.type))
      }

      // Pastikan limit dan offset dikonversi ke number dan punya fallback yang aman
      const parsedLimit = params.limit ? Number(params.limit) : 10
      const parsedOffset = params.offset ? Number(params.offset) : 0

      // Antisipasi kalau frontend tidak sengaja mengirim limit = 0
      const finalLimit = parsedLimit > 0 ? parsedLimit : 10

      return db
        .select()
        .from(transactions)
        .where(and(...conditions))
        // .orderBy(transactions.date, transactions.createdAt) // Tips: Tidak perlu pakai sql`...` jika fieldnya default DESC, tapi kalau mau kustom deskripsi order tinggal pakai desc(transactions.date)
        .orderBy(desc(transactions.date), desc(transactions.createdAt)) // <--- disarankan pakai ini lebih type-safe
        .limit(finalLimit)
        .offset(parsedOffset)
    },

    findById: async (id: number, userId: number): Promise<Transaction | null> => {
      const result = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .limit(1)
      return result[0] ?? null
    },

    create: async (data: NewTransaction): Promise<Transaction> => {
      const result = await db
        .insert(transactions)
        .values(data)
        .returning()
      return result[0]
    },

    update: async (
      id: number,
      userId: number,
      data: Partial<Pick<Transaction, 'type' | 'amount' | 'description' | 'date'>>
    ): Promise<Transaction | null> => {
      const result = await db
        .update(transactions)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning()
      return result[0] ?? null
    },

    delete: async (id: number, userId: number): Promise<boolean> => {
      const result = await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
        .returning()
      return result.length > 0
    },

    // Agregasi per bulan untuk chart — dihitung server-side
    monthlySummary: async (
      userId: number,
      months: string[] // array of "YYYY-MM"
    ): Promise<{ bulan: string; pemasukan: number; pengeluaran: number }[]> => {
      const results: { bulan: string; pemasukan: number; pengeluaran: number }[] = []

      for (const month of months) {
        const rows = await db
          .select({
            type: transactions.type,
            total: sql<number>`SUM(${transactions.amount})`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              like(transactions.date, `${month}%`)
            )
          )
          .groupBy(transactions.type)

        let pemasukan = 0
        let pengeluaran = 0
        for (const row of rows) {
          if (row.type === 'masuk') pemasukan = row.total ?? 0
          else pengeluaran = row.total ?? 0
        }
        results.push({ bulan: month, pemasukan, pengeluaran })
      }

      return results
    },

    // Ringkasan bulan berjalan untuk dashboard
    currentMonthSummary: async (
      userId: number,
      month: string // "YYYY-MM"
    ): Promise<{ pemasukan: number; pengeluaran: number; jumlahTransaksi: number }> => {
      const rows = await db
        .select({
          type: transactions.type,
          total: sql<number>`SUM(${transactions.amount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            like(transactions.date, `${month}%`)
          )
        )
        .groupBy(transactions.type)

      let pemasukan = 0
      let pengeluaran = 0
      let jumlahTransaksi = 0

      for (const row of rows) {
        jumlahTransaksi += row.count ?? 0
        if (row.type === 'masuk') pemasukan = row.total ?? 0
        else pengeluaran = row.total ?? 0
      }

      return { pemasukan, pengeluaran, jumlahTransaksi }
    },
  }
}
