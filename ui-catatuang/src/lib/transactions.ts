// Re-export tipe Transaction dari api agar halaman tidak perlu import dua tempat
export type { Transaction, TransactionInput } from "./api"
export type TransactionType = "masuk" | "keluar"

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Label bulan, misal "2026-06" → "Juni 2026" */
export function labelBulan(ym: string) {
  const [y, m] = ym.split("-")
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}
