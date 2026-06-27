import { Hono } from 'hono'
import { Env } from '../../config/env'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { transactionsRepository } from '../transactions/transactions.repository'
import { ok } from '../../lib/response'

export const dashboardRouter = new Hono<Env>()

dashboardRouter.use('*', authMiddleware)

// GET /dashboard/summary
dashboardRouter.get('/summary', async (c) => {
  const userId = c.get('userId')
  const repo = transactionsRepository(c)

  const now = new Date()
  const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { pemasukan, pengeluaran, jumlahTransaksi } =
    await repo.currentMonthSummary(userId, bulan)

  return ok(c, {
    saldo: pemasukan - pengeluaran,
    pemasukan,
    pengeluaran,
    jumlahTransaksi,
    bulan,
  })
})
