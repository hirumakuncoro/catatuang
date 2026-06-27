Saya baca dulu semua halaman UI-nya buat mapping yang akurat.

Ini hasil mapping-nya berdasarkan semua fitur di UI:

```http
### ============================================================
### CATATUANG — API REFERENCE
### Base URL: http://localhost:3000
### Auth: Bearer token (JWT) di header Authorization
### ============================================================

@baseUrl = http://localhost:3000
@token = <your_jwt_token_here>


# ─────────────────────────────────────────────
# AUTH
# Dipakai oleh: LoginPage (form email + password)
#               tombol "Keluar" (logout)
#               link "Daftar sekarang"
# ─────────────────────────────────────────────

### Register
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "kamu@email.com",
  "password": "rahasia123"
}

###

### Login — mengembalikan JWT token
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "kamu@email.com",
  "password": "rahasia123"
}

###

### Logout — invalidate token di server (opsional jika stateless)
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{token}}


# ─────────────────────────────────────────────
# DASHBOARD
# Dipakai oleh: HomePage
# Mengembalikan saldo, total pemasukan,
# total pengeluaran, dan jumlah transaksi
# untuk bulan berjalan
# ─────────────────────────────────────────────

### Ringkasan bulan ini
GET {{baseUrl}}/dashboard/summary
Authorization: Bearer {{token}}

# Response shape:
# {
#   "saldo": 2050000,
#   "pemasukan": 5200000,
#   "pengeluaran": 3150000,
#   "jumlahTransaksi": 24,
#   "bulan": "2026-06"
# }


# ─────────────────────────────────────────────
# TRANSACTIONS
# Dipakai oleh: TransactionsPage
# ─────────────────────────────────────────────

### Ambil semua transaksi (dengan filter & pencarian)
# Query params:
#   month  — filter bulan, format "YYYY-MM" (opsional)
#   q      — pencarian berdasarkan description (opsional)
#   type   — "masuk" | "keluar" (opsional)
GET {{baseUrl}}/transactions?month=2026-06&q=gaji
Authorization: Bearer {{token}}

# Response shape:
# {
#   "data": [
#     {
#       "id": "uuid",
#       "type": "masuk",
#       "amount": 5000000,
#       "description": "Gaji bulanan",
#       "date": "2026-06-01"
#     }
#   ],
#   "total": 1,
#   "totalMasuk": 5000000,
#   "totalKeluar": 0
# }

###

### Catat transaksi baru (masuk atau keluar)
POST {{baseUrl}}/transactions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "type": "masuk",
  "amount": 5000000,
  "description": "Gaji bulanan",
  "date": "2026-06-01"
}

###

### Hapus transaksi
DELETE {{baseUrl}}/transactions/:id
Authorization: Bearer {{token}}

###

### Edit transaksi
PATCH {{baseUrl}}/transactions/:id
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "amount": 5500000,
  "description": "Gaji bulanan (revisi)",
  "date": "2026-06-01"
}


# ─────────────────────────────────────────────
# CHARTS / ANALYTICS
# Dipakai oleh: TransactionsPage
#   - Line chart: Cashflow per bulan
#   - Bar chart: Pemasukan vs Pengeluaran per bulan
# ─────────────────────────────────────────────

### Data chart — 6 bulan terakhir
GET {{baseUrl}}/transactions/summary/monthly?last=6
Authorization: Bearer {{token}}

# Response shape:
# {
#   "data": [
#     {
#       "bulan": "2026-01",
#       "pemasukan": 5800000,
#       "pengeluaran": 3200000,
#       "cashflow": 2600000
#     },
#     ...
#   ]
# }
```

---

Breakdown endpoint-nya:

| Endpoint | Dipakai di mana |
|---|---|
| `POST /auth/register` | Link "Daftar sekarang" di LoginPage |
| `POST /auth/login` | Form login di LoginPage |
| `POST /auth/logout` | Tombol "Keluar" di semua halaman |
| `GET /dashboard/summary` | Kartu saldo, pemasukan, pengeluaran, jumlah transaksi di HomePage |
| `GET /transactions` | Riwayat transaksi + filter bulan + pencarian di TransactionsPage |
| `POST /transactions` | Form "Catat Uang Masuk/Keluar" di TransactionsPage |
| `PATCH /transactions/:id` | Edit transaksi (UI belum ada tapi wajar disiapkan) |
| `DELETE /transactions/:id` | Hapus transaksi (UI belum ada tapi wajar disiapkan) |
| `GET /transactions/summary/monthly` | Data untuk kedua chart di TransactionsPage |

Catatan desain yang perlu diperhatikan:
- `/dashboard/summary` dan `/transactions?month=...` bisa overlap. Kalau mau lebih simpel, cukup andalkan query params di `/transactions` dan hitung summary di client — tapi kalau data transaksinya besar, lebih baik pisah endpoint summary di server.
- Chart data di `/transactions/summary/monthly` baiknya dihitung server-side supaya tidak perlu kirim ratusan transaksi ke client hanya untuk di-aggregate.
