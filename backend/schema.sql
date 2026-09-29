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
-- INITIAL SEED DATA (DEFAULT MINIMUM HANYA ESTATE MANAGER)
-- ============================================================================

-- Seed Pekerja Default Minimum (Estate Manager)
INSERT OR IGNORE INTO pekerja (id, nama, posisi, blok, telp, email, avatar, status) VALUES
('PK-01', 'Wirawan, S.Kom', 'Estate Manager', 'Semua Blok', '0812-3456-7890', 'wirawan@sawitlestari.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', 'Tetap');

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

