import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownCircle, ArrowRight, ArrowUpCircle, LogOut, TrendingUp, Wallet } from "lucide-react"
import { getDashboardSummary, getTransactions, logout, type DashboardSummary, type Transaction } from "@/lib/api"
import { getRefreshToken, clearTokens } from "@/lib/auth"
import { formatRupiah, formatDate, labelBulan } from "@/lib/transactions"

export default function HomePage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

    getTransactions({})
      .then((res) => setRecentTx(res.data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setTxLoading(false))
  }, [])

  async function handleLogout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await logout(refreshToken).catch(() => {})
    }
    clearTokens()
    navigate("/")
  }

  const bulanLabel = summary?.bulan ? labelBulan(summary.bulan) : new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  const saldo = summary ? summary.pemasukan - summary.pengeluaran : 0

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

      {/* Content */}
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">{bulanLabel}</p>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {/* Saldo Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Saldo Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-9 w-48 animate-pulse rounded bg-primary-foreground/20" />
            ) : (
              <p className="text-3xl font-bold">{formatRupiah(saldo)}</p>
            )}
            <p className="mt-1 text-xs opacity-70">Pemasukan - Pengeluaran bulan ini</p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Pemasukan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-xl font-bold">{formatRupiah(summary?.pemasukan ?? 0)}</p>
              )}
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          {/* Pengeluaran */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-32 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-xl font-bold">{formatRupiah(summary?.pengeluaran ?? 0)}</p>
              )}
              <p className="text-xs text-muted-foreground">Bulan ini</p>
            </CardContent>
          </Card>

          {/* Jumlah Transaksi */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transaksi</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="text-xl font-bold">{summary?.jumlahTransaksi ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Total transaksi</p>
            </CardContent>
          </Card>
        </div>

        {/* Go to transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-sm" onClick={() => navigate("/transactions")}>
              Lihat semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="divide-y">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <p className="text-sm text-muted-foreground">Belum ada transaksi. Yuk mulai catat!</p>
                <Button size="sm" className="gap-2" onClick={() => navigate("/transactions")}>
                  Tambah Transaksi
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {recentTx.map((tx) => (
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
                      <p className={`text-sm font-semibold ${tx.type === "masuk" ? "text-green-600" : "text-red-600"}`}>
                        {tx.type === "masuk" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3">
                  <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/transactions")}>
                    Kelola Transaksi
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
