import { Hono } from 'hono'
import { Env } from '../../config/env'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { transactionsService } from './transactions.service'
import { ok, created, noContent } from '../../lib/response'
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionSchema,
  monthlySummarySchema,
} from './transactions.validator'

export const transactionsRouter = new Hono<Env>()

// Semua route butuh auth
transactionsRouter.use('*', authMiddleware)

// GET /transactions/summary/monthly?last=6
// Harus didefinisikan SEBELUM /:id supaya tidak terambil sebagai id
transactionsRouter.get('/summary/monthly', async (c) => {
  const userId = c.get('userId')
  const raw = c.req.query()
  const query = monthlySummarySchema.parse(raw)
  const service = transactionsService(c)
  const data = await service.monthlySummary(userId, query.last)
  return ok(c, data)
})

// GET /transactions
transactionsRouter.get('/', async (c) => {
  const userId = c.get('userId')
  const raw = c.req.query()
  const query = listTransactionSchema.parse(raw)
  const service = transactionsService(c)
  const result = await service.list(userId, query)
  return ok(c, result)
})

// POST /transactions
transactionsRouter.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()
  const input = createTransactionSchema.parse(body)
  const service = transactionsService(c)
  const data = await service.create(userId, input)
  return created(c, data, 'Transaksi berhasil dicatat')
})

// PATCH /transactions/:id
transactionsRouter.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const body = await c.req.json()
  const input = updateTransactionSchema.parse(body)
  const service = transactionsService(c)
  const data = await service.update(userId, id, input)
  return ok(c, data, 'Transaksi berhasil diperbarui')
})

// DELETE /transactions/:id
transactionsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = Number(c.req.param('id'))
  const service = transactionsService(c)
  await service.delete(userId, id)
  return noContent(c)
})
