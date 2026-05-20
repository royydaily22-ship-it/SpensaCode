/**
 * SpensaCode — Backend Server (Fixed)
 * Stack: Node.js + Express + JSON file
 * Run : node server.js
 * Port: 3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dqmgg8wlc',
    api_key: '437194589517298',
    api_secret: '_XFvqZk2hmYPBM67lfkdxAyyPtI'
});

// ─── Simple JSON Database ─────────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, 'db.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) return null;
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch (e) { return null; }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function hashPass(p) {
    return crypto.createHash('sha256').update(p).digest('hex');
}

function genToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getDB() {
    const data = readDB();
    if (data) return data;
    // Database fresh — seed admin + beberapa siswa contoh
    const fresh = {
        users: [
            {
                id: 'admin',
                nis: 'admin',
                name: 'Administrator',
                kelas: '-',
                role: 'admin',
                avatar: 'A',
                password: hashPass('admin123'),
            },
            {
                id: 'sekretaris1',
                nis: 'sekretaris',
                name: 'Sekretaris',
                kelas: '-',
                role: 'sekretaris',
                avatar: 'S',
                password: hashPass('12345'),
            },
            {
                id: 'siswa_tegar',
                nis: '2026001',
                name: 'Tegar Abu Royyan',
                kelas: 'IX A',
                role: 'siswa',
                avatar: 'T',
                password: hashPass('12345'),
            },
            {
                id: 'siswa_budi',
                nis: '2026002',
                name: 'Budi Santoso',
                kelas: 'IX A',
                role: 'siswa',
                avatar: 'B',
                password: hashPass('12345'),
            },
        ],
        tokens: {},          // token -> userId
        face_descriptors: {},
        attendance: [],
    };
    writeDB(fresh);
    return fresh;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'] || '';
    const token = auth.replace('Bearer ', '').trim();
    const db = getDB();
    const userId = db.tokens[token];
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ success: false, message: 'User tidak ditemukan' });
    req.user = user;
    next();
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin' && req.user.role !== 'sekretaris')
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
    next();
}

function safeUser(u) {
    const { password, ...rest } = u;
    return rest;
}

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// ═══════════════════ AUTH ROUTES ═════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
    const { nis, password } = req.body;
    if (!nis || !password)
        return res.status(400).json({ success: false, message: 'NIS dan password wajib diisi' });

    const db = getDB();
    const user = db.users.find(u => u.nis === nis);
    if (!user)
        return res.status(401).json({ success: false, message: 'NIS tidak ditemukan' });
    if (user.password !== hashPass(password))
        return res.status(401).json({ success: false, message: 'Password salah' });

    const token = genToken();
    db.tokens[token] = user.id;
    writeDB(db);

    res.json({ success: true, token, user: safeUser(user) });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ success: true, user: safeUser(req.user) });
});

// ═══════════════════ USER ROUTES ═════════════════════════════════════════════

// GET /api/users
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    res.json({ success: true, data: db.users.map(safeUser) });
});

// POST /api/users
app.post('/api/users', authMiddleware, adminOnly, (req, res) => {
    const { nis, name, kelas, role, password } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
    const db = getDB();
    if (nis && db.users.find(u => u.nis === nis))
        return res.status(409).json({ success: false, message: 'NIS sudah terdaftar' });
    const id = 'u_' + Date.now();
    const user = {
        id,
        nis: nis || id,
        name,
        kelas: kelas || '-',
        role: role || 'siswa',
        avatar: name[0].toUpperCase(),
        password: hashPass(password || '12345'),
    };
    db.users.push(user);
    writeDB(db);
    res.json({ success: true, data: safeUser(user) });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
    if (req.params.id === 'admin')
        return res.status(400).json({ success: false, message: 'Akun admin tidak bisa dihapus' });
    const db = getDB();
    db.users = db.users.filter(u => u.id !== req.params.id);
    delete db.face_descriptors[req.params.id];
    writeDB(db);
    res.json({ success: true });
});

// POST /api/users/:id/reset-password
app.post('/api/users/:id/reset-password', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    user.password = hashPass('12345');
    writeDB(db);
    res.json({ success: true, message: 'Password direset ke 12345' });
});

// ═══════════════════ DESCRIPTORS ═════════════════════════════════════════════

// GET /api/descriptors  — hanya return descriptor milik user sendiri (siswa)
//                        atau semua (admin/sekretaris)
app.get('/api/descriptors', authMiddleware, (req, res) => {
    const db = getDB();
    if (req.user.role === 'siswa') {
        const data = {};
        if (db.face_descriptors[req.user.id]) data[req.user.id] = db.face_descriptors[req.user.id];
        return res.json({ success: true, data });
    }
    res.json({ success: true, data: db.face_descriptors });
});

// POST /api/descriptors/:userId
app.post('/api/descriptors/:userId', authMiddleware, (req, res) => {
    const { userId } = req.params;
    // Siswa hanya boleh daftarkan wajah sendiri
    if (req.user.role === 'siswa' && req.user.id !== userId)
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const { descriptor } = req.body;
    if (!descriptor || !Array.isArray(descriptor))
        return res.status(400).json({ success: false, message: 'descriptor harus array' });
    const db = getDB();
    if (!db.users.find(u => u.id === userId))
        return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    db.face_descriptors[userId] = descriptor;
    writeDB(db);
    res.json({ success: true, message: 'Descriptor tersimpan' });
});

// ═══════════════════ ATTENDANCE ══════════════════════════════════════════════

// GET /api/attendance/today
app.get('/api/attendance/today', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    const today = new Date().toLocaleDateString('id-ID');
    const data = db.attendance
        .filter(r => r.date === today)
        .sort((a, b) => b.id - a.id);
    res.json({ success: true, data, total: data.length, date: today });
});

// GET /api/attendance
app.get('/api/attendance', authMiddleware, (req, res) => {
    const db = getDB();
    let data = [...db.attendance].sort((a, b) => b.id - a.id);

    // Siswa hanya lihat milik sendiri
    if (req.user.role === 'siswa') {
        data = data.filter(r => r.studentId === req.user.id);
    } else {
        if (req.query.date) data = data.filter(r => r.date === req.query.date);
        if (req.query.kelas) data = data.filter(r => r.kelas === req.query.kelas);
        if (req.query.status) data = data.filter(r => r.status === req.query.status);
    }
    if (req.query.limit) data = data.slice(0, parseInt(req.query.limit));
    res.json({ success: true, data, total: data.length });
});

// POST /api/attendance — ganti dengan ini
app.post('/api/attendance', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'siswa')
            return res.status(403).json({ success: false, message: 'Hanya siswa yang bisa absen' });

        const db = getDB();

        // Cek jadwal absen
        const jam = db.settings?.jamAbsen;
        if (jam?.aktif && jam.jadwal?.length > 0) {
            const now = new Date();
            const hariIni = now.getDay();
            const jadwalHariIni = jam.jadwal.find(j => j.hari === hariIni);

            if (!jadwalHariIni) {
                return res.status(403).json({ success: false, message: 'Hari ini tidak ada jadwal absensi' });
            }

            // Tambah pengecekan — kalau jamBuka/jamTutup undefined, skip cek jadwal
            if (jadwalHariIni.jamBuka && jadwalHariIni.jamTutup) {
                const [bukH, bukM] = jadwalHariIni.jamBuka.split(':').map(Number);
                const [tutH, tutM] = jadwalHariIni.jamTutup.split(':').map(Number);
                const nowMin = now.getHours() * 60 + now.getMinutes();
                if (nowMin < bukH * 60 + bukM)
                    return res.status(403).json({ success: false, message: `Absensi belum dibuka. Buka pukul ${jadwalHariIni.jamBuka}` });
                if (nowMin > tutH * 60 + tutM)
                    return res.status(403).json({ success: false, message: `Absensi sudah ditutup sejak pukul ${jadwalHariIni.jamTutup}` });
            }
        }
        const today = new Date().toLocaleDateString('id-ID');
        const sudahAbsen = db.attendance.find(
            r => r.studentId === req.user.id && r.date === today && r.status === 'hadir'
        );
        if (sudahAbsen)
            return res.status(409).json({ success: false, message: 'Kamu sudah absen hari ini!' });

        const { faceVerified, gpsVerified, distance, selfieBase64 } = req.body;

// Upload selfie ke Cloudinary
let selfieUrl = null;
if (selfieBase64) {
    try {
        const uploadResult = await cloudinary.uploader.upload(selfieBase64, {
            folder: 'spensacode/selfies',
            public_id: `${req.user.id}_${Date.now()}`,
            resource_type: 'image'
        });
        selfieUrl = uploadResult.secure_url;
    } catch (e) {
        console.error('Cloudinary upload error:', e);
    }
}
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            studentId: req.user.id,
            nis: req.user.nis,
            studentName: req.user.name,
            kelas: req.user.kelas,
            avatar: req.user.avatar,
            avatarImg: req.user.avatarImg || null,
            time: new Date().toLocaleTimeString('id-ID'),
            date: today,
            faceVerified: !!faceVerified,
            gpsVerified: !!gpsVerified,
            distance: distance || 0,
            status: (faceVerified && gpsVerified) ? 'hadir' : 'gagal',
            selfieUrl: selfieUrl,
        };
        db.attendance.unshift(record);
        writeDB(db);
        res.json({ success: true, data: record });

    } catch (e) {
        console.error('Attendance error:', e);
        res.status(500).json({ success: false, message: 'Server error: ' + e.message });
    }
});

// ═══════════════════ ANNOUNCEMENTS ══════════════════════════════════════════

// GET /api/announcements
app.get('/api/announcements', authMiddleware, (req, res) => {
    const db = getDB();
    if (!db.announcements) db.announcements = [];
    let data = [...db.announcements].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        return b.id - a.id;
    });
    // Filter expired
    const now = Date.now();
    data = data.filter(a => !a.expireAt || a.expireAt > now);
    // Siswa hanya lihat yang aktif
    if (req.user.role === 'siswa') {
        data = data.filter(a => a.active);
    }
    res.json({ success: true, data });
});

// POST /api/announcements
app.post('/api/announcements', authMiddleware, adminOnly, (req, res) => {
    const { title, content, pinned, active, expireAt, image } = req.body;
    if (!title || !content)
        return res.status(400).json({ success: false, message: 'Judul dan isi wajib diisi' });
    const db = getDB();
    if (!db.announcements) db.announcements = [];
    const ann = {
        id: Date.now(),
        title,
        content,
        pinned: !!pinned,
        active: active !== false,
        expireAt: expireAt || null,
        image: image || null,
        createdBy: req.user.name,
        createdAt: new Date().toISOString(),
    };
    db.announcements.unshift(ann);
    writeDB(db);
    res.json({ success: true, data: ann });
});

// PUT /api/announcements/:id
app.put('/api/announcements/:id', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    if (!db.announcements) db.announcements = [];
    const ann = db.announcements.find(a => a.id === parseInt(req.params.id));
    if (!ann) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
    const { title, content, pinned, active, expireAt, image } = req.body;
    if (title) ann.title = title;
    if (content) ann.content = content;
    ann.pinned = !!pinned;
    ann.active = active !== false;
    ann.expireAt = expireAt || null;
    if (image !== undefined) ann.image = image;
    ann.updatedAt = new Date().toISOString();
    writeDB(db);
    res.json({ success: true, data: ann });
});

// PATCH /api/announcements/:id/toggle
app.patch('/api/announcements/:id/toggle', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    if (!db.announcements) db.announcements = [];
    const ann = db.announcements.find(a => a.id === parseInt(req.params.id));
    if (!ann) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
    ann.active = !ann.active;
    writeDB(db);
    res.json({ success: true, data: ann });
});

// DELETE /api/announcements/:id
app.delete('/api/announcements/:id', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    if (!db.announcements) db.announcements = [];
    const idx = db.announcements.findIndex(a => a.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
    db.announcements.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

// ═══════════════════ PROFILE ═════════════════════════════════════════════════

// GET /api/profile
app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({ success: true, data: safeUser(req.user) });
});

// PUT /api/profile  — edit nama & NIS
app.put('/api/profile', authMiddleware, (req, res) => {
    const { name, nis } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    if (nis && nis !== user.nis) {
        const conflict = db.users.find(u => u.nis === nis && u.id !== user.id);
        if (conflict) return res.status(409).json({ success: false, message: 'NIS sudah digunakan' });
        user.nis = nis;
    }
    if (name && name.trim()) {
        user.name = name.trim();
        user.avatar = name.trim()[0].toUpperCase();
    }
    writeDB(db);
    res.json({ success: true, data: safeUser(user) });
});

// PUT /api/profile/avatar  — ganti avatar (warna + inisial atau base64 foto kecil)
app.put('/api/profile/avatar', authMiddleware, (req, res) => {
    const { avatarColor, avatarImg } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    if (avatarColor) user.avatarColor = avatarColor;
    if (avatarImg !== undefined) user.avatarImg = avatarImg; // base64 atau null
    writeDB(db);
    res.json({ success: true, data: safeUser(user) });
});

// POST /api/users/:id/reset-password  — admin reset, juga reset counter
app.post('/api/users/:id/reset-password', authMiddleware, adminOnly, (req, res) => {
    const db = getDB();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    user.password = hashPass('12345');
    user.passChangeCount = 0; // reset counter
    writeDB(db);
    res.json({ success: true, message: 'Password direset ke 12345' });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (user.password !== hashPass(oldPassword))
        return res.status(400).json({ success: false, message: 'Password lama salah' });
    if (!newPassword || newPassword.length < 4)
        return res.status(400).json({ success: false, message: 'Password baru minimal 4 karakter' });
    user.passChangeCount = (user.passChangeCount || 0) + 1;
    if (user.passChangeCount > 3)
        return res.status(403).json({ success: false, message: 'Batas ganti password (3x) tercapai. Hubungi admin untuk reset.', locked: true });
    user.password = hashPass(newPassword);
    writeDB(db);
    res.json({ success: true, message: 'Password berhasil diubah', remaining: 3 - user.passChangeCount });
});

// ═══════════════════ JAM ABSEN ════════════════════════════════════════════════

// GET /api/settings/jam-absen
app.get('/api/settings/jam-absen', authMiddleware, (req, res) => {
    const db = getDB();
    if (!db.settings) db.settings = {};
    res.json({
        success: true,
        data: db.settings.jamAbsen || {
            aktif: false,
            jadwal: [] // [{hari: 1, jamBuka: '06:30', jamTutup: '08:00'}]
        }
    });
});

// PUT /api/settings/jam-absen
app.put('/api/settings/jam-absen', authMiddleware, adminOnly, (req, res) => {
    const { aktif, jadwal } = req.body;
    const db = getDB();
    if (!db.settings) db.settings = {};
    db.settings.jamAbsen = { aktif: !!aktif, jadwal: jadwal || [] };
    writeDB(db);
    res.json({ success: true, data: db.settings.jamAbsen });
});

// ═══════════════════ RESET ABSENSI ═══════════════════════════════════════════

// DELETE /api/attendance/reset  — hapus semua atau per tanggal
app.delete('/api/attendance/reset', authMiddleware, adminOnly, (req, res) => {
    const { tanggal } = req.body; // opsional, format: "19/5/2026"
    const db = getDB();
    if (tanggal) {
        const before = db.attendance.length;
        db.attendance = db.attendance.filter(r => r.date !== tanggal);
        const deleted = before - db.attendance.length;
        writeDB(db);
        return res.json({ success: true, message: `${deleted} data absensi tanggal ${tanggal} dihapus` });
    }
    const total = db.attendance.length;
    db.attendance = [];
    writeDB(db);
    res.json({ success: true, message: `Semua ${total} data absensi berhasil dihapus` });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    const db = getDB();
    res.json({
        success: true, status: 'ok',
        db: {
            users: db.users.length,
            descriptors: Object.keys(db.face_descriptors).length,
            attendance: db.attendance.length,
        },
        uptime: process.uptime().toFixed(0) + 's',
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log('  ✅  SpensaCode Server jalan di http://localhost:' + PORT);
    console.log('  📁  Database: ' + DB_FILE);
    console.log('');
    console.log('  Login default:');
    console.log('    Admin      → admin / admin123');
    console.log('    Sekretaris → sekretaris / 12345');
    console.log('    Siswa      → 2026001 / 12345');
    console.log('');
});