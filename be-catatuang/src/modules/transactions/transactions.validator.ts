import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['masuk', 'keluar'], {
    error: 'type harus "masuk" atau "keluar"',
  }),
  amount: z
    .number({ error: 'amount harus berupa angka' })
    .positive('amount harus lebih dari 0'),
  description: z
    .string()
    .min(1, 'Deskripsi harus diisi')
    .max(255, 'Deskripsi terlalu panjang'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
})

export const updateTransactionSchema = z.object({
  type: z
    .enum(['masuk', 'keluar'], { error: 'type harus "masuk" atau "keluar"' })
    .optional(),
  amount: z
    .number({ error: 'amount harus berupa angka' })
    .positive('amount harus lebih dari 0')
    .optional(),
  description: z
    .string()
    .min(1, 'Deskripsi harus diisi')
    .max(255, 'Deskripsi terlalu panjang')
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .optional(),
})

export const listTransactionSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM')
    .optional(),
  q: z.string().optional(),
  type: z.enum(['masuk', 'keluar']).optional(),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('10'),
  offset: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0))
    .optional()
    .default('0'),
})

export const monthlySummarySchema = z.object({
  last: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(24))
    .optional()
    .default('6'),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type ListTransactionQuery = z.infer<typeof listTransactionSchema>
export type MonthlySummaryQuery = z.infer<typeof monthlySummarySchema>
