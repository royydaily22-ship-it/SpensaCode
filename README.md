# SpensaCode 📋

Aplikasi absensi digital berbasis **Face Recognition & GPS** untuk sekolah. Siswa dapat melakukan absensi menggunakan pengenalan wajah dan verifikasi lokasi secara real-time.

---

## ✨ Fitur

- 🤖 **Absensi Face Recognition** — verifikasi wajah siswa secara otomatis
- 📍 **Verifikasi GPS** — memastikan siswa berada di lokasi sekolah
- 👨‍💼 **Dashboard Admin** — kelola siswa, lihat rekap absensi, buat pengumuman
- 📝 **Dashboard Sekretaris** — akses rekap dan data absensi
- 👨‍🎓 **Dashboard Siswa** — absen mandiri & lihat riwayat kehadiran
- 🔔 **Pengumuman** — admin dapat membuat & pin pengumuman untuk siswa
- ⏰ **Jadwal Absensi** — atur jam buka/tutup absensi per hari
- 🔐 **Autentikasi JWT** — login aman berbasis token

---

## 👤 Akun Default

| Role | NIS / Username | Password |
|------|---------------|----------|
| Admin | `admin` | `admin123` |
| Sekretaris | `sekretaris` | `12345` |
| Siswa | `2026001` | `12345` |
| Siswa | `2026002` | `12345` |

---

## 🛠️ Teknologi

- **Backend** — Node.js + Express.js
- **Database** — JSON file (`db.json`)
- **Frontend** — HTML, CSS, JavaScript (vanilla)
- **Face Recognition** — face-api.js
- **Geolocation** — Browser Geolocation API

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v16 atau lebih baru
- npm

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/SpensaCode.git
cd SpensaCode

# 2. Install dependencies
npm install

# 3. Jalankan server
npm start
```

Server akan berjalan di `http://localhost:3000`

---

## 📁 Struktur Project

```
SpensaCode/
├── server.js          # Backend server (Express)
├── index.html         # Frontend utama
├── db.json            # Database (auto-generated)
├── logo.png           # Logo aplikasi
├── package.json       # Konfigurasi npm
└── backend/           # Folder backend tambahan
```

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Info user login |
| GET | `/api/users` | Daftar semua user (admin) |
| POST | `/api/users` | Tambah user baru (admin) |
| DELETE | `/api/users/:id` | Hapus user (admin) |
| GET | `/api/attendance` | Rekap absensi |
| POST | `/api/attendance` | Catat absensi (siswa) |
| GET | `/api/announcements` | Daftar pengumuman |
| POST | `/api/announcements` | Buat pengumuman (admin) |
| GET | `/api/settings/jam-absen` | Lihat jadwal absensi |
| PUT | `/api/settings/jam-absen` | Atur jadwal absensi (admin) |
| GET | `/api/health` | Status server |

---

## ⚙️ Environment Variables

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `PORT` | `3000` | Port server |

---

## 📄 Lisensi

Project ini dibuat untuk keperluan sekolah.
