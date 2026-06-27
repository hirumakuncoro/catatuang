import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Plus,
  Search,
  Wallet,
  LogOut,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  getTransactions,
  createTransaction,
  getMonthlySummary,
  logout,
  type Transaction,
  type TransactionListResponse,
  type MonthlyChartItem,
} from "@/lib/api"
import { getRefreshToken, clearTokens } from "@/lib/auth"
import { formatRupiah, formatDate, labelBulan, type TransactionType } from "@/lib/transactions"

// ─── Form state ──────────────────────────────────────────────────────────────

interface FormState {
  amount: string
  description: string
  date: string
}

const defaultForm: FormState = {
  amount: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
}

// ─── Tooltip custom ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Skeleton row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const navigate = useNavigate()

  // ── Transaction list state ──
  const [listData, setListData] = useState<TransactionListResponse>({
    data: [],
    total: 0,
    totalMasuk: 0,
    totalKeluar: 0,
  })
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState("")

  // ── Filter & search ──
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0') // getMonth() itu 0-11
    return `${year}-${month}` // Menghasilkan "2026-06"
  })
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("") // debounce buffer

  // ── Chart state ──
  const [chartData, setChartData] = useState<MonthlyChartItem[]>([])
  const [chartLoading, setChartLoading] = useState(true)

  // ── Dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addType, setAddType] = useState<TransactionType>("masuk")
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // ── Bulan tersedia untuk dropdown ──
  const availableMonths = Array.from({ length: 3 }).map((_, i) => {
    const d = new Date()
    // Kurangi bulan berdasarkan index loop (0 = bulan ini, 1 = bulan lalu, 2 = 2 bulan lalu)
    d.setMonth(d.getMonth() - i) 
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }) // Hasilnya otomatis terurut dari yang terbaru: ["2026-06", "2026-05", "2026-04"]

  // ── Fetch transactions ──
  const fetchTransactions = useCallback(async () => {
    setListLoading(true)
    setListError("")
    try {
      const params: { month?: string; q?: string } = {}
      if (filterMonth !== "all") params.month = filterMonth
      if (search) params.q = search
      const data = await getTransactions(params)
      setListData(data)
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Gagal memuat transaksi.")
    } finally {
      setListLoading(false)
    }
  }, [filterMonth, search])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ── Fetch chart data (sekali mount) ──
  useEffect(() => {
    setChartLoading(true)
    getMonthlySummary(6)
      .then(setChartData)
      .catch(() => {})
      .finally(() => setChartLoading(false))
  }, [])

  // ── Debounce search input (400 ms) ──
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Chart display data — map bulan ke label singkat ──
  const chartDisplay = chartData.map((item) => {
    const [y, m] = item.bulan.split("-")
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    })
    return {
      bulan: label,
      Pemasukan: item.pemasukan,
      Pengeluaran: item.pengeluaran,
      Cashflow: item.cashflow,
    }
  })

  // ── Logout ──
  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) await logout(refreshToken).catch(() => {})
    clearTokens()
    navigate("/")
  }

  // ── Open add dialog ──
  function openAdd(type: TransactionType) {
    setAddType(type)
    setForm(defaultForm)
    setSubmitError("")
    setDialogOpen(true)
  }

  // ── Submit new transaction ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.description || !form.date) return
    setSubmitting(true)
    setSubmitError("")
    try {
      await createTransaction({
        type: addType,
        amount: Number(form.amount.replace(/\D/g, "")),
        description: form.description,
        date: form.date,
      })
      setDialogOpen(false)
      setForm(defaultForm)
      // Refresh list & chart
      fetchTransactions()
      getMonthlySummary(6).then(setChartData).catch(() => {})
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.")
    } finally {
      setSubmitting(false)
    }
  }

  function handleAmountChange(val: string) {
    const numeric = val.replace(/\D/g, "")
    setForm((f) => ({ ...f, amount: numeric }))
  }

  const transactions: Transaction[] = listData.data

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-primary p-1.5 text-primary-foreground">
              <Wallet className="h-4 w-4" />
            </div>
            <span className="font-semibold">Catatuang</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} aria-label="Kembali ke beranda">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Transaksi</h2>
            <p className="text-sm text-muted-foreground">Catat & kelola semua transaksimu</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => openAdd("masuk")}>
            <Plus className="h-4 w-4" />
            Uang Masuk
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => openAdd("keluar")}>
            <Plus className="h-4 w-4" />
            Uang Keluar
          </Button>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari transaksi..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filter bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua bulan</SelectItem>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {labelBulan(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary mini cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Masuk</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="h-7 w-28 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-lg font-bold text-green-600">{formatRupiah(listData.totalMasuk)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Keluar</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="h-7 w-28 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-lg font-bold text-red-600">{formatRupiah(listData.totalKeluar)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Riwayat Transaksi
              {!listLoading && listData.total > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({listData.total})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {listError && (
              <p className="px-6 py-4 text-sm text-destructive">{listError}</p>
            )}
            {listLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : transactions.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {search || filterMonth !== "all"
                  ? "Tidak ada transaksi yang cocok."
                  : "Belum ada transaksi. Tambah transaksi pertamamu!"}
              </p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        tx.type === "masuk" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.type === "masuk" ? (
                        <ArrowDownCircle className="h-4 w-4" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === "masuk" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "masuk" ? "+" : "-"}
                    {formatRupiah(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chart: Cashflow per bulan (line) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cashflow per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[220px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartDisplay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Cashflow" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart: Pemasukan vs Pengeluaran (bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pemasukan vs Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-[220px] animate-pulse rounded bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartDisplay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Pemasukan" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog tambah transaksi */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {addType === "masuk" ? "Catat Uang Masuk" : "Catat Uang Keluar"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
              <Input
                id="tx-amount"
                inputMode="numeric"
                placeholder="0"
                value={form.amount ? Number(form.amount).toLocaleString("id-ID") : ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-desc">Keterangan</Label>
              <Input
                id="tx-desc"
                placeholder="Contoh: Gaji bulanan"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Tanggal</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                disabled={submitting}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button
                type="submit"
                className={addType === "masuk" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                variant={addType === "keluar" ? "destructive" : "default"}
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
