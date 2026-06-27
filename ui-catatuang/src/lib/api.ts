import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from "./auth"

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
}

export interface DashboardSummary {
  saldo: number
  pemasukan: number
  pengeluaran: number
  jumlahTransaksi: number
  bulan: string
}

export interface Transaction {
  id: string
  type: "masuk" | "keluar"
  amount: number
  description: string
  date: string
}

export interface TransactionListResponse {
  data: Transaction[]
  total: number
  totalMasuk: number
  totalKeluar: number
}

export interface MonthlyChartItem {
  bulan: string       // "2026-06"
  pemasukan: number
  pengeluaran: number
  cashflow: number
}

export interface TransactionInput {
  type: "masuk" | "keluar"
  amount: number
  description: string
  date: string
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()

  const doFetch = (t: string | null) =>
    fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(init.headers ?? {}),
      },
    })

  let res = await doFetch(token)

  // Token expired — try refresh once
  if (res.status === 401) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      window.location.href = "/"
      return res
    }

    if (isRefreshing) {
      // Queue concurrent requests while refresh is in progress
      const newToken = await new Promise<string>((resolve) => {
        refreshQueue.push(resolve)
      })
      return doFetch(newToken)
    }

    isRefreshing = true
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })

      if (!refreshRes.ok) {
        clearTokens()
        window.location.href = "/"
        return res
      }

      const json: ApiResponse<AuthTokens> = await refreshRes.json()
      saveTokens(json.data.accessToken, json.data.refreshToken)

      // Flush queue
      refreshQueue.forEach((cb) => cb(json.data.accessToken))
      refreshQueue = []

      res = await doFetch(json.data.accessToken)
    } finally {
      isRefreshing = false
    }
  }

  return res
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json()
  if (!res.ok) {
    const message = json?.message ?? `HTTP ${res.status}`
    throw new Error(message)
  }
  // Backend wraps data in { data: ... }
  return (json.data ?? json) as T
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse<AuthTokens>(res)
}

export async function register(email: string, password: string, name: string): Promise<AuthTokens> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  })
  return handleResponse<AuthTokens>(res)
}

export async function logout(refreshToken: string): Promise<void> {
  await fetchWithAuth(`${BASE_URL}/auth/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  })
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetchWithAuth(`${BASE_URL}/auth/me`)
  return handleResponse<UserProfile>(res)
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetchWithAuth(`${BASE_URL}/dashboard/summary`)
  return handleResponse<DashboardSummary>(res)
}

// ─── Transactions ────────────────────────────────────────────────────────────

export interface GetTransactionsParams {
  month?: string  // "YYYY-MM"
  q?: string
  type?: "masuk" | "keluar"
}

export async function getTransactions(params: GetTransactionsParams = {}): Promise<TransactionListResponse> {
  const qs = new URLSearchParams()
  if (params.month) qs.set("month", params.month)
  if (params.q) qs.set("q", params.q)
  if (params.type) qs.set("type", params.type)

  const url = `${BASE_URL}/transactions${qs.size ? `?${qs}` : ""}`
  const res = await fetchWithAuth(url)
  return handleResponse<TransactionListResponse>(res)
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const res = await fetchWithAuth(`${BASE_URL}/transactions`, {
    method: "POST",
    body: JSON.stringify(input),
  })
  return handleResponse<Transaction>(res)
}

export async function updateTransaction(id: string, input: Partial<Omit<TransactionInput, "type">>): Promise<Transaction> {
  const res = await fetchWithAuth(`${BASE_URL}/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
  return handleResponse<Transaction>(res)
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL}/transactions/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.message ?? `HTTP ${res.status}`)
  }
}

// ─── Charts ──────────────────────────────────────────────────────────────────

export async function getMonthlySummary(last = 6): Promise<MonthlyChartItem[]> {
  const res = await fetchWithAuth(`${BASE_URL}/transactions/summary/monthly?last=${last}`)
  return handleResponse<MonthlyChartItem[]>(res)
}
