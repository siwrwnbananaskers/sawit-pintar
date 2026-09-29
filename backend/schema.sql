-- ============================================================================
-- SAWIT PINTAR - DATABASE SCHEMA FOR CLOUDFLARE D1 (SQLITE)
-- ============================================================================

-- 1. Tabel Pekerja & Profil
CREATE TABLE IF NOT EXISTS pekerja (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  posisi TEXT NOT NULL,
  blok TEXT DEFAULT 'Semua Blok',
  telp TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'Tetap',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Data Lahan
CREATE TABLE IF NOT EXISTS lahan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL UNIQUE,
  lokasi TEXT NOT NULL,
  luas REAL NOT NULL,
  pohon INTEGER NOT NULL,
  varietas TEXT NOT NULL,
  mandor TEXT,
  status TEXT DEFAULT 'Produktif',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Catatan Kegiatan Agronomi
CREATE TABLE IF NOT EXISTS kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  blok TEXT NOT NULL,
  jenis TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  kondisi TEXT DEFAULT 'Normal',
  petugas TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Hasil Panen TBS
CREATE TABLE IF NOT EXISTS panen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  blok TEXT NOT NULL,
  jumlah REAL NOT NULL,
  harga REAL NOT NULL,
  pembeli TEXT NOT NULL,
  status TEXT DEFAULT 'Selesai',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Monitoring Cuaca
CREATE TABLE IF NOT EXISTS cuaca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tanggal DATE NOT NULL,
  jam TEXT NOT NULL,
  suhu REAL NOT NULL,
  kelembaban REAL NOT NULL,
  curah REAL NOT NULL,
  kondisi TEXT NOT NULL,
  lokasi TEXT DEFAULT 'Tegalsari, Musi Rawas',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Laporan Bulanan
CREATE TABLE IF NOT EXISTS laporan_tahunan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tahun INTEGER NOT NULL,
  bulan TEXT NOT NULL,
  blok_a REAL DEFAULT 0,
  blok_b REAL DEFAULT 0,
  blok_c REAL DEFAULT 0,
  blok_d REAL DEFAULT 0,
  harga REAL DEFAULT 2450
);

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- Seed Pekerja
INSERT OR IGNORE INTO pekerja (id, nama, posisi, blok, telp, email, avatar, status) VALUES
('PK-01', 'Wirawan, S.Kom', 'Estate Manager', 'Semua Blok', '0812-3456-7890', 'wirawan@sawitlestari.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 'Tetap'),
('PK-02', 'Joko Widodo', 'Mandor Lapangan', 'Blok A - Mandiri', '0813-8822-1100', 'joko.widodo@sawitlestari.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', 'Tetap'),
('PK-03', 'Sutrisno', 'Mandor Lapangan', 'Blok B - Makmur', '0821-4433-2211', 'sutrisno@sawitlestari.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', 'Tetap'),
('PK-04', 'Budi Santoso', 'Mandor Lapangan', 'Blok C - Sejahtera', '0852-9988-7766', 'budi.santoso@sawitlestari.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', 'Tetap'),
('PK-05', 'Hasan Basri', 'Mandor Panen', 'Blok D - Sentosa', '0813-5566-7788', 'hasan.basri@sawitlestari.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', 'Tetap'),
('PK-06', 'Dedi Kurniawan', 'Operator Sensor & Traktor', 'Divisi 1 & 2', '0878-1122-3344', 'dedi.kurniawan@sawitlestari.com', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', 'Kontrak');

-- Seed Data Lahan
INSERT OR IGNORE INTO lahan (id, nama, lokasi, luas, pohon, varietas, mandor, status) VALUES
(1, 'Blok A - Mandiri', 'Divisi 1 Utara', 45, 2250, 'Marihat (8 Thn)', 'Joko Widodo', 'Produktif'),
(2, 'Blok B - Makmur', 'Divisi 1 Selatan', 40, 2000, 'Tenera (6 Thn)', 'Sutrisno', 'Produktif'),
(3, 'Blok C - Sejahtera', 'Divisi 2 Barat', 48, 2400, 'Dumpy (5 Thn)', 'Budi Santoso', 'Produktif'),
(4, 'Blok D - Sentosa', 'Divisi 2 Timur', 35, 1750, 'Socfin (7 Thn)', 'Hasan Basri', 'Produktif');

-- Seed Catatan Kegiatan
INSERT OR IGNORE INTO kegiatan (id, tanggal, blok, jenis, deskripsi, kondisi, petugas) VALUES
(1, '2023-09-24', 'Blok A - Mandiri', 'Pemupukan', 'Pupuk NPK 1kg/pohon', 'Sangat Baik', 'Joko Widodo'),
(2, '2023-09-20', 'Blok B - Makmur', 'Pemangkasan', 'Pemangkasan pelepah kering (pruning)', 'Normal', 'Sutrisno'),
(3, '2023-09-18', 'Blok C - Sejahtera', 'Pengendalian Hama', 'Semprot herbisida gulma piringan', 'Perlu Perhatian', 'Budi Santoso'),
(4, '2023-09-15', 'Blok D - Sentosa', 'Pemanenan', 'Panen rotasi 12 hari TBS matang', 'Sangat Baik', 'Hasan Basri'),
(5, '2023-09-10', 'Blok A - Mandiri', 'Kastrasi', 'Kastrasi bunga jantan & betina muda', 'Normal', 'Joko Widodo'),
(6, '2023-09-05', 'Blok B - Makmur', 'Sanitasi Lahan', 'Pembersihan parit & gawangan mati', 'Sangat Baik', 'Sutrisno');

-- Seed Hasil Panen
INSERT OR IGNORE INTO panen (id, tanggal, blok, jumlah, harga, pembeli, status) VALUES
(1, '2023-09-23', 'Blok A - Mandiri', 2400, 2450, 'PT Sawit Jaya', 'Selesai'),
(2, '2023-09-20', 'Blok B - Makmur', 2100, 2450, 'PT Sawit Jaya', 'Selesai'),
(3, '2023-09-16', 'Blok C - Sejahtera', 1900, 2500, 'CV Berkah Sawit', 'Selesai'),
(4, '2023-09-12', 'Blok D - Sentosa', 2500, 2450, 'PT Sawit Jaya', 'Selesai'),
(5, '2023-09-08', 'Blok A - Mandiri', 2300, 2400, 'PT Agro Lestari', 'Selesai');

-- Seed Data Cuaca
INSERT OR IGNORE INTO cuaca (id, tanggal, jam, suhu, kelembaban, curah, kondisi) VALUES
(1, '2023-09-27', '12:00', 31, 81, 45, 'Hujan Sedang'),
(2, '2023-09-27', '07:00', 25, 92, 10, 'Cerah Berawan'),
(3, '2023-09-26', '12:00', 33, 74, 0, 'Panas Terik'),
(4, '2023-09-26', '07:00', 26, 88, 0, 'Cerah Berawan'),
(5, '2023-09-25', '17:00', 28, 85, 35, 'Hujan Lebat');

-- Seed Laporan Tahunan 2023
INSERT OR IGNORE INTO laporan_tahunan (tahun, bulan, blok_a, blok_b, blok_c, blok_d, harga) VALUES
(2023, 'Januari', 2200, 1800, 1950, 1600, 2450),
(2023, 'Februari', 2400, 1950, 2100, 1700, 2450),
(2023, 'Maret', 2500, 2100, 2250, 1850, 2450),
(2023, 'April', 2600, 2200, 2400, 1900, 2450),
(2023, 'Mei', 2750, 2300, 2500, 2050, 2450),
(2023, 'Juni', 2800, 2400, 2600, 2100, 2450),
(2023, 'Juli', 2650, 2350, 2450, 2000, 2450),
(2023, 'Agustus', 2900, 2500, 2700, 2200, 2450),
(2023, 'September', 2400, 2100, 1900, 2500, 2450),
(2023, 'Oktober', 2850, 2400, 2550, 2150, 2450),
(2023, 'November', 2700, 2250, 2400, 2000, 2450),
(2023, 'Desember', 2550, 2150, 2300, 1900, 2450);

-- ============================================================================
-- 7. TABEL PENGATURAN SISTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS pengaturan (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nama_kebun TEXT DEFAULT 'Kebun Sawit Sei Karang',
  perusahaan TEXT DEFAULT 'PT Agro Sawit Lestari Mandiri',
  alamat TEXT DEFAULT 'Jl. Poros Sawit No. 88, Riau, Sumatera',
  target_produksi REAL DEFAULT 300,
  harga_tbs REAL DEFAULT 2500,
  notif_cuaca INTEGER DEFAULT 1,
  notif_pupuk INTEGER DEFAULT 1,
  notif_iot INTEGER DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO pengaturan (id, nama_kebun, perusahaan, alamat, target_produksi, harga_tbs, notif_cuaca, notif_pupuk, notif_iot)
VALUES (1, 'Kebun Sawit Sei Karang', 'PT Agro Sawit Lestari Mandiri', 'Jl. Poros Sawit No. 88, Riau, Sumatera', 300, 2500, 1, 1, 1);
