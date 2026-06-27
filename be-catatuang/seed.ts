/**
 * Seeder untuk local D1
 *
 * Cara pakai:
 *   bun run seed
 */

import { execSync } from 'child_process'
import * as bcrypt from 'bcryptjs'

// ── Data seed ────────────────────────────────────────────────

const USER = {
  email: 'budi3@gmail.com',
  password: 'password',
  name: 'Budi Santoso'
}

type TrxType = 'masuk' | 'keluar'

const TRANSACTIONS: Array<{
  type: TrxType
  amount: number
  description: string
  date: string
}> = [
  // ── APRIL 2026 ───────────────────────────────────────────
  { type: 'masuk',  amount: 3200000, description: 'Gaji April',                   date: '2026-04-01' },
  { type: 'keluar', amount: 600000,  description: 'Sewa kos bulan April',          date: '2026-04-01' },
  { type: 'keluar', amount: 25000,   description: 'Sarapan nasi kuning + teh',     date: '2026-04-02' },
  { type: 'keluar', amount: 50000,   description: 'Pulsa Telkomsel',               date: '2026-04-03' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-04-04' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-04-05' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-04-06' },
  { type: 'keluar', amount: 30000,   description: 'Makan malam ayam bakar',        date: '2026-04-07' },
  { type: 'keluar', amount: 15000,   description: 'Kopi + gorengan sore',          date: '2026-04-08' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-04-09' },
  { type: 'keluar', amount: 25000,   description: 'Parkir & jajan kantor',         date: '2026-04-10' },
  { type: 'keluar', amount: 200000,  description: 'Tagihan listrik April',         date: '2026-04-11' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-04-12' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-04-13' },
  { type: 'masuk',  amount: 150000,  description: 'Utang dibayar teman',           date: '2026-04-14' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-04-14' },
  { type: 'keluar', amount: 50000,   description: 'Nonton bioskop',                date: '2026-04-15' },
  { type: 'keluar', amount: 25000,   description: 'Makan siang warteg',            date: '2026-04-16' },
  { type: 'keluar', amount: 30000,   description: 'Jajan martabak mini',           date: '2026-04-17' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-04-19' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-04-20' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-04-21' },
  { type: 'keluar', amount: 20000,   description: 'Kopi + gorengan sore',          date: '2026-04-22' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-04-23' },
  { type: 'keluar', amount: 75000,   description: 'Obat flu + vitamin',            date: '2026-04-24' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-04-26' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-04-27' },
  { type: 'keluar', amount: 150000,  description: 'Makan malam kondangan',         date: '2026-04-28' },
  { type: 'keluar', amount: 50000,   description: 'Transfer ke ibu',               date: '2026-04-29' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-04-30' },

  // ── MEI 2026 ─────────────────────────────────────────────
  { type: 'masuk',  amount: 3200000, description: 'Gaji Mei',                      date: '2026-05-01' },
  { type: 'keluar', amount: 600000,  description: 'Sewa kos bulan Mei',            date: '2026-05-01' },
  { type: 'keluar', amount: 25000,   description: 'Sarapan nasi uduk',             date: '2026-05-02' },
  { type: 'keluar', amount: 50000,   description: 'Pulsa Telkomsel',               date: '2026-05-03' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-05-03' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-05-04' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-05-05' },
  { type: 'keluar', amount: 20000,   description: 'Kopi + gorengan sore',          date: '2026-05-06' },
  { type: 'keluar', amount: 200000,  description: 'Servis motor',                  date: '2026-05-07' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-05-08' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-05-10' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-05-11' },
  { type: 'keluar', amount: 195000,  description: 'Tagihan listrik Mei',           date: '2026-05-12' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-05-13' },
  { type: 'masuk',  amount: 200000,  description: 'Bonus kehadiran kantor',        date: '2026-05-14' },
  { type: 'keluar', amount: 30000,   description: 'Jajan cilok + batagor',         date: '2026-05-14' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-05-17' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-05-18' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-05-19' },
  { type: 'keluar', amount: 100000,  description: 'Kado ulang tahun teman',        date: '2026-05-20' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-05-21' },
  { type: 'keluar', amount: 25000,   description: 'Kopi + gorengan sore',          date: '2026-05-22' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-05-24' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-05-25' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-05-26' },
  { type: 'keluar', amount: 200000,  description: 'Transfer ke ibu lebaran',       date: '2026-05-27' },
  { type: 'keluar', amount: 75000,   description: 'Baju lebaran diskon',           date: '2026-05-28' },
  { type: 'masuk',  amount: 300000,  description: 'THR dari kantor',               date: '2026-05-29' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-05-30' },
  { type: 'keluar', amount: 20000,   description: 'Kopi + gorengan sore',          date: '2026-05-31' },

  // ── JUNI 2026 ────────────────────────────────────────────
  { type: 'masuk',  amount: 3200000, description: 'Gaji Juni',                     date: '2026-06-01' },
  { type: 'keluar', amount: 600000,  description: 'Sewa kos bulan Juni',           date: '2026-06-01' },
  { type: 'keluar', amount: 25000,   description: 'Sarapan nasi kuning',           date: '2026-06-02' },
  { type: 'keluar', amount: 50000,   description: 'Pulsa Telkomsel',               date: '2026-06-03' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-06-03' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-06-04' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-06-05' },
  { type: 'keluar', amount: 20000,   description: 'Kopi + gorengan sore',          date: '2026-06-06' },
  { type: 'keluar', amount: 205000,  description: 'Tagihan listrik Juni',          date: '2026-06-07' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-06-08' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-06-10' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-06-11' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-06-12' },
  { type: 'keluar', amount: 30000,   description: 'Jajan siomay + es teh',         date: '2026-06-13' },
  { type: 'masuk',  amount: 250000,  description: 'Freelance desain undangan',     date: '2026-06-14' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-06-17' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-06-18' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-06-19' },
  { type: 'keluar', amount: 45000,   description: 'Laundry kiloan',                date: '2026-06-20' },
  { type: 'keluar', amount: 25000,   description: 'Kopi + gorengan sore',          date: '2026-06-21' },
  { type: 'keluar', amount: 150000,  description: 'Kondangan nikahan teman',       date: '2026-06-22' },
  { type: 'keluar', amount: 80000,   description: 'Bensin motor seminggu',         date: '2026-06-24' },
  { type: 'keluar', amount: 120000,  description: 'Belanja sayur & lauk seminggu', date: '2026-06-25' },
  { type: 'keluar', amount: 35000,   description: 'Makan siang warteg',            date: '2026-06-26' },
  { type: 'keluar', amount: 20000,   description: 'Kopi + gorengan sore',          date: '2026-06-27' },
]

// ── Helper ───────────────────────────────────────────────────

function escape(str: string): string {
  return str.replace(/'/g, "''").replace(/"/g, '\\"')
}

function runSql(sql: string, label: string) {
  const cmd = `wrangler d1 execute my-database --env production --remote --command "${sql}"`
  try {
    execSync(cmd, { stdio: 'pipe' })
    console.log(`  ✓ ${label}`)
  } catch (err: any) {
    const output = err.stderr?.toString() || err.stdout?.toString() || err.message
    console.error(`  ✗ ${label}\n    ${output.trim()}`)
    process.exit(1)
  }
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Mulai seeding...\n')

  // 1. Hash password
  const hashedPassword = await bcrypt.hash(USER.password, 10)
  const escapedHash = hashedPassword.replace(/'/g, "''").replace(/\$/g, '\\$')

  // 2. Insert user
  console.log('👤 Insert user...')

  runSql(
    `INSERT OR IGNORE INTO users (email, password, name) VALUES ('${escape(USER.email)}', '${escapedHash}', '${escape(USER.name)}')`,
    `User: ${USER.email}`
  )

  // 3. Ambil user id
  let userId: number
  try {
    const result = execSync(
      `wrangler d1 execute my-database --env production --remote --json --command "SELECT id FROM users WHERE email=\\"${escape(USER.email)}\\" LIMIT 1"`,
      { stdio: 'pipe' }
    ).toString()

    const parsed = JSON.parse(result)
    userId = parsed[0]?.results?.[0]?.id
    if (!userId) throw new Error('id tidak ditemukan')
    console.log(`  ✓ User ID: ${userId}\n`)
  } catch (err: any) {
    console.error('  ✗ Gagal ambil user ID:', err.message)
    process.exit(1)
  }

  // 4. Insert transactions
  console.log(`💰 Insert ${TRANSACTIONS.length} transaksi...`)
  for (const trx of TRANSACTIONS) {
    runSql(
      `INSERT INTO transactions (user_id, type, amount, description, date) VALUES (${userId}, '${trx.type}', ${trx.amount}, '${escape(trx.description)}', '${trx.date}')`,
      `[${trx.date}] ${trx.type.padEnd(6)} ${trx.description}`
    )
  }

  // 5. Summary
  const totalMasuk = TRANSACTIONS.filter(t => t.type === 'masuk').reduce((a, t) => a + t.amount, 0)
  const totalKeluar = TRANSACTIONS.filter(t => t.type === 'keluar').reduce((a, t) => a + t.amount, 0)

  console.log('\n✅ Seeding selesai!')
  console.log('─'.repeat(40))
  console.log(`   Email       : ${USER.email}`)
  console.log(`   Password    : ${USER.password}`)
  console.log(`   Transaksi   : ${TRANSACTIONS.length} data`)
  console.log(`   Total masuk : Rp ${totalMasuk.toLocaleString('id-ID')}`)
  console.log(`   Total keluar: Rp ${totalKeluar.toLocaleString('id-ID')}`)
  console.log(`   Saldo akhir : Rp ${(totalMasuk - totalKeluar).toLocaleString('id-ID')}`)
}

main()
