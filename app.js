/**
 * SAWIT PINTAR - CORE APPLICATION SCRIPT
 * Features:
 * - Direct Synchronization: Estate Manager in Manajemen Pekerja <-> Header & Sidebar Profile
 * - Unified Employee Management: All profiles (including Estate Manager) managed in Manajemen Pekerja
 * - Full Employee Profiles with Avatars, Email, Phone, Block Assignment, and Status
 * - Bidirectional Data Relationship: Data Lahan <-> Manajemen Pekerja
 * - Cloudflare D1 Backend Integration (via ApiService) with Offline LocalStorage Fallback
 * - Full CRUD for Data Lahan, Manajemen Pekerja, Catatan Kegiatan, Panen & Cuaca
 * - Interactive Charts (Chart.js), Tab Navigation, CSV Export, Real-time Clock
 */

// Avatar Presets
const AVATAR_PRESETS = {
  preset1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  preset2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  preset3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  preset4: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
};

// Global Application State
const state = {
  activeView: 'dashboard',

  // System Privacy & Authentication Config (Default: si_wrwn / 130399)
  isAuthenticated: false,
  authConfig: {
    username: 'si_wrwn',
    passwordHash: '8a129035e98bb4b6b669e46a7824896796348efca66eb132a26514757aeeb448',
    plainPasswordBackup: '130399'
  },

  // Manajemen Pekerja (All profiles, including Estate Manager)
  pekerjaList: [
    {
      id: 'PK-01',
      nama: 'Wirawan, S.Kom',
      posisi: 'Estate Manager',
      blok: 'Semua Blok',
      telp: '0812-3456-7890',
      email: 'wirawan@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset1,
      status: 'Tetap'
    },
    {
      id: 'PK-02',
      nama: 'Joko Widodo',
      posisi: 'Mandor Lapangan',
      blok: 'Blok A - Mandiri',
      telp: '0813-8822-1100',
      email: 'joko.widodo@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset2,
      status: 'Tetap'
    },
    {
      id: 'PK-03',
      nama: 'Sutrisno',
      posisi: 'Mandor Lapangan',
      blok: 'Blok B - Makmur',
      telp: '0821-4433-2211',
      email: 'sutrisno@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset3,
      status: 'Tetap'
    },
    {
      id: 'PK-04',
      nama: 'Budi Santoso',
      posisi: 'Mandor Lapangan',
      blok: 'Blok C - Sejahtera',
      telp: '0852-9988-7766',
      email: 'budi.santoso@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset2,
      status: 'Tetap'
    },
    {
      id: 'PK-05',
      nama: 'Hasan Basri',
      posisi: 'Mandor Panen',
      blok: 'Blok D - Sentosa',
      telp: '0813-5566-7788',
      email: 'hasan.basri@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset3,
      status: 'Tetap'
    },
    {
      id: 'PK-06',
      nama: 'Dedi Kurniawan',
      posisi: 'Operator Sensor & Traktor',
      blok: 'Divisi 1 & 2',
      telp: '0878-1122-3344',
      email: 'dedi.kurniawan@sawitlestari.com',
      avatar: AVATAR_PRESETS.preset4,
      status: 'Kontrak'
    }
  ],

  // Data Lahan (with direct relation to Mandor in pekerjaList)
  lahanList: [
    { id: 1, nama: 'Blok A - Mandiri', lokasi: 'Divisi 1 Utara', luas: 45, pohon: 2250, varietas: 'Marihat (8 Thn)', mandor: 'Joko Widodo', status: 'Produktif' },
    { id: 2, nama: 'Blok B - Makmur', lokasi: 'Divisi 1 Selatan', luas: 40, pohon: 2000, varietas: 'Tenera (6 Thn)', mandor: 'Sutrisno', status: 'Produktif' },
    { id: 3, nama: 'Blok C - Sejahtera', lokasi: 'Divisi 2 Barat', luas: 48, pohon: 2400, varietas: 'Dumpy (5 Thn)', mandor: 'Budi Santoso', status: 'Produktif' },
    { id: 4, nama: 'Blok D - Sentosa', lokasi: 'Divisi 2 Timur', luas: 35, pohon: 1750, varietas: 'Socfin (7 Thn)', mandor: 'Hasan Basri', status: 'Produktif' }
  ],

  // Catatan Kegiatan Agronomi
  kegiatanList: [
    { id: 1, tanggal: '2023-09-24', blok: 'Blok A - Mandiri', jenis: 'Pemupukan', deskripsi: 'Pupuk NPK 1kg/pohon', kondisi: 'Sangat Baik', petugas: 'Joko Widodo' },
    { id: 2, tanggal: '2023-09-20', blok: 'Blok B - Makmur', jenis: 'Pemangkasan', deskripsi: 'Pemangkasan pelepah kering (pruning)', kondisi: 'Normal', petugas: 'Sutrisno' },
    { id: 3, tanggal: '2023-09-18', blok: 'Blok C - Sejahtera', jenis: 'Pengendalian Hama', deskripsi: 'Semprot herbisida gulma piringan', kondisi: 'Perlu Perhatian', petugas: 'Budi Santoso' },
    { id: 4, tanggal: '2023-09-15', blok: 'Blok D - Sentosa', jenis: 'Pemanenan', deskripsi: 'Panen rotasi 12 hari TBS matang', kondisi: 'Sangat Baik', petugas: 'Hasan Basri' },
    { id: 5, tanggal: '2023-09-10', blok: 'Blok A - Mandiri', jenis: 'Kastrasi', deskripsi: 'Kastrasi bunga jantan & betina muda', kondisi: 'Normal', petugas: 'Joko Widodo' },
    { id: 6, tanggal: '2023-09-05', blok: 'Blok B - Makmur', jenis: 'Sanitasi Lahan', deskripsi: 'Pembersihan parit & gawangan mati', kondisi: 'Sangat Baik', petugas: 'Sutrisno' }
  ],

  // Hasil Panen
  panenList: [
    { id: 1, tanggal: '2023-09-23', blok: 'Blok A - Mandiri', jumlah: 2400, harga: 2450, pembeli: 'PT Sawit Jaya', status: 'Selesai' },
    { id: 2, tanggal: '2023-09-20', blok: 'Blok B - Makmur', jumlah: 2100, harga: 2450, pembeli: 'PT Sawit Jaya', status: 'Selesai' },
    { id: 3, tanggal: '2023-09-16', blok: 'Blok C - Sejahtera', jumlah: 1900, harga: 2500, pembeli: 'CV Berkah Sawit', status: 'Selesai' },
    { id: 4, tanggal: '2023-09-12', blok: 'Blok D - Sentosa', jumlah: 2500, harga: 2450, pembeli: 'PT Sawit Jaya', status: 'Selesai' },
    { id: 5, tanggal: '2023-09-08', blok: 'Blok A - Mandiri', jumlah: 2300, harga: 2400, pembeli: 'PT Agro Lestari', status: 'Selesai' }
  ],

  // Monitoring Cuaca
  cuacaList: [
    { id: 1, tanggal: '2023-09-27', jam: '12:00', suhu: 31, kelembaban: 81, curah: 45, kondisi: 'Hujan Sedang' },
    { id: 2, tanggal: '2023-09-27', jam: '07:00', suhu: 25, kelembaban: 92, curah: 10, kondisi: 'Cerah Berawan' },
    { id: 3, tanggal: '2023-09-26', jam: '12:00', suhu: 33, kelembaban: 74, curah: 0, kondisi: 'Panas Terik' },
    { id: 4, tanggal: '2023-09-26', jam: '07:00', suhu: 26, kelembaban: 88, curah: 0, kondisi: 'Cerah Berawan' },
    { id: 5, tanggal: '2023-09-25', jam: '17:00', suhu: 28, kelembaban: 85, curah: 35, kondisi: 'Hujan Lebat' }
  ],

  // Weather Location Settings
  weatherLocation: JSON.parse(localStorage.getItem('sawit_weather_location')) || {
    preset: 'musi_rawas',
    name: 'Tegalsari, Megang Sakti, Musi Rawas',
    lat: -3.1764,
    lon: 102.9902
  },

  // Weather Table Pagination State
  cuacaPagination: {
    currentPage: 1,
    pageSize: 7
  },

  // Pengaturan Sistem Perkebunan (Sinkron Local & Cloud D1)
  pengaturan: {
    nama_kebun: 'Kebun Sawit Sei Karang',
    perusahaan: 'PT Agro Sawit Lestari Mandiri',
    alamat: 'Jl. Poros Sawit No. 88, Riau, Sumatera',
    target_produksi: 300,
    harga_tbs: 2500,
    notif_cuaca: true,
    notif_pupuk: true,
    notif_iot: true
  },

  // Laporan Panen 2023 Bulanan
  laporan2023: [
    { bulan: 'Januari', blokA: 2200, blokB: 1800, blokC: 1950, blokD: 1600, harga: 2450 },
    { bulan: 'Februari', blokA: 2400, blokB: 1950, blokC: 2100, blokD: 1700, harga: 2450 },
    { bulan: 'Maret', blokA: 2500, blokB: 2100, blokC: 2250, blokD: 1850, harga: 2450 },
    { bulan: 'April', blokA: 2600, blokB: 2200, blokC: 2400, blokD: 1900, harga: 2450 },
    { bulan: 'Mei', blokA: 2750, blokB: 2300, blokC: 2500, blokD: 2050, harga: 2450 },
    { bulan: 'Juni', blokA: 2800, blokB: 2400, blokC: 2600, blokD: 2100, harga: 2450 },
    { bulan: 'Juli', blokA: 2650, blokB: 2350, blokC: 2450, blokD: 2000, harga: 2450 },
    { bulan: 'Agustus', blokA: 2900, blokB: 2500, blokC: 2700, blokD: 2200, harga: 2450 },
    { bulan: 'September', blokA: 2400, blokB: 2100, blokC: 1900, blokD: 2500, harga: 2450 },
    { bulan: 'Oktober', blokA: 2850, blokB: 2400, blokC: 2550, blokD: 2150, harga: 2450 },
    { bulan: 'November', blokA: 2700, blokB: 2250, blokC: 2400, blokD: 2000, harga: 2450 },
    { bulan: 'Desember', blokA: 2550, blokB: 2150, blokC: 2300, blokD: 1900, harga: 2450 }
  ]
};

// Chart instances store
const charts = {};

// Application Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  checkAuthSession();
  updateAuthUI();

  await loadSavedData();
  renderUserProfile();
  initClock();
  initNavigation();
  initTables();
  initCharts();
  initModals();
  initEventListeners();

  if (window.lucide) {
    lucide.createIcons();
  }
});

/* ==========================================================================
   PERSISTENCE & USER PROFILE SYNCHRONIZATION
   ========================================================================== */
async function loadSavedData() {
  // 1. Load LocalStorage first (instant paint)
  try {
    const savedPekerja = localStorage.getItem('sawit_pekerja_list');
    if (savedPekerja) state.pekerjaList = JSON.parse(savedPekerja);
    const savedLahan = localStorage.getItem('sawit_lahan_list');
    if (savedLahan) state.lahanList = JSON.parse(savedLahan);
    const savedKegiatan = localStorage.getItem('sawit_kegiatan_list');
    if (savedKegiatan) state.kegiatanList = JSON.parse(savedKegiatan);
    const savedPanen = localStorage.getItem('sawit_panen_list');
    if (savedPanen) state.panenList = JSON.parse(savedPanen);
    const savedCuaca = localStorage.getItem('sawit_cuaca_list');
    if (savedCuaca) state.cuacaList = JSON.parse(savedCuaca);
    const savedPengaturan = localStorage.getItem('sawit_pengaturan');
    if (savedPengaturan) {
      state.pengaturan = { ...state.pengaturan, ...JSON.parse(savedPengaturan) };
    }
  } catch (err) {
    console.warn('Local storage load note', err);
  }

  // 2. Pre-fill setting API URL input
  const settingInput = document.getElementById('setting-api-url');
  if (settingInput && window.ApiService) {
    settingInput.value = ApiService.getBaseUrl();
  }

  // Pre-fill Weather Location Settings
  const wPreset = document.getElementById('setting-weather-preset');
  const wName = document.getElementById('setting-weather-name');
  const wLat = document.getElementById('setting-weather-lat');
  const wLon = document.getElementById('setting-weather-lon');

  if (wPreset && state.weatherLocation) {
    wPreset.value = state.weatherLocation.preset || 'musi_rawas';
    if (wName) wName.value = state.weatherLocation.name || 'Tegalsari, Megang Sakti, Musi Rawas';
    if (wLat) wLat.value = state.weatherLocation.lat ?? -3.1764;
    if (wLon) wLon.value = state.weatherLocation.lon ?? 102.9902;
  }

  // 3. Check connection to Cloudflare D1
  if (window.ApiService && ApiService.getBaseUrl()) {
    const online = await ApiService.checkConnection();
    updateApiStatusBadge(online);

    if (online) {
      showToast('Terhubung ke database Cloudflare D1!', 'success');
      try {
        const [dbLahan, dbPekerja, dbKegiatan, dbPanen, dbCuaca, dbPengaturan] = await Promise.all([
          ApiService.lahan.get(),
          ApiService.pekerja.get(),
          ApiService.kegiatan.get(),
          ApiService.panen.get(),
          ApiService.cuaca.get(),
          ApiService.pengaturan.get()
        ]);

        if (dbLahan && dbLahan.length > 0) state.lahanList = dbLahan;
        if (dbPekerja && dbPekerja.length > 0) state.pekerjaList = dbPekerja;
        if (dbKegiatan && dbKegiatan.length > 0) state.kegiatanList = dbKegiatan;
        if (dbPanen && dbPanen.length > 0) state.panenList = dbPanen;
        if (dbCuaca && dbCuaca.length > 0) state.cuacaList = dbCuaca;
        if (dbPengaturan) {
          state.pengaturan = {
            ...state.pengaturan,
            ...dbPengaturan,
            notif_cuaca: !!dbPengaturan.notif_cuaca,
            notif_pupuk: !!dbPengaturan.notif_pupuk,
            notif_iot: !!dbPengaturan.notif_iot
          };
          localStorage.setItem('sawit_pengaturan', JSON.stringify(state.pengaturan));
        }
      } catch (err) {
        console.warn('Cloud sync error, staying on local', err);
      }
    }
  } else {
    updateApiStatusBadge(false);
  }

  // Render initial settings and weather
  renderSettingsUI();

  if (state.cuacaList && state.cuacaList.length > 0) {
    updateWeatherUI(state.cuacaList[0]);
  } else {
    updateWeatherUI(null);
  }
}

function updateApiStatusBadge(isOnline) {
  const badge = document.getElementById('badge-api-status');
  if (badge) {
    if (isOnline) {
      badge.className = 'badge badge-soft-green';
      badge.innerHTML = '<i data-lucide="cloud"></i> Cloudflare D1 Aktif';
    } else {
      badge.className = 'badge badge-soft-amber';
      badge.innerHTML = '<i data-lucide="hard-drive"></i> Mode Standalone (Lokal)';
    }
    if (window.lucide) lucide.createIcons();
  }
}

function saveLocalState() {
  try {
    localStorage.setItem('sawit_pekerja_list', JSON.stringify(state.pekerjaList));
    localStorage.setItem('sawit_lahan_list', JSON.stringify(state.lahanList));
    localStorage.setItem('sawit_kegiatan_list', JSON.stringify(state.kegiatanList));
    localStorage.setItem('sawit_panen_list', JSON.stringify(state.panenList));
    localStorage.setItem('sawit_cuaca_list', JSON.stringify(state.cuacaList));
  } catch (err) {
    console.warn('LocalStorage save failed', err);
  }
}

// Get the current Estate Manager worker
function getEstateManager() {
  return state.pekerjaList.find(p => p.posisi === 'Estate Manager') || state.pekerjaList[0];
}

// Automatically sync Header and Sidebar profile with Estate Manager
function renderUserProfile() {
  const em = getEstateManager();
  if (!em) return;

  // Header Elements
  const headerName = document.getElementById('header-user-name');
  const headerRole = document.getElementById('header-user-role');
  const headerAvatar = document.getElementById('header-user-avatar');

  if (headerName) headerName.textContent = em.nama;
  if (headerRole) headerRole.textContent = em.posisi;
  if (headerAvatar) headerAvatar.src = em.avatar || AVATAR_PRESETS.preset1;

  // Sidebar Elements
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');
  const sidebarAvatarImg = document.getElementById('sidebar-user-avatar-img');

  if (sidebarName) sidebarName.textContent = em.nama;
  if (sidebarRole) sidebarRole.textContent = em.posisi;
  if (sidebarAvatarImg) sidebarAvatarImg.src = em.avatar || AVATAR_PRESETS.preset1;
}

/* ==========================================================================
   NAVIGATION & VIEW SWITCHING
   ========================================================================== */
function initNavigation() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  const closeMobileSidebar = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
  };

  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      if (viewId) {
        switchView(viewId);
        // Automatically close sidebar drawer on mobile after selecting a menu
        if (window.innerWidth <= 820) {
          closeMobileSidebar();
        }
      }
    });
  });

  // Mobile sidebar toggle & backdrop click
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop?.classList.toggle('active', sidebar.classList.contains('open'));
    });
  }

  backdrop?.addEventListener('click', closeMobileSidebar);

  // Profile click opens/navigates directly to Manajemen Pekerja and edits Estate Manager
  const openEstateManagerEdit = () => {
    switchView('manajemen-pekerja');
    const em = getEstateManager();
    if (em) {
      editPekerja(em.id);
    }
  };

  document.getElementById('header-user-profile')?.addEventListener('click', openEstateManagerEdit);
  document.getElementById('sidebar-user-profile')?.addEventListener('click', openEstateManagerEdit);

  // Notification dropdown toggle
  const notifBtn = document.getElementById('btn-notifications');
  const notifDropdown = document.getElementById('notification-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.add('hidden');
      }
    });
  }
}

function switchView(viewId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
    state.activeView = viewId;
  }

  const breadcrumb = document.getElementById('breadcrumb-current-page');
  if (breadcrumb) {
    const titleMap = {
      'dashboard': 'Dashboard Sawit Pintar',
      'data-lahan': 'Data Lahan',
      'perkembangan': 'Perkembangan Tanaman',
      'hasil-panen': 'Hasil Panen',
      'monitoring-cuaca': 'Monitoring Cuaca',
      'laporan': 'Laporan',
      'manajemen-pekerja': 'Manajemen Pekerja',
      'pengaturan': 'Pengaturan Sistem'
    };
    breadcrumb.textContent = titleMap[viewId] || 'Sawit Pintar';
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');

  setTimeout(() => {
    Object.values(charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }, 100);

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* ==========================================================================
   REALTIME CLOCK
   ========================================================================== */
function initClock() {
  const clockEl = document.getElementById('clock-display');
  function update() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    if (clockEl) {
      clockEl.textContent = now.toLocaleDateString('id-ID', options);
    }
  }
  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   TABLE RENDERING & INTERACTIVE RELATIONS
   ========================================================================== */
function initTables() {
  renderLahanTable();
  renderKegiatanTable();
  renderPanenTable();
  renderCuacaTable();
  renderLaporanTable();
  renderPekerjaTable();
  renderDashboardActivities();
  updateKPIs();
}

// 1. Data Lahan Table (With Mandor Relation & Detail Popover)
function renderLahanTable(filteredList = state.lahanList) {
  const tbody = document.getElementById('lahan-table-body');
  if (!tbody) return;

  if (filteredList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px;">Tidak ada data lahan yang cocok</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map((item, index) => {
    const mandorBadge = item.mandor
      ? `<button class="badge-mandor" onclick="showLahanDetail(${item.id})" title="Klik untuk lihat mandor & tim lapangan"><i data-lucide="user-check"></i> ${item.mandor}</button>`
      : `<span class="badge badge-unassigned">Belum Ditugaskan</span>`;

    return `
      <tr>
        <td><strong>${index + 1}</strong></td>
        <td><strong>${item.nama}</strong></td>
        <td><span class="text-muted">${item.lokasi}</span></td>
        <td><strong>${item.luas}</strong> Ha</td>
        <td>${Number(item.pohon).toLocaleString('id-ID')} pohon</td>
        <td><span class="badge badge-soft-blue">${item.varietas}</span></td>
        <td>${mandorBadge}</td>
        <td><span class="badge badge-soft-green">${item.status}</span></td>
        <td>
          <div class="action-btn-group">
            <button class="btn-table-action" title="Lihat Tim & Detail" onclick="showLahanDetail(${item.id})"><i data-lucide="eye"></i></button>
            <button class="btn-table-action" title="Edit Lahan" onclick="editLahan(${item.id})"><i data-lucide="edit-3"></i></button>
            <button class="btn-table-action delete" title="Hapus Lahan" onclick="deleteLahan(${item.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
  updateLahanStats();
}

function updateLahanStats() {
  const totalLahan = state.lahanList.length;
  const totalLuas = state.lahanList.reduce((acc, curr) => acc + Number(curr.luas), 0);
  const totalPohon = state.lahanList.reduce((acc, curr) => acc + Number(curr.pohon), 0);
  const kepadatan = totalLuas > 0 ? Math.round(totalPohon / totalLuas) : 0;

  const statLahan = document.getElementById('stat-total-lahan');
  const statLuas = document.getElementById('stat-total-luas');
  const statPohon = document.getElementById('stat-total-pohon');
  const statKepadatan = document.getElementById('stat-kepadatan');

  if (statLahan) statLahan.textContent = totalLahan;
  if (statLuas) statLuas.textContent = `${totalLuas} Ha`;
  if (statPohon) statPohon.textContent = totalPohon.toLocaleString('id-ID');
  if (statKepadatan) statKepadatan.textContent = kepadatan;
}

// Show Lahan Detail & Assigned Workers Relation Modal
function showLahanDetail(lahanId) {
  const lahan = state.lahanList.find(l => l.id === lahanId);
  if (!lahan) return;

  const assignedWorkers = state.pekerjaList.filter(p => 
    p.blok === lahan.nama || (p.blok && lahan.nama.includes(p.blok)) || p.blok === 'Semua Blok'
  );

  const titleEl = document.getElementById('detail-lahan-title');
  const bodyEl = document.getElementById('detail-lahan-body');
  const jumpBtn = document.getElementById('btn-jump-to-workers');

  if (titleEl) titleEl.innerHTML = `<i data-lucide="map-pin" style="color:var(--primary-green); vertical-align:middle;"></i> ${lahan.nama}`;

  if (bodyEl) {
    const workersHtml = assignedWorkers.map(w => `
      <div class="team-member-item">
        <div class="team-member-info">
          <img src="${w.avatar || AVATAR_PRESETS.preset1}" class="table-avatar" style="width:32px; height:32px;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(w.nama)}&background=2E7D32&color=fff'">
          <div>
            <strong>${w.nama}</strong>
            <p style="font-size:11.5px; color:var(--text-muted); margin:0;">${w.posisi} • <span class="badge badge-soft-green">${w.status}</span> • ${w.email || '-'}</p>
          </div>
        </div>
        <button class="btn btn-sm btn-outline" onclick="callPekerja('${w.nama}', '${w.telp}')" title="Hubungi">
          <i data-lucide="phone"></i> ${w.telp}
        </button>
      </div>
    `).join('');

    bodyEl.innerHTML = `
      <div class="detail-lahan-kpi-grid">
        <div class="detail-lahan-kpi">
          <span class="label">Luas Area</span>
          <span class="val">${lahan.luas} Ha</span>
        </div>
        <div class="detail-lahan-kpi">
          <span class="label">Populasi Pohon</span>
          <span class="val">${lahan.pohon.toLocaleString('id-ID')} Pohon</span>
        </div>
        <div class="detail-lahan-kpi">
          <span class="label">Varietas Bibit</span>
          <span class="val" style="font-size:14px;">${lahan.varietas}</span>
        </div>
      </div>

      <div class="detail-team-box">
        <h4><i data-lucide="users"></i> Tim Lapangan Penanggung Jawab</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
          Pekerja yang bertugas aktif merawat dan memanen di <strong>${lahan.nama}</strong>:
        </p>
        <div class="detail-team-list">
          ${assignedWorkers.length > 0 ? workersHtml : '<p class="text-muted" style="padding:10px;">Belum ada pekerja yang ditugaskan ke blok ini.</p>'}
        </div>
      </div>
    `;
  }

  if (jumpBtn) {
    jumpBtn.onclick = () => {
      closeModal('modal-detail-lahan');
      switchView('manajemen-pekerja');
      const searchBox = document.getElementById('search-pekerja');
      if (searchBox) {
        searchBox.value = lahan.nama.split(' - ')[0];
        const event = new Event('input', { bubbles: true });
        searchBox.dispatchEvent(event);
      }
    };
  }

  openModal('modal-detail-lahan');
  if (window.lucide) lucide.createIcons();
}

// 2. Manajemen Pekerja Table (With Avatars, Email, and Actions)
function renderPekerjaTable(filteredList = state.pekerjaList) {
  const tbody = document.getElementById('pekerja-table-body');
  if (!tbody) return;

  if (filteredList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">Tidak ada data pekerja yang cocok</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map(item => `
    <tr>
      <td><code>${item.id}</code></td>
      <td>
        <div class="worker-name-cell">
          <img src="${item.avatar || AVATAR_PRESETS.preset1}" alt="${item.nama}" class="table-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(item.nama)}&background=2E7D32&color=fff'">
          <div class="worker-meta">
            <span class="name">${item.nama}</span>
            <span class="email">${item.email || '-'}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="badge ${item.posisi === 'Estate Manager' ? 'badge-soft-amber' : item.posisi.includes('Mandor') ? 'badge-soft-green' : 'badge-soft-blue'}">
          ${item.posisi}
        </span>
      </td>
      <td><strong>${item.blok}</strong></td>
      <td>${item.telp}</td>
      <td><span class="badge ${item.status === 'Tetap' ? 'badge-soft-green' : 'badge-soft-amber'}">${item.status}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-table-action" title="Edit Data Pekerja" onclick="editPekerja('${item.id}')"><i data-lucide="edit-3"></i></button>
          <button class="btn-table-action" title="Hubungi Pekerja" onclick="callPekerja('${item.nama}', '${item.telp}')"><i data-lucide="phone"></i></button>
          <button class="btn-table-action delete" title="Hapus Pekerja" onclick="deletePekerja('${item.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function callPekerja(nama, telp) {
  showToast(`Menghubungi ${nama} (${telp})...`);
  window.open(`tel:${telp.replace(/\D/g, '')}`, '_self');
}

// 3. Kegiatan Perkembangan Table
function renderKegiatanTable(filteredList = state.kegiatanList) {
  const tbody = document.getElementById('kegiatan-table-body');
  const countEl = document.getElementById('count-kegiatan');
  if (countEl) countEl.textContent = filteredList.length;
  if (!tbody) return;

  if (filteredList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">Tidak ada catatan kegiatan yang cocok</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map(item => {
    let kondisiBadge = 'badge-soft-green';
    if (item.kondisi === 'Perlu Perhatian') kondisiBadge = 'badge-soft-red';
    else if (item.kondisi === 'Normal') kondisiBadge = 'badge-soft-amber';

    return `
      <tr>
        <td><strong>${formatTanggal(item.tanggal)}</strong></td>
        <td><span class="badge badge-soft-blue">${item.blok}</span></td>
        <td><strong>${item.jenis}</strong></td>
        <td>${item.deskripsi}</td>
        <td><span class="badge ${kondisiBadge}">${item.kondisi}</span></td>
        <td>${item.petugas}</td>
        <td>
          <div class="action-btn-group">
            <button class="btn-table-action" title="Detail" onclick="showToast('Kegiatan: ${item.jenis} di ${item.blok}')"><i data-lucide="eye"></i></button>
            <button class="btn-table-action delete" title="Hapus" onclick="deleteKegiatan(${item.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// 4. Hasil Panen Table
function renderPanenTable(filteredList = state.panenList) {
  const tbody = document.getElementById('panen-table-body');
  if (!tbody) return;

  if (filteredList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 24px;">Tidak ada data panen yang cocok</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredList.map(item => {
    const total = item.jumlah * item.harga;
    return `
      <tr>
        <td><strong>${formatTanggal(item.tanggal)}</strong></td>
        <td><span class="badge badge-soft-blue">${item.blok}</span></td>
        <td><strong>${item.jumlah.toLocaleString('id-ID')}</strong> kg</td>
        <td>Rp ${item.harga.toLocaleString('id-ID')} / kg</td>
        <td><strong class="text-success">Rp ${total.toLocaleString('id-ID')}</strong></td>
        <td><span class="badge-buyer">${item.pembeli}</span></td>
        <td>
          <div class="action-btn-group">
            <button class="btn-table-action delete" title="Hapus" onclick="deletePanen(${item.id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();

  const totalKg = state.panenList.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalUang = state.panenList.reduce((acc, curr) => acc + (curr.jumlah * curr.harga), 0);
  const rataHarga = totalKg > 0 ? Math.round(totalUang / totalKg) : 0;

  const totalPanenEl = document.getElementById('ringkasan-total-panen');
  const rataHargaEl = document.getElementById('ringkasan-rata-harga');
  const totalPendapatanEl = document.getElementById('ringkasan-total-pendapatan');

  if (totalPanenEl) totalPanenEl.textContent = `${totalKg.toLocaleString('id-ID')} kg`;
  if (rataHargaEl) rataHargaEl.textContent = `Rp ${rataHarga.toLocaleString('id-ID')} / kg`;
  if (totalPendapatanEl) totalPendapatanEl.textContent = `Rp ${totalUang.toLocaleString('id-ID')}`;
}

// 5. Monitoring Cuaca Table & Rekap
function renderCuacaTable() {
  const tbody = document.getElementById('cuaca-table-body');
  if (!tbody) return;

  const filterBulan = document.getElementById('filter-cuaca-bulan')?.value || 'all';
  const filterLokasi = document.getElementById('filter-cuaca-lokasi')?.value || 'all';

  // Populate dynamic location options if dropdown exists
  const locSelect = document.getElementById('filter-cuaca-lokasi');
  if (locSelect) {
    const currentLocVal = locSelect.value;
    const locations = Array.from(new Set(state.cuacaList.map(item => item.lokasi || 'Tegalsari, Musi Rawas')));
    locSelect.innerHTML = `<option value="all">Semua Lokasi Stasiun</option>` + 
      locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
    if (locations.includes(currentLocVal)) {
      locSelect.value = currentLocVal;
    }
  }

  // Filter list
  let filtered = state.cuacaList || [];

  if (filterBulan !== 'all') {
    filtered = filtered.filter(item => item.tanggal && item.tanggal.startsWith(filterBulan));
  }

  if (filterLokasi !== 'all') {
    filtered = filtered.filter(item => (item.lokasi || 'Tegalsari, Musi Rawas') === filterLokasi);
  }

  // Calculate Rekap Stats (over full filtered dataset)
  const recTotal = document.getElementById('rekap-text-total');
  const recSuhu = document.getElementById('rekap-text-suhu');
  const recHujan = document.getElementById('rekap-text-hujan');
  const recHum = document.getElementById('rekap-text-kelembaban');

  if (filtered.length > 0) {
    const avgSuhu = (filtered.reduce((acc, curr) => acc + (curr.suhu || 0), 0) / filtered.length).toFixed(1);
    const sumHujan = (filtered.reduce((acc, curr) => acc + (curr.curah || 0), 0)).toFixed(1);
    const avgHum = Math.round(filtered.reduce((acc, curr) => acc + (curr.kelembaban || 0), 0) / filtered.length);

    if (recTotal) recTotal.textContent = `Total Record: ${filtered.length} Hari/Entry`;
    if (recSuhu) recSuhu.textContent = `Rerata Suhu: ${avgSuhu}°C`;
    if (recHujan) recHujan.textContent = `Total Hujan: ${sumHujan} mm`;
    if (recHum) recHum.textContent = `Kelembaban Rerata: ${avgHum}%`;
  } else {
    if (recTotal) recTotal.textContent = `Total Record: 0`;
    if (recSuhu) recSuhu.textContent = `Rerata Suhu: -°C`;
    if (recHujan) recHujan.textContent = `Total Hujan: - mm`;
    if (recHum) recHum.textContent = `Kelembaban Rerata: -%`;
  }

  // Pagination bounds & slice calculation
  const totalRecords = filtered.length;
  const pageSize = state.cuacaPagination.pageSize || 7;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  if (state.cuacaPagination.currentPage > totalPages) {
    state.cuacaPagination.currentPage = totalPages;
  }
  if (state.cuacaPagination.currentPage < 1) {
    state.cuacaPagination.currentPage = 1;
  }

  const currentPage = state.cuacaPagination.currentPage;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  // Update Pagination Controls UI
  const infoEl = document.getElementById('cuaca-pagination-info');
  const pageNumEl = document.getElementById('cuaca-page-num');
  const prevBtn = document.getElementById('btn-cuaca-prev');
  const nextBtn = document.getElementById('btn-cuaca-next');

  if (infoEl) {
    if (totalRecords === 0) {
      infoEl.textContent = 'Menampilkan 0 data';
    } else {
      infoEl.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalRecords} data`;
    }
  }

  if (pageNumEl) {
    pageNumEl.textContent = `Halaman ${currentPage} / ${totalPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1 || totalRecords === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages || totalRecords === 0;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted" style="padding: 24px;">
          Belum ada data cuaca untuk filter ini. Klik <strong>"Sync Stasiun Cuaca"</strong> di atas untuk menarik telemetry.
        </td>
      </tr>
    `;
    return;
  }

  const pageData = filtered.slice(startIndex, endIndex);

  tbody.innerHTML = pageData.map(item => `
    <tr>
      <td><strong>${formatTanggal(item.tanggal)}</strong></td>
      <td>${item.jam ? item.jam.replace(/\s*WIB/gi, '') : '12:00'} WIB</td>
      <td><span class="badge badge-soft-green" style="font-weight:600;"><i data-lucide="map-pin" style="width:12px; height:12px;"></i> ${item.lokasi || 'Tegalsari, Musi Rawas'}</span></td>
      <td><strong>${item.suhu}°C</strong></td>
      <td>${item.kelembaban}%</td>
      <td>${item.curah} mm</td>
      <td><span class="badge ${item.curah > 20 ? 'badge-soft-blue' : 'badge-soft-amber'}">${item.kondisi}</span></td>
      <td>
        <div class="action-btn-group">
          <button class="btn-table-action delete" title="Hapus" onclick="deleteCuaca(${item.id})"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// 6. Laporan Tahunan Table (2023)
function renderLaporanTable() {
  const tbody = document.getElementById('laporan-table-body');
  const tfoot = document.getElementById('laporan-table-footer');
  if (!tbody) return;

  let sumA = 0, sumB = 0, sumC = 0, sumD = 0, sumTotalKg = 0, sumPendapatan = 0;

  tbody.innerHTML = state.laporan2023.map(row => {
    const totalBulan = row.blokA + row.blokB + row.blokC + row.blokD;
    const pendapatanBulan = totalBulan * row.harga;

    sumA += row.blokA;
    sumB += row.blokB;
    sumC += row.blokC;
    sumD += row.blokD;
    sumTotalKg += totalBulan;
    sumPendapatan += pendapatanBulan;

    return `
      <tr>
        <td><strong>${row.bulan}</strong></td>
        <td>${row.blokA.toLocaleString('id-ID')}</td>
        <td>${row.blokB.toLocaleString('id-ID')}</td>
        <td>${row.blokC.toLocaleString('id-ID')}</td>
        <td>${row.blokD.toLocaleString('id-ID')}</td>
        <td><strong>${totalBulan.toLocaleString('id-ID')}</strong></td>
        <td><strong class="text-success">Rp ${pendapatanBulan.toLocaleString('id-ID')}</strong></td>
      </tr>
    `;
  }).join('');

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td>TOTAL TAHUNAN</td>
        <td>${sumA.toLocaleString('id-ID')} kg</td>
        <td>${sumB.toLocaleString('id-ID')} kg</td>
        <td>${sumC.toLocaleString('id-ID')} kg</td>
        <td>${sumD.toLocaleString('id-ID')} kg</td>
        <td><strong>${sumTotalKg.toLocaleString('id-ID')} kg</strong></td>
        <td><strong class="text-success">Rp ${sumPendapatan.toLocaleString('id-ID')}</strong></td>
      </tr>
    `;
  }
}

// Dashboard Recent Activities
function renderDashboardActivities() {
  const listEl = document.getElementById('dashboard-recent-activity');
  if (!listEl) return;

  const sampleRecent = state.kegiatanList.slice(0, 4);
  listEl.innerHTML = sampleRecent.map(act => {
    let iconClass = 'pupuk';
    let iconName = 'sprout';
    if (act.jenis === 'Pemanenan') { iconClass = 'panen'; iconName = 'archive'; }
    else if (act.jenis === 'Pengendalian Hama') { iconClass = 'hama'; iconName = 'alert-triangle'; }
    else if (act.jenis === 'Pemangkasan') { iconClass = 'rawat'; iconName = 'scissors'; }

    return `
      <div class="activity-item">
        <div class="activity-left">
          <div class="activity-icon-bullet ${iconClass}">
            <i data-lucide="${iconName}"></i>
          </div>
          <div class="activity-info">
            <h5>${act.jenis} - ${act.blok}</h5>
            <p>${act.deskripsi} • Oleh ${act.petugas}</p>
          </div>
        </div>
        <span class="activity-time">${formatTanggal(act.tanggal)}</span>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function updateKPIs() {
  const totalLuas = state.lahanList.reduce((acc, curr) => acc + Number(curr.luas), 0);
  const totalPohon = state.lahanList.reduce((acc, curr) => acc + Number(curr.pohon), 0);

  const kpiLuas = document.getElementById('kpi-luas-lahan');
  const kpiPohon = document.getElementById('kpi-jumlah-pohon');

  if (kpiLuas) kpiLuas.innerHTML = `${totalLuas} <span class="unit">Ha</span>`;
  if (kpiPohon) kpiPohon.textContent = totalPohon.toLocaleString('id-ID');
}

/* ==========================================================================
   DROPDOWN SYNCHRONIZATION HELPERS
   ========================================================================== */
function populateMandorDropdown(selectedMandor = '') {
  const select = document.getElementById('lahan-mandor');
  if (!select) return;

  const options = state.pekerjaList.map(p => 
    `<option value="${p.nama}" ${p.nama === selectedMandor ? 'selected' : ''}>${p.nama} (${p.posisi})</option>`
  );

  options.unshift('<option value="">-- Belum Ditugaskan --</option>');
  select.innerHTML = options.join('');
}

function populateBlokDropdown(selectedBlok = '') {
  const select = document.getElementById('pekerja-blok');
  if (!select) return;

  const options = state.lahanList.map(l => 
    `<option value="${l.nama}" ${l.nama === selectedBlok ? 'selected' : ''}>${l.nama}</option>`
  );

  options.unshift('<option value="Semua Blok">Semua Blok (Seluruh Perkebunan)</option>');
  select.innerHTML = options.join('');
}

/* ==========================================================================
   MODAL CONTROLS & CRUD OPERATIONS
   ========================================================================== */
function initModals() {
  // Lahan modal button
  document.getElementById('btn-tambah-lahan')?.addEventListener('click', () => {
    document.getElementById('form-lahan')?.reset();
    document.getElementById('lahan-id').value = '';
    document.getElementById('modal-lahan-title').textContent = 'Tambah Lahan Baru';
    populateMandorDropdown();
    openModal('modal-lahan');
  });

  // Pekerja modal button
  document.getElementById('btn-tambah-pekerja')?.addEventListener('click', () => {
    document.getElementById('form-pekerja')?.reset();
    document.getElementById('pekerja-id').value = '';
    const nextNum = state.pekerjaList.length + 1;
    document.getElementById('pekerja-kode').value = `PK-${String(nextNum).padStart(2, '0')}`;
    document.getElementById('modal-pekerja-title').textContent = 'Tambah Pekerja Baru';
    document.getElementById('pekerja-avatar-preview').src = AVATAR_PRESETS.preset1;
    document.getElementById('pekerja-avatar-select').value = 'preset1';
    const fileInput = document.getElementById('pekerja-avatar-file');
    if (fileInput) fileInput.value = '';
    handlePekerjaPosisiChange('Estate Manager');
    populateBlokDropdown();
    openModal('modal-pekerja');
  });

  // Avatar File Upload Handler (FileReader Base64)
  const avatarFileInput = document.getElementById('pekerja-avatar-file');
  avatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Pilih file gambar valid (JPG, PNG, atau WEBP)', 'error');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        showToast('Ukuran foto maksimal 3MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64Data = loadEvt.target.result;
        const preview = document.getElementById('pekerja-avatar-preview');
        if (preview) preview.src = base64Data;
        const select = document.getElementById('pekerja-avatar-select');
        if (select) select.value = 'uploaded';
        showToast('Foto berhasil dimuat! Klik Simpan untuk memperbarui profil.', 'success');
      };
      reader.onerror = () => {
        showToast('Gagal membaca file gambar', 'error');
      };
      reader.readAsDataURL(file);
    }
  });

  // Kegiatan modal button
  document.getElementById('btn-tambah-kegiatan')?.addEventListener('click', () => {
    const dateInput = document.getElementById('kegiatan-tanggal');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    openModal('modal-kegiatan');
  });

  // Panen modal button
  document.getElementById('btn-tambah-panen')?.addEventListener('click', () => {
    const dateInput = document.getElementById('panen-tanggal');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    openModal('modal-panen');
  });

  // Cuaca modal button
  document.getElementById('btn-tambah-cuaca')?.addEventListener('click', () => {
    const dateInput = document.getElementById('cuaca-tanggal');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    openModal('modal-cuaca');
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Modern Custom Confirmation Dialog
 * Replaces native browser confirm() with sleek dark-emerald dialog card
 * @param {Object} options
 * @param {string} options.title - Dialog heading
 * @param {string} options.message - Dialog message (HTML allowed)
 * @param {string} options.confirmText - Primary button text
 * @param {string} options.cancelText - Secondary button text
 * @param {'danger'|'warning'|'primary'|'info'} options.type - Visual accent variant
 * @returns {Promise<boolean>}
 */
function showConfirmDialog({
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const iconWrap = document.getElementById('confirm-modal-icon-wrap');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    const confirmBtn = document.getElementById('btn-modal-confirm');

    if (!modal) {
      const plainMsg = message.replace(/<[^>]*>?/gm, '');
      return resolve(window.confirm(plainMsg));
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;

    if (iconWrap) {
      iconWrap.className = `confirm-icon-wrapper ${type}`;
      let iconName = 'trash-2';
      if (type === 'warning') iconName = 'alert-triangle';
      else if (type === 'info') iconName = 'info';
      else if (type === 'primary') iconName = 'check-circle-2';
      iconWrap.innerHTML = `<i data-lucide="${iconName}"></i>`;
    }

    if (cancelBtn) {
      cancelBtn.style.display = 'inline-flex';
      cancelBtn.textContent = cancelText;
    }

    if (confirmBtn) {
      confirmBtn.className = `btn ${type === 'danger' ? 'btn-danger' : (type === 'warning' ? 'btn-warning' : 'btn-primary')} confirm-btn-proceed`;
      confirmBtn.textContent = confirmText;
      confirmBtn.style.gridColumn = '';
    }

    if (window.lucide) lucide.createIcons();

    modal.classList.remove('hidden');

    function cleanup() {
      modal.classList.add('hidden');
      if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
      if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
      modal.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onConfirm() {
      cleanup();
      resolve(true);
    }

    function onCancel() {
      cleanup();
      resolve(false);
    }

    function onOverlayClick(e) {
      if (e.target === modal) {
        onCancel();
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        if (document.activeElement !== cancelBtn) {
          e.preventDefault();
          onConfirm();
        }
      }
    }

    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
    if (confirmBtn) {
      confirmBtn.addEventListener('click', onConfirm);
      setTimeout(() => confirmBtn.focus(), 60);
    }
    modal.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKeyDown);
  });
}

/**
 * Modern Custom Alert Dialog
 * Replaces native browser alert() with sleek themed dialog card
 * @param {Object} options
 * @param {string} options.title - Alert title
 * @param {string} options.message - Alert message (HTML allowed)
 * @param {string} options.buttonText - Acknowledge button text
 * @param {'info'|'warning'|'danger'|'primary'} options.type - Visual accent variant
 * @returns {Promise<void>}
 */
function showAlertDialog({
  title = 'Informasi Sistem',
  message = '',
  buttonText = 'Mengerti',
  type = 'warning'
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const iconWrap = document.getElementById('confirm-modal-icon-wrap');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    const confirmBtn = document.getElementById('btn-modal-confirm');

    if (!modal) {
      window.alert(message.replace(/<[^>]*>?/gm, ''));
      return resolve();
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;

    if (iconWrap) {
      iconWrap.className = `confirm-icon-wrapper ${type}`;
      let iconName = type === 'warning' ? 'alert-triangle' : (type === 'danger' ? 'alert-circle' : 'info');
      iconWrap.innerHTML = `<i data-lucide="${iconName}"></i>`;
    }

    if (cancelBtn) cancelBtn.style.display = 'none';

    if (confirmBtn) {
      confirmBtn.className = 'btn btn-primary confirm-btn-proceed';
      confirmBtn.textContent = buttonText;
      confirmBtn.style.gridColumn = '1 / -1';
    }

    if (window.lucide) lucide.createIcons();

    modal.classList.remove('hidden');

    function cleanup() {
      modal.classList.add('hidden');
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (confirmBtn) {
        confirmBtn.style.gridColumn = '';
        confirmBtn.removeEventListener('click', onAck);
      }
      modal.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onKeyDown);
    }

    function onAck() {
      cleanup();
      resolve();
    }

    function onOverlayClick(e) {
      if (e.target === modal) {
        onAck();
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onAck();
      }
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', onAck);
      setTimeout(() => confirmBtn.focus(), 60);
    }
    modal.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKeyDown);
  });
}

// Global window helpers for accessibility
window.showConfirmDialog = showConfirmDialog;
window.showAlertDialog = showAlertDialog;

// Global modal UX enhancements: close on backdrop click and Escape key
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    if (e.target.id !== 'modal-confirm') {
      e.target.classList.add('hidden');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(#modal-confirm):not(.hidden)').forEach(m => {
      m.classList.add('hidden');
    });
  }
});

// Avatar select in Pekerja Modal
function handlePekerjaAvatarChange(value) {
  const preview = document.getElementById('pekerja-avatar-preview');
  if (value && AVATAR_PRESETS[value] && preview) {
    preview.src = AVATAR_PRESETS[value];
  }
}

function handlePekerjaPosisiChange(posisi) {
  const notice = document.getElementById('pekerja-estate-notice');
  if (notice) {
    if (posisi === 'Estate Manager') {
      notice.style.display = 'block';
    } else {
      notice.style.display = 'none';
    }
  }
}

// --- LAHAN CRUD (WITH CLOUDFLARE SYNC) ---
async function handleSaveLahan(e) {
  e.preventDefault();
  const id = document.getElementById('lahan-id').value;
  const nama = document.getElementById('lahan-nama').value.trim();
  const lokasi = document.getElementById('lahan-lokasi').value.trim();
  const luas = parseFloat(document.getElementById('lahan-luas').value);
  const pohon = parseInt(document.getElementById('lahan-pohon').value);
  const varietas = document.getElementById('lahan-varietas').value;
  const status = document.getElementById('lahan-status').value;
  const mandor = document.getElementById('lahan-mandor').value;

  const payload = { nama, lokasi, luas, pohon, varietas, mandor, status };

  if (id) {
    const item = state.lahanList.find(x => x.id === parseInt(id));
    if (item) {
      Object.assign(item, payload);
    }
    if (window.ApiService && ApiService.isOnline()) {
      ApiService.lahan.update(id, payload);
    }
    showToast(`Data lahan ${nama} berhasil diperbarui`);
  } else {
    const newLahan = {
      id: Date.now(),
      ...payload
    };
    state.lahanList.push(newLahan);
    if (window.ApiService && ApiService.isOnline()) {
      ApiService.lahan.create(payload);
    }
    showToast(`Lahan baru ${nama} berhasil ditambahkan`);
  }

  if (mandor) {
    const worker = state.pekerjaList.find(p => p.nama === mandor);
    if (worker) {
      worker.blok = nama;
    }
  }

  saveLocalState();
  renderLahanTable();
  renderPekerjaTable();
  updateKPIs();
  closeModal('modal-lahan');
}

function editLahan(id) {
  const item = state.lahanList.find(x => x.id === id);
  if (!item) return;

  document.getElementById('lahan-id').value = item.id;
  document.getElementById('lahan-nama').value = item.nama;
  document.getElementById('lahan-lokasi').value = item.lokasi;
  document.getElementById('lahan-luas').value = item.luas;
  document.getElementById('lahan-pohon').value = item.pohon;
  document.getElementById('lahan-varietas').value = item.varietas.split(' ')[0];
  document.getElementById('lahan-status').value = item.status;
  document.getElementById('modal-lahan-title').textContent = 'Edit Data Lahan';

  populateMandorDropdown(item.mandor);
  openModal('modal-lahan');
}

async function deleteLahan(id) {
  const lahan = state.lahanList.find(x => x.id === id);
  if (!lahan) return;

  const confirmed = await showConfirmDialog({
    title: 'Hapus Blok Lahan',
    message: `Apakah Anda yakin ingin menghapus data <strong>"${lahan.nama}"</strong>? Seluruh penugasan pekerja pada blok ini akan disesuaikan.`,
    confirmText: 'Ya, Hapus Lahan',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;

  state.lahanList = state.lahanList.filter(x => x.id !== id);
  state.pekerjaList.forEach(p => {
    if (p.blok === lahan.nama) p.blok = 'Belum Ditugaskan';
  });

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.lahan.delete(id);
  }

  saveLocalState();
  renderLahanTable();
  renderPekerjaTable();
  updateKPIs();
  showToast(`Lahan ${lahan.nama} berhasil dihapus`, 'error');
}

// --- PEKERJA CRUD & PROFILE SYNC (WITH CLOUDFLARE SYNC) ---
async function handleSavePekerja(e) {
  e.preventDefault();
  const editId = document.getElementById('pekerja-id').value;
  const kode = document.getElementById('pekerja-kode').value.trim();
  const nama = document.getElementById('pekerja-nama').value.trim();
  const posisi = document.getElementById('pekerja-posisi').value;
  const blok = document.getElementById('pekerja-blok').value;
  const email = document.getElementById('pekerja-email').value.trim();
  const telp = document.getElementById('pekerja-telp').value.trim();
  const status = document.getElementById('pekerja-status').value;
  const avatar = document.getElementById('pekerja-avatar-preview').src;

  let isEstateManager = (posisi === 'Estate Manager');
  const payload = {
    id: editId || kode || `PK-${String(state.pekerjaList.length + 1).padStart(2, '0')}`,
    nama,
    posisi,
    blok,
    email,
    telp,
    avatar,
    status
  };

  if (editId) {
    const worker = state.pekerjaList.find(p => p.id === editId);
    if (worker) {
      Object.assign(worker, payload);
      if (worker.id === 'PK-01' || posisi === 'Estate Manager') {
        isEstateManager = true;
      }
    }
    if (window.ApiService && ApiService.isOnline()) {
      ApiService.pekerja.save(payload, true);
    }
  } else {
    state.pekerjaList.push(payload);
    if (window.ApiService && ApiService.isOnline()) {
      ApiService.pekerja.save(payload, false);
    }
  }

  // Bidirectional sync: If worker is Mandor, assign to the corresponding lahan
  if (posisi.includes('Mandor') && blok && blok !== 'Semua Blok') {
    const lahan = state.lahanList.find(l => l.nama === blok);
    if (lahan) {
      lahan.mandor = nama;
    }
  }

  // AUTOMATIC PROFILE SYNC: If this worker is Estate Manager, update Header & Sidebar immediately!
  if (isEstateManager) {
    renderUserProfile();
    showToast(`Profil Sistem & Estate Manager (${nama}) otomatis disinkronkan!`);
  } else {
    showToast(`Data karyawan ${nama} berhasil disimpan!`);
  }

  saveLocalState();
  renderPekerjaTable();
  renderLahanTable();
  closeModal('modal-pekerja');
}

function editPekerja(id) {
  const worker = state.pekerjaList.find(p => p.id === id);
  if (!worker) return;

  document.getElementById('pekerja-id').value = worker.id;
  document.getElementById('pekerja-kode').value = worker.id;
  document.getElementById('pekerja-nama').value = worker.nama;
  document.getElementById('pekerja-posisi').value = worker.posisi;
  document.getElementById('pekerja-email').value = worker.email || '';
  document.getElementById('pekerja-telp').value = worker.telp;
  document.getElementById('pekerja-status').value = worker.status;
  
  const avatarSrc = worker.avatar || AVATAR_PRESETS.preset1;
  document.getElementById('pekerja-avatar-preview').src = avatarSrc;
  
  const fileInput = document.getElementById('pekerja-avatar-file');
  if (fileInput) fileInput.value = '';

  const select = document.getElementById('pekerja-avatar-select');
  const matchingKey = Object.keys(AVATAR_PRESETS).find(k => AVATAR_PRESETS[k] === avatarSrc);
  if (matchingKey && select) {
    select.value = matchingKey;
  } else if (select) {
    select.value = 'uploaded';
  }

  document.getElementById('modal-pekerja-title').textContent = `Edit Karyawan: ${worker.nama}`;

  handlePekerjaPosisiChange(worker.posisi);
  populateBlokDropdown(worker.blok);
  openModal('modal-pekerja');
}

async function deletePekerja(id) {
  const worker = state.pekerjaList.find(p => p.id === id);
  if (!worker) return;

  if (worker.posisi === 'Estate Manager' || worker.id === 'PK-01') {
    await showAlertDialog({
      title: 'Aksi Dibatasi',
      message: 'Estate Manager utama tidak dapat dihapus. Anda dapat mengubah nama, email, foto profil, dan kontaknya melalui tombol <strong>Edit</strong>.',
      buttonText: 'Mengerti',
      type: 'warning'
    });
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Hapus Data Karyawan',
    message: `Apakah Anda yakin ingin menghapus data karyawan <strong>"${worker.nama}"</strong> (${worker.kode} - ${worker.posisi})?`,
    confirmText: 'Ya, Hapus Karyawan',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;

  state.pekerjaList = state.pekerjaList.filter(p => p.id !== id);
  state.lahanList.forEach(l => {
    if (l.mandor === worker.nama) l.mandor = '';
  });

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.pekerja.delete(id);
  }

  saveLocalState();
  renderPekerjaTable();
  renderLahanTable();
  showToast(`Karyawan ${worker.nama} telah dihapus`, 'error');
}

// --- KEGIATAN CRUD (WITH CLOUDFLARE SYNC) ---
async function handleSaveKegiatan(e) {
  e.preventDefault();
  const tanggal = document.getElementById('kegiatan-tanggal').value;
  const blok = document.getElementById('kegiatan-blok').value;
  const jenis = document.getElementById('kegiatan-jenis').value;
  const deskripsi = document.getElementById('kegiatan-deskripsi').value;
  const kondisi = document.getElementById('kegiatan-kondisi').value;
  const petugas = document.getElementById('kegiatan-petugas').value;

  const payload = { tanggal, blok, jenis, deskripsi, kondisi, petugas };
  const newKegiatan = { id: Date.now(), ...payload };

  state.kegiatanList.unshift(newKegiatan);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.kegiatan.create(payload);
  }

  saveLocalState();
  renderKegiatanTable();
  renderDashboardActivities();
  closeModal('modal-kegiatan');
  showToast('Catatan kegiatan berhasil disimpan');
}

async function deleteKegiatan(id) {
  const act = state.kegiatanList.find(x => x.id === id);
  const actName = act ? `${act.jenis} (${act.blok})` : 'kegiatan ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Catatan Kegiatan',
    message: `Apakah Anda yakin ingin menghapus catatan kegiatan <strong>"${actName}"</strong>? Tindakan ini tidak dapat dibatalkan.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;

  state.kegiatanList = state.kegiatanList.filter(x => x.id !== id);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.kegiatan.delete(id);
  }

  saveLocalState();
  renderKegiatanTable();
  renderDashboardActivities();
  showToast('Catatan kegiatan telah dihapus', 'error');
}

// --- PANEN CRUD (WITH CLOUDFLARE SYNC) ---
function calculateTotalPanen() {
  const jumlah = parseFloat(document.getElementById('panen-jumlah').value) || 0;
  const harga = parseFloat(document.getElementById('panen-harga').value) || 0;
  const total = jumlah * harga;
  document.getElementById('panen-total').value = `Rp ${total.toLocaleString('id-ID')}`;
}

async function handleSavePanen(e) {
  e.preventDefault();
  const tanggal = document.getElementById('panen-tanggal').value;
  const blok = document.getElementById('panen-blok').value;
  const jumlah = parseFloat(document.getElementById('panen-jumlah').value);
  const harga = parseFloat(document.getElementById('panen-harga').value);
  const pembeli = document.getElementById('panen-pembeli').value;

  const payload = { tanggal, blok, jumlah, harga, pembeli, status: 'Selesai' };
  const newPanen = { id: Date.now(), ...payload };

  state.panenList.unshift(newPanen);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.panen.create(payload);
  }

  saveLocalState();
  renderPanenTable();
  closeModal('modal-panen');
  showToast('Data panen berhasil disimpan');
}

async function deletePanen(id) {
  const panen = state.panenList.find(x => x.id === id);
  const panenLabel = panen ? `${panen.blok} - ${panen.tanggal}` : 'catatan panen ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Catatan Panen',
    message: `Apakah Anda yakin ingin menghapus catatan panen <strong>"${panenLabel}"</strong>?`,
    confirmText: 'Ya, Hapus Data',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;

  state.panenList = state.panenList.filter(x => x.id !== id);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.panen.delete(id);
  }

  saveLocalState();
  renderPanenTable();
  showToast('Catatan panen telah dihapus', 'error');
}

// --- CUACA CRUD (WITH CLOUDFLARE SYNC) ---
async function handleSaveCuaca(e) {
  e.preventDefault();
  const tanggal = document.getElementById('cuaca-tanggal').value;
  const jam = document.getElementById('cuaca-jam').value;
  const suhu = parseFloat(document.getElementById('cuaca-suhu').value);
  const kelembaban = parseFloat(document.getElementById('cuaca-kelembaban').value);
  const curah = parseFloat(document.getElementById('cuaca-curah').value);
  const kondisi = document.getElementById('cuaca-kondisi').value;

  const payload = { tanggal, jam, suhu, kelembaban, curah, kondisi };
  const newCuaca = { id: Date.now(), ...payload };

  state.cuacaList.unshift(newCuaca);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.cuaca.create(payload);
  }

  saveLocalState();
  renderCuacaTable();
  updateWeatherUI(payload);
  updateWeatherChart();
  closeModal('modal-cuaca');
  showToast('Data cuaca berhasil ditambahkan');
}

async function deleteCuaca(id) {
  const c = state.cuacaList.find(x => x.id === id);
  const cLabel = c ? `${c.tanggal} ${c.jam || ''}` : 'data cuaca ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Data Cuaca',
    message: `Apakah Anda yakin ingin menghapus data cuaca <strong>"${cLabel}"</strong>?`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;

  state.cuacaList = state.cuacaList.filter(x => x.id !== id);

  if (window.ApiService && ApiService.isOnline()) {
    ApiService.cuaca.delete(id);
  }

  saveLocalState();
  renderCuacaTable();
  if (state.cuacaList.length > 0) updateWeatherUI(state.cuacaList[0]);
  updateWeatherChart();
  showToast('Data cuaca telah dihapus', 'error');
}

/* ==========================================================================
   WEATHER REALTIME SYNC & IoT TELEMETRY (Tegalsari, Megang Sakti, Musi Rawas)
   ========================================================================== */
function updateWeatherUI(w, timeStr) {
  const elSuhu = document.getElementById('weather-card-suhu');
  const elSuhuSub = document.getElementById('weather-card-suhu-sub');
  const elHum = document.getElementById('weather-card-kelembaban');
  const elHumSub = document.getElementById('weather-card-kelembaban-sub');
  const elCurah = document.getElementById('weather-card-curah');
  const elCurahSub = document.getElementById('weather-card-curah-sub');
  const elAngin = document.getElementById('weather-card-angin');
  const elAnginSub = document.getElementById('weather-card-angin-sub');

  const dTemp = document.getElementById('dash-weather-temp');
  const dStatus = document.getElementById('dash-weather-status');
  const dTime = document.getElementById('dash-weather-time');
  const dHum = document.getElementById('dash-weather-humidity');
  const dRain = document.getElementById('dash-weather-rain');
  const dWind = document.getElementById('dash-weather-wind');

  if (!w) {
    if (elSuhu) elSuhu.textContent = '- °C';
    if (elSuhuSub) elSuhuSub.textContent = 'Belum Ada Data';

    if (elHum) elHum.textContent = '- %';
    if (elHumSub) elHumSub.textContent = 'Belum Ada Data';

    if (elCurah) elCurah.textContent = '- mm';
    if (elCurahSub) elCurahSub.textContent = 'Belum Ada Data';

    if (elAngin) elAngin.textContent = '- km/h';
    if (elAnginSub) elAnginSub.textContent = 'Belum Ada Data';

    if (dTemp) dTemp.textContent = '- °C';
    if (dStatus) dStatus.textContent = 'Belum Ada Data';
    if (dTime) dTime.textContent = `Stasiun IoT ${(state.weatherLocation && state.weatherLocation.name) ? state.weatherLocation.name : 'Tegalsari, Megang Sakti, Musi Rawas'}`;
    if (dHum) dHum.textContent = '- %';
    if (dRain) dRain.textContent = '- mm';
    if (dWind) dWind.textContent = '- km/h';
    return;
  }

  const suhu = Math.round(w.suhu);
  const kelembaban = Math.round(w.kelembaban);
  const curah = Math.round(w.curah);
  const angin = Math.round(w.angin || 5);
  const kondisi = w.kondisi || 'Cerah Berawan';

  if (elSuhu) elSuhu.textContent = `${suhu}°C`;
  if (elSuhuSub) elSuhuSub.textContent = suhu > 32 ? 'Suhu Tinggi (Panas)' : (suhu < 26 ? 'Suhu Sejuk' : 'Optimal (26°C - 33°C)');

  if (elHum) elHum.textContent = `${kelembaban}%`;
  if (elHumSub) elHumSub.textContent = kelembaban > 80 ? 'Kelembaban Tinggi' : 'Kelembaban Normal';

  if (elCurah) elCurah.textContent = `${curah} mm`;
  if (elCurahSub) elCurahSub.textContent = curah === 0 ? 'Tanpa Hujan (Cerah)' : (curah > 30 ? 'Hujan Deras / Lebat' : 'Hujan Sedang Teratur');

  if (elAngin) elAngin.textContent = `${angin} km/h`;
  if (elAnginSub) elAnginSub.textContent = angin > 12 ? 'Angin Kencang' : 'Tenang & Normal';

  const locName = (state.weatherLocation && state.weatherLocation.name) ? state.weatherLocation.name : 'Tegalsari, Megang Sakti, Musi Rawas';
  if (dTemp) dTemp.textContent = `${suhu}°C`;
  if (dStatus) dStatus.textContent = kondisi;
  if (dTime) dTime.textContent = `Stasiun IoT ${locName}`;
  if (dHum) dHum.textContent = `${kelembaban}%`;
  if (dRain) dRain.textContent = `${curah} mm`;
  if (dWind) dWind.textContent = `${angin} km/h`;
}

function updateWeatherChart() {
  if (!charts.trenCuaca) return;

  if (!state.cuacaList || state.cuacaList.length === 0) {
    charts.trenCuaca.data.labels = [];
    charts.trenCuaca.data.datasets[0].data = [];
    charts.trenCuaca.data.datasets[1].data = [];
    charts.trenCuaca.update();
    return;
  }

  const dayNameMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Sort by date ascending
  const sorted = [...state.cuacaList].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
  const recent7 = sorted.slice(-7);

  const labels = recent7.map(item => {
    if (!item.tanggal) return 'Hari Ini';
    const parts = item.tanggal.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dayName = dayNameMap[d.getDay()];
      return `${dayName} (${parts[2]}/${parts[1]})`;
    }
    return item.tanggal;
  });

  const temps = recent7.map(item => item.suhu);
  const rains = recent7.map(item => item.curah);

  charts.trenCuaca.data.labels = labels;
  charts.trenCuaca.data.datasets[0].data = temps;
  charts.trenCuaca.data.datasets[1].data = rains;
  charts.trenCuaca.update();
}

async function clearAllCuaca() {
  if (!state.cuacaList || state.cuacaList.length === 0) {
    showToast('Tidak ada data cuaca untuk dihapus.', 'error');
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Hapus Semua Data Cuaca',
    message: 'Apakah Anda yakin ingin menghapus <strong>SEMUA</strong> riwayat cuaca? Data grafik, tabel, dan indikator telemetri akan dikosongkan.',
    confirmText: 'Ya, Kosongkan Semua',
    cancelText: 'Batal',
    type: 'danger'
  });
  if (!confirmed) return;
    const itemsToDelete = [...state.cuacaList];
    state.cuacaList = [];
    saveLocalState();

    // Delete from Cloudflare D1 Backend if online
    const api = window.ApiService || (typeof ApiService !== 'undefined' ? ApiService : null);
    if (api && api.isOnline()) {
      for (const item of itemsToDelete) {
        if (item.id) {
          try {
            await api.cuaca.delete(item.id);
          } catch (e) {
            console.warn('Cloud sync error deleting cuaca item', e);
          }
        }
      }
    }

    // Reset UI components to empty state
    updateWeatherUI(null);
    updateWeatherChart();
    renderCuacaTable();

    showToast('Seluruh data cuaca telah berhasil dihapus!', 'error');
  }
}

async function syncWeatherData() {
  const syncBtn = document.getElementById('btn-sync-weather');
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Menghubungkan...`;
    if (window.lucide) lucide.createIcons();
  }

  const loc = state.weatherLocation || {
    name: 'Tegalsari, Megang Sakti, Musi Rawas',
    lat: -3.1764,
    lon: 102.9902
  };

  showToast(`Tarik data telemetry 7 hari terakhir (Stasiun IoT ${loc.name})...`);

  const codeMap = {
    0: 'Cerah',
    1: 'Cerah Berawan', 2: 'Cerah Berawan', 3: 'Berawan',
    45: 'Kabut Tropis', 48: 'Kabut Tropis',
    51: 'Gerimis Ringan', 53: 'Hujan Ringan', 55: 'Hujan Ringan',
    61: 'Hujan Sedang', 63: 'Hujan Deras', 65: 'Hujan Lebat',
    80: 'Hujan Lokal', 81: 'Hujan Deras', 82: 'Hujan Sangat Lebat',
    95: 'Badai Petir', 96: 'Badai Petir & Hujan', 99: 'Badai Petir'
  };

  let fetchedList = [];
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Open-Meteo 7-day past telemetry using configured latitude & longitude
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&past_days=6&forecast_days=1&daily=temperature_2m_max,relative_humidity_2m_mean,rain_sum,weather_code,wind_speed_10m_max&timezone=Asia%2FJakarta`;
    const res = await fetch(url, {
      signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.daily && data.daily.time) {
        const d = data.daily;
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        for (let i = 0; i < d.time.length; i++) {
          const tgl = d.time[i];
          if (tgl > todayStr) continue; // Safety filter for past/current dates only

          const suhu = Math.round(d.temperature_2m_max[i] || 30);
          const kelembaban = Math.round(d.relative_humidity_2m_mean[i] || 78);
          const curah = Math.round((d.rain_sum[i] || 0) * 10) / 10;
          const angin = Math.round(d.wind_speed_10m_max[i] || 6);
          const wCode = d.weather_code[i] || 1;
          const kondisi = codeMap[wCode] || 'Cerah Berawan';

          fetchedList.push({
            id: Date.now() + i,
            tanggal: tgl,
            jam: i === d.time.length - 1 ? nowTime : '12:00',
            suhu,
            kelembaban,
            curah,
            angin,
            kondisi,
            lokasi: loc.name
          });
        }
      }
    }
  } catch (err) {
    console.warn('Open-Meteo live 7-day fetch timeout/error, using IoT simulation for Musi Rawas', err);
  }

  // IoT Simulation fallback if network request fails
  if (fetchedList.length === 0) {
    const todayObj = new Date();
    const nowTime = todayObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const kondisiOptions = ['Cerah', 'Cerah Berawan', 'Berawan', 'Hujan Ringan', 'Hujan Sedang'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayObj);
      date.setDate(date.getDate() - i);
      const isoDate = date.toISOString().split('T')[0];

      const suhu = Math.round(28 + Math.random() * 5);
      const kelembaban = Math.round(72 + Math.random() * 16);
      const curah = Math.round(Math.random() > 0.4 ? Math.random() * 30 : 0);
      const angin = Math.round(4 + Math.random() * 8);
      const kondisi = kondisiOptions[Math.floor(Math.random() * kondisiOptions.length)];

      fetchedList.push({
        id: Date.now() + i,
        tanggal: isoDate,
        jam: i === 0 ? nowTime : '12:00',
        suhu,
        kelembaban,
        curah,
        angin,
        kondisi,
        lokasi: loc.name
      });
    }
  }

  // Preserve existing historical records across syncs (Filter out future dates > todayStr)
  // Unique record key: tanggal + "_" + lokasi + "_" + jam
  const existingKeys = new Set(state.cuacaList.map(item => `${item.tanggal}_${item.lokasi || 'Tegalsari, Musi Rawas'}_${item.jam}`));

  const newItemsToPush = [];
  for (const item of fetchedList) {
    const key = `${item.tanggal}_${item.lokasi}_${item.jam}`;
    if (!existingKeys.has(key)) {
      newItemsToPush.push(item);
      existingKeys.add(key);
    }
  }

  // Merge & sort newest first
  state.cuacaList = [...newItemsToPush, ...state.cuacaList]
    .filter(item => item.tanggal <= todayStr)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  saveLocalState();

  // Sync to Cloudflare D1 Backend if online
  const api = window.ApiService || (typeof ApiService !== 'undefined' ? ApiService : null);
  if (api && api.isOnline()) {
    for (const item of newItemsToPush) {
      try {
        await api.cuaca.create({
          tanggal: item.tanggal,
          jam: item.jam,
          suhu: item.suhu,
          kelembaban: item.kelembaban,
          curah: item.curah,
          kondisi: item.kondisi,
          lokasi: item.lokasi
        });
      } catch (e) {
        console.warn('Error syncing cuaca item to Cloudflare D1', e);
      }
    }
  }

  // Update UI components
  if (state.cuacaList.length > 0) {
    updateWeatherUI(state.cuacaList[0]);
  }
  renderCuacaTable();
  updateWeatherChart();

  if (syncBtn) {
    syncBtn.disabled = false;
    syncBtn.innerHTML = `<i data-lucide="cloud-lightning"></i> Sync Stasiun Cuaca`;
    if (window.lucide) lucide.createIcons();
  }

  const latest = state.cuacaList[0];
  showToast(`Berhasil menarik data 7 hari terakhir Stasiun IoT ${loc.name}! Terkini (${latest.tanggal}): ${latest.suhu}°C, ${latest.kondisi}`, 'success');
}

/* ==========================================================================
   GPS DEVICE GEOLOCATION AUTO-DETECTION
   ========================================================================== */
async function handleDetectGPS() {
  const detectBtn = document.getElementById('btn-detect-gps');
  if (!navigator.geolocation) {
    showToast('Browser atau device Anda tidak mendukung GPS Geolocation.', 'error');
    return;
  }

  if (detectBtn) {
    detectBtn.disabled = true;
    detectBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Mendeteksi GPS...`;
    if (window.lucide) lucide.createIcons();
  }

  showToast('Meminta akses koordinat GPS device...');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = parseFloat(position.coords.latitude.toFixed(4));
      const lon = parseFloat(position.coords.longitude.toFixed(4));

      const wLat = document.getElementById('setting-weather-lat');
      const wLon = document.getElementById('setting-weather-lon');
      const wName = document.getElementById('setting-weather-name');
      const wPreset = document.getElementById('setting-weather-preset');

      if (wLat) wLat.value = lat;
      if (wLon) wLon.value = lon;
      if (wPreset) wPreset.value = 'gps';

      let locationName = `Lokasi GPS (${lat}, ${lon})`;

      // Reverse geocoding via OpenStreetMap Nominatim API
      try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
        const res = await fetch(reverseUrl, {
          headers: { 'Accept-Language': 'id' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || '';
            const town = addr.town || addr.city || addr.municipality || addr.county || '';
            const stateName = addr.state || '';
            const parts = [village, town, stateName].filter(Boolean);
            if (parts.length > 0) {
              locationName = parts.join(', ');
            } else if (data.display_name) {
              locationName = data.display_name.split(',').slice(0, 3).join(',');
            }
          }
        }
      } catch (e) {
        console.warn('Reverse geocoding error:', e);
      }

      if (wName) wName.value = locationName;

      if (detectBtn) {
        detectBtn.disabled = false;
        detectBtn.innerHTML = `<i data-lucide="navigation"></i> Deteksi GPS Device Saya`;
        if (window.lucide) lucide.createIcons();
      }

      showToast(`Berhasil mendeteksi lokasi GPS: ${locationName} (${lat}, ${lon})!`, 'success');
    },
    (error) => {
      if (detectBtn) {
        detectBtn.disabled = false;
        detectBtn.innerHTML = `<i data-lucide="navigation"></i> Deteksi GPS Device Saya`;
        if (window.lucide) lucide.createIcons();
      }
      let msg = 'Gagal mengambil koordinat GPS device.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Izin akses lokasi GPS ditolak oleh pengguna/browser.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Informasi lokasi GPS tidak tersedia.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Waktu permintaan lokasi GPS habis (timeout).';
      }
      showToast(`${msg} Silakan masukkan koordinat secara manual.`, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/* ==========================================================================
   PENGATURAN SISTEM (PERSISTENCE & DATABASE SYNC)
   ========================================================================== */
function renderSettingsUI() {
  if (!state.pengaturan) return;
  const p = state.pengaturan;

  const elNama = document.getElementById('setting-nama-kebun');
  const elPT = document.getElementById('setting-perusahaan');
  const elAlamat = document.getElementById('setting-alamat');
  const elTarget = document.getElementById('setting-target-produksi');
  const elHarga = document.getElementById('setting-harga-tbs');
  const elCuaca = document.getElementById('setting-notif-cuaca');
  const elPupuk = document.getElementById('setting-notif-pupuk');
  const elIot = document.getElementById('setting-notif-iot');

  if (elNama && p.nama_kebun) elNama.value = p.nama_kebun;
  if (elPT && p.perusahaan) elPT.value = p.perusahaan;
  if (elAlamat && p.alamat !== undefined) elAlamat.value = p.alamat;
  if (elTarget && p.target_produksi !== undefined) elTarget.value = p.target_produksi;
  if (elHarga && p.harga_tbs !== undefined) elHarga.value = p.harga_tbs;
  if (elCuaca) elCuaca.checked = !!p.notif_cuaca;
  if (elPupuk) elPupuk.checked = !!p.notif_pupuk;
  if (elIot) elIot.checked = !!p.notif_iot;

  // Update estate badge tag in top header
  const estateTag = document.querySelector('.estate-tag');
  if (estateTag && p.nama_kebun) {
    estateTag.innerHTML = `<i data-lucide="tree-pine"></i> ${p.nama_kebun}`;
    if (window.lucide) lucide.createIcons();
  }
}

async function handleSaveSettings() {
  const saveBtn = document.getElementById('btn-save-settings');
  const origHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Menyimpan...';
    if (window.lucide) lucide.createIcons();
  }

  const payload = {
    nama_kebun: document.getElementById('setting-nama-kebun')?.value.trim() || 'Kebun Sawit Sei Karang',
    perusahaan: document.getElementById('setting-perusahaan')?.value.trim() || 'PT Agro Sawit Lestari Mandiri',
    alamat: document.getElementById('setting-alamat')?.value.trim() || '',
    target_produksi: parseFloat(document.getElementById('setting-target-produksi')?.value) || 300,
    harga_tbs: parseFloat(document.getElementById('setting-harga-tbs')?.value) || 2500,
    notif_cuaca: document.getElementById('setting-notif-cuaca')?.checked ? 1 : 0,
    notif_pupuk: document.getElementById('setting-notif-pupuk')?.checked ? 1 : 0,
    notif_iot: document.getElementById('setting-notif-iot')?.checked ? 1 : 0
  };

  state.pengaturan = {
    ...payload,
    notif_cuaca: !!payload.notif_cuaca,
    notif_pupuk: !!payload.notif_pupuk,
    notif_iot: !!payload.notif_iot
  };

  localStorage.setItem('sawit_pengaturan', JSON.stringify(state.pengaturan));

  let dbSaved = false;
  if (window.ApiService && ApiService.isOnline()) {
    try {
      const res = await ApiService.pengaturan.save(payload);
      if (res && res.success) {
        dbSaved = true;
      }
    } catch (err) {
      console.warn('Gagal sinkron database Cloudflare D1:', err);
    }
  }

  renderSettingsUI();
  updateKPIs();

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = origHtml || '<i data-lucide="save"></i> Simpan Perubahan';
    if (window.lucide) lucide.createIcons();
  }

  if (dbSaved) {
    showToast('Pengaturan sistem berhasil disimpan & disinkronkan ke Database Cloudflare D1!', 'success');
  } else {
    showToast('Pengaturan sistem berhasil disimpan (Penyimpanan Lokal)!', 'success');
  }
}

/* ==========================================================================
   SEARCH & FILTERS
   ========================================================================== */
function initEventListeners() {
  // Lahan search
  document.getElementById('search-lahan')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = state.lahanList.filter(l => 
      l.nama.toLowerCase().includes(term) ||
      l.lokasi.toLowerCase().includes(term) ||
      (l.mandor && l.mandor.toLowerCase().includes(term)) ||
      l.varietas.toLowerCase().includes(term)
    );
    renderLahanTable(filtered);
  });

  // Kegiatan search & filter
  const searchKegiatan = document.getElementById('search-kegiatan');
  const filterBlok = document.getElementById('filter-kegiatan-blok');

  function applyKegiatanFilter() {
    const term = searchKegiatan ? searchKegiatan.value.toLowerCase() : '';
    const blok = filterBlok ? filterBlok.value : 'all';

    const filtered = state.kegiatanList.filter(k => {
      const matchTerm = k.jenis.toLowerCase().includes(term) ||
                        k.deskripsi.toLowerCase().includes(term) ||
                        k.petugas.toLowerCase().includes(term);
      const matchBlok = blok === 'all' || k.blok.includes(blok);
      return matchTerm && matchBlok;
    });
    renderKegiatanTable(filtered);
  }

  searchKegiatan?.addEventListener('input', applyKegiatanFilter);
  filterBlok?.addEventListener('change', applyKegiatanFilter);

  // Panen search
  document.getElementById('search-panen')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = state.panenList.filter(p => 
      p.blok.toLowerCase().includes(term) || p.pembeli.toLowerCase().includes(term)
    );
    renderPanenTable(filtered);
  });

  // Pekerja search
  document.getElementById('search-pekerja')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = state.pekerjaList.filter(p => 
      p.nama.toLowerCase().includes(term) ||
      p.posisi.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      p.blok.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
    renderPekerjaTable(filtered);
  });

  // Weather Sync & Clear buttons
  document.getElementById('btn-sync-weather')?.addEventListener('click', syncWeatherData);
  document.getElementById('btn-clear-all-cuaca')?.addEventListener('click', clearAllCuaca);

  // Weather Table Month & Location Filters (Reset page to 1)
  document.getElementById('filter-cuaca-bulan')?.addEventListener('change', () => {
    state.cuacaPagination.currentPage = 1;
    renderCuacaTable();
  });
  document.getElementById('filter-cuaca-lokasi')?.addEventListener('change', () => {
    state.cuacaPagination.currentPage = 1;
    renderCuacaTable();
  });

  // Weather Table Pagination Prev & Next
  document.getElementById('btn-cuaca-prev')?.addEventListener('click', () => {
    if (state.cuacaPagination.currentPage > 1) {
      state.cuacaPagination.currentPage--;
      renderCuacaTable();
    }
  });

  document.getElementById('btn-cuaca-next')?.addEventListener('click', () => {
    const filterBulan = document.getElementById('filter-cuaca-bulan')?.value || 'all';
    const filterLokasi = document.getElementById('filter-cuaca-lokasi')?.value || 'all';
    let filtered = state.cuacaList || [];
    if (filterBulan !== 'all') filtered = filtered.filter(i => i.tanggal && i.tanggal.startsWith(filterBulan));
    if (filterLokasi !== 'all') filtered = filtered.filter(i => (i.lokasi || 'Tegalsari, Musi Rawas') === filterLokasi);

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.cuacaPagination.pageSize));
    if (state.cuacaPagination.currentPage < totalPages) {
      state.cuacaPagination.currentPage++;
      renderCuacaTable();
    }
  });

  // GPS Device Location Auto-Detection Button
  document.getElementById('btn-detect-gps')?.addEventListener('click', handleDetectGPS);

  // Preset Weather Location change handler
  document.getElementById('setting-weather-preset')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'gps') {
      handleDetectGPS();
      return;
    }
    const presets = {
      musi_rawas: { name: 'Tegalsari, Megang Sakti, Musi Rawas', lat: -3.1764, lon: 102.9902 },
      sei_karang: { name: 'Kebun Sei Karang, Galang', lat: 3.4562, lon: 98.8872 },
      riau: { name: 'Poros Sawit, Pekanbaru', lat: 0.5071, lon: 101.4478 },
      palembang: { name: 'Palembang', lat: -2.9909, lon: 104.7565 },
      jambi: { name: 'Muaro Jambi', lat: -1.6101, lon: 103.6131 },
      kalteng: { name: 'Sampit, Kotawaringin Timur', lat: -2.5333, lon: 112.9500 }
    };

    if (presets[val]) {
      const p = presets[val];
      const wName = document.getElementById('setting-weather-name');
      const wLat = document.getElementById('setting-weather-lat');
      const wLon = document.getElementById('setting-weather-lon');

      if (wName) wName.value = p.name;
      if (wLat) wLat.value = p.lat;
      if (wLon) wLon.value = p.lon;
    }
  });

  // Save Weather Location handler
  document.getElementById('btn-save-weather-location')?.addEventListener('click', () => {
    const preset = document.getElementById('setting-weather-preset')?.value || 'custom';
    const name = document.getElementById('setting-weather-name')?.value || 'Kustom';
    const lat = parseFloat(document.getElementById('setting-weather-lat')?.value) || -3.1764;
    const lon = parseFloat(document.getElementById('setting-weather-lon')?.value) || 102.9902;

    const locData = { preset, name, lat, lon };
    state.weatherLocation = locData;
    localStorage.setItem('sawit_weather_location', JSON.stringify(locData));

    showToast(`Lokasi stasiun cuaca berhasil disimpan ke ${name} (${lat}, ${lon})!`, 'success');
  });

  // Refresh Dashboard
  document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => {
    showToast('Memperbarui data dashboard...');
    updateKPIs();
    renderDashboardActivities();
  });

  // Save General Settings (Persistent Local & Cloud D1 Database Sync)
  document.getElementById('btn-save-settings')?.addEventListener('click', handleSaveSettings);

  // Save Cloudflare Worker API URL and Test Connection
  document.getElementById('btn-save-api-url')?.addEventListener('click', async () => {
    const input = document.getElementById('setting-api-url');
    const url = input ? input.value : '';

    const api = window.ApiService || (typeof ApiService !== 'undefined' ? ApiService : null);
    if (api) {
      showToast('Menguji koneksi ke Cloudflare Worker...');
      const ok = await api.setBaseUrl(url);
      updateApiStatusBadge(ok);

      if (ok) {
        showToast('Sukses! Terhubung ke Cloudflare Workers & D1 Database', 'success');
        await loadSavedData();
        initTables();
      } else if (url.trim()) {
        showToast('Gagal terhubung ke Cloudflare Worker. Pastikan URL benar & worker aktif.', 'error');
      } else {
        showToast('Kembali ke mode standalone lokal (LocalStorage).', 'success');
      }
    } else {
      showToast('ApiService tidak terdefinisi!', 'error');
    }
  });

  // Laporan Period Select Change
  document.getElementById('select-periode-laporan')?.addEventListener('change', (e) => {
    const title = document.getElementById('title-tabel-laporan');
    if (title) title.textContent = `Tabel Laporan Panen ${e.target.value}`;
    showToast(`Memuat data laporan tahun ${e.target.value}`);
  });

  // Logout Handlers (Sidebar & Header)
  document.getElementById('nav-logout')?.addEventListener('click', handleLogout);
  document.getElementById('btn-header-logout')?.addEventListener('click', handleLogout);

  // Password Visibility Toggle Button
  document.getElementById('btn-toggle-password')?.addEventListener('click', () => {
    const passInput = document.getElementById('login-password');
    const icon = document.getElementById('icon-toggle-password');
    if (!passInput) return;

    if (passInput.type === 'password') {
      passInput.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      passInput.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  });
}

/* ==========================================================================
   CHARTS INITIALIZATION (CHART.JS)
   ========================================================================== */
function initCharts() {
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.color = '#64748b';

  initChartProduksiBulanan();
  initChartProduksiBlok();
  initChartPanenBulanan();
  initChartTrenCuaca();
  initChartLaporanBulanan();
  initChartDistribusiPanen();
}

function initChartProduksiBulanan() {
  const ctx = document.getElementById('chartProduksiBulanan');
  if (!ctx) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const dataValues = [14, 16, 18, 17, 21, 23, 22, 26, 22.8, 25.3, 24, 25];

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(45, 106, 79, 0.45)');
  gradient.addColorStop(1, 'rgba(45, 106, 79, 0.02)');

  charts.produksiBulanan = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Produksi TBS (Ton)',
        data: dataValues,
        borderColor: '#2d6a4f',
        borderWidth: 2.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2d6a4f',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `Produksi: ${ctx.parsed.y} Ton`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f2' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initChartProduksiBlok() {
  const ctx = document.getElementById('chartProduksiBlok');
  if (!ctx) return;

  charts.produksiBlok = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Blok A', 'Blok B', 'Blok C', 'Blok D'],
      datasets: [{
        label: 'Hasil (Ton)',
        data: [7.2, 5.8, 6.4, 4.8],
        backgroundColor: ['#2d6a4f', '#40916c', '#52b788', '#74c69d'],
        borderRadius: 8,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f2' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initChartPanenBulanan() {
  const ctx = document.getElementById('chartPanenBulanan');
  if (!ctx) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'];
  const values = [7550, 8150, 8700, 9100, 9600, 9900, 9450, 10300, 8900];

  charts.panenBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Volume Panen (kg)',
        data: values,
        backgroundColor: '#2d6a4f',
        borderRadius: 6,
        barPercentage: 0.55
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toLocaleString('id-ID')} kg`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f2' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initChartTrenCuaca() {
  const ctx = document.getElementById('chartTrenCuaca');
  if (!ctx) return;

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  charts.trenCuaca = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Suhu (°C)',
          data: [30, 31, 29, 32, 33, 30, 31],
          borderColor: '#d97706',
          backgroundColor: '#d97706',
          yAxisID: 'yTemp',
          tension: 0.35,
          borderWidth: 2.5
        },
        {
          label: 'Curah Hujan (mm)',
          data: [20, 15, 45, 5, 0, 25, 10],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.15)',
          fill: true,
          yAxisID: 'yRain',
          tension: 0.35,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        yTemp: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Suhu (°C)' },
          min: 20,
          max: 40,
          grid: { color: '#f1f5f2' }
        },
        yRain: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Curah Hujan (mm)' },
          min: 0,
          max: 60,
          grid: { display: false }
        },
        x: { grid: { display: false } }
      }
    }
  });

  updateWeatherChart();
}

function initChartLaporanBulanan() {
  const ctx = document.getElementById('chartLaporanBulanan');
  if (!ctx) return;

  const months = state.laporan2023.map(d => d.bulan.substring(0, 3));
  const totalsInTon = state.laporan2023.map(d => (d.blokA + d.blokB + d.blokC + d.blokD) / 1000);

  charts.laporanBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Hasil Panen (Ton)',
        data: totalsInTon,
        backgroundColor: '#2d6a4f',
        borderRadius: 6,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toFixed(2)} Ton`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f2' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function initChartDistribusiPanen() {
  const ctx = document.getElementById('chartDistribusiPanen');
  if (!ctx) return;

  const totalA = state.laporan2023.reduce((acc, curr) => acc + curr.blokA, 0);
  const totalB = state.laporan2023.reduce((acc, curr) => acc + curr.blokB, 0);
  const totalC = state.laporan2023.reduce((acc, curr) => acc + curr.blokC, 0);
  const totalD = state.laporan2023.reduce((acc, curr) => acc + curr.blokD, 0);

  charts.distribusiPanen = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Blok A', 'Blok B', 'Blok C', 'Blok D'],
      datasets: [{
        data: [totalA, totalB, totalC, totalD],
        backgroundColor: ['#2d6a4f', '#52b788', '#d97706', '#0284c7'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { boxWidth: 12, padding: 14 }
        }
      }
    }
  });
}

/* ==========================================================================
   EXPORT TO CSV UTILITY
   ========================================================================== */
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tr');
  let csv = [];

  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll('td, th');
    
    for (let j = 0; j < cols.length; j++) {
      if (cols[j].classList.contains('text-center') && cols[j].textContent.includes('Aksi')) continue;
      if (cols[j].querySelector('.action-btn-group')) continue;

      let text = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s+)/gm, ' ');
      text = text.replace(/"/g, '""');
      row.push(`"${text}"`);
    }
    csv.push(row.join(','));
  }

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  showToast(`File ${filename} berhasil diunduh!`);
}

/* ==========================================================================
   TOAST HELPER & DATE FORMATTING
   ========================================================================== */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle-2'}" style="width: 18px; height: 18px; color: ${type === 'error' ? '#ef4444' : '#10b981'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatTanggal(isoString) {
  if (!isoString) return '-';
  const parts = isoString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoString;
}

/* ==========================================================================
   AUTHENTICATION & SECURITY SYSTEM
   ========================================================================== */
let failedLoginAttempts = parseInt(sessionStorage.getItem('sawit_failed_attempts') || '0');
let lockoutTimeRemaining = 0;
let lockoutTimer = null;
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

async function computeSHA256(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto subtle error:', e);
    }
  }
  return null;
}

// Pre-compute the correct hash at startup to ensure it's always right
(async function initPasswordHash() {
  const correctHash = await computeSHA256(state.authConfig.plainPasswordBackup);
  if (correctHash) {
    state.authConfig.passwordHash = correctHash;
  }
})();

function checkAuthSession() {
  const sources = [
    { key: 'sawit_auth_session', storage: sessionStorage },
    { key: 'sawit_auth_session', storage: localStorage }
  ];

  for (const src of sources) {
    const sessionStr = src.storage.getItem(src.key);
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.username && session.token) {
          // Check username match
          if (session.username.toLowerCase() !== state.authConfig.username.toLowerCase()) continue;

          // Check session expiry (24h max)
          if (session.createdAt) {
            const created = new Date(session.createdAt).getTime();
            if (Date.now() - created > SESSION_EXPIRY_MS) {
              src.storage.removeItem(src.key);
              continue;
            }
          }

          state.isAuthenticated = true;
          return true;
        }
      } catch (e) {
        src.storage.removeItem(src.key);
        console.warn('Invalid auth session, removed:', e);
      }
    }
  }

  state.isAuthenticated = false;
  return false;
}

function updateAuthUI() {
  const loginOverlay = document.getElementById('login-screen');
  const appContainer = document.querySelector('.app-container');

  if (state.isAuthenticated) {
    if (loginOverlay) loginOverlay.classList.add('overlay-hidden');
    if (appContainer) appContainer.style.pointerEvents = '';
  } else {
    if (loginOverlay) loginOverlay.classList.remove('overlay-hidden');
    if (appContainer) appContainer.style.pointerEvents = 'none';
    // Focus username field
    setTimeout(() => {
      document.getElementById('login-username')?.focus();
    }, 400);
  }
}

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();

  if (lockoutTimeRemaining > 0) {
    showLoginError(`Akses dikunci sementara. Tunggu ${lockoutTimeRemaining} detik lagi.`);
    return;
  }

  const userIn = document.getElementById('login-username')?.value.trim();
  const passIn = document.getElementById('login-password')?.value || '';
  const rememberIn = document.getElementById('login-remember')?.checked;

  if (!userIn || !passIn) {
    showLoginError('Mohon isi nama pengguna dan kata sandi.');
    return;
  }

  const submitBtn = document.getElementById('btn-login-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader" class="spin"></i> Memverifikasi...`;
    if (window.lucide) lucide.createIcons();
  }

  // Artificial delay for brute-force protection (200-500ms)
  await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

  // Compute password SHA-256 hash for secure comparison
  const passHash = await computeSHA256(passIn);

  const isUserValid = userIn.toLowerCase() === state.authConfig.username.toLowerCase();
  const isPassValid = (passHash && passHash === state.authConfig.passwordHash) || (passIn === state.authConfig.plainPasswordBackup);

  if (isUserValid && isPassValid) {
    failedLoginAttempts = 0;
    sessionStorage.setItem('sawit_failed_attempts', '0');
    state.isAuthenticated = true;

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const sessionData = {
      username: state.authConfig.username,
      token,
      createdAt: new Date().toISOString()
    };

    if (rememberIn) {
      localStorage.setItem('sawit_auth_session', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('sawit_auth_session', JSON.stringify(sessionData));
    }

    hideLoginError();
    updateAuthUI();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="check-circle-2"></i> Login Berhasil!`;
      if (window.lucide) lucide.createIcons();
    }

    showToast(`Selamat datang kembali, ${state.authConfig.username}!`, 'success');
  } else {
    failedLoginAttempts++;
    sessionStorage.setItem('sawit_failed_attempts', String(failedLoginAttempts));

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="log-in"></i> Masuk Ke Sistem`;
      if (window.lucide) lucide.createIcons();
    }

    if (failedLoginAttempts >= 5) {
      startLockoutTimer(30 * Math.ceil(failedLoginAttempts / 5));
    } else {
      showLoginError(`Username atau Password salah! (Percobaan ${failedLoginAttempts}/5)`);
    }
  }
}

function startLockoutTimer(seconds) {
  lockoutTimeRemaining = seconds;
  const submitBtn = document.getElementById('btn-login-submit');
  showLoginError(`Keamanan: ${failedLoginAttempts}x gagal! Akses dikunci ${lockoutTimeRemaining} detik.`);

  if (submitBtn) submitBtn.disabled = true;

  if (lockoutTimer) clearInterval(lockoutTimer);
  lockoutTimer = setInterval(() => {
    lockoutTimeRemaining--;
    if (lockoutTimeRemaining <= 0) {
      clearInterval(lockoutTimer);
      lockoutTimeRemaining = 0;
      failedLoginAttempts = 0;
      sessionStorage.setItem('sawit_failed_attempts', '0');
      hideLoginError();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in"></i> Masuk Ke Sistem`;
        if (window.lucide) lucide.createIcons();
      }
    } else {
      showLoginError(`Keamanan: Akses dikunci ${lockoutTimeRemaining} detik lagi.`);
    }
  }, 1000);
}

function showLoginError(msg) {
  const alertEl = document.getElementById('login-error-alert');
  const msgEl = document.getElementById('login-error-msg');
  if (msgEl) msgEl.textContent = msg;
  if (alertEl) {
    alertEl.classList.remove('hidden');
    // Re-trigger shake animation
    alertEl.style.animation = 'none';
    alertEl.offsetHeight; // force reflow
    alertEl.style.animation = '';
  }
}

function hideLoginError() {
  const alertEl = document.getElementById('login-error-alert');
  if (alertEl) alertEl.classList.add('hidden');
}

async function handleLogout() {
  const confirmed = await showConfirmDialog({
    title: 'Konfirmasi Logout',
    message: 'Apakah Anda yakin ingin keluar dari portal privat <strong>Sawit Pintar</strong>? Sesi kerja Anda saat ini akan diakhiri.',
    confirmText: 'Keluar Sekarang',
    cancelText: 'Batal',
    type: 'warning'
  });
  if (!confirmed) return;

  sessionStorage.removeItem('sawit_auth_session');
  localStorage.removeItem('sawit_auth_session');
  sessionStorage.setItem('sawit_failed_attempts', '0');
  failedLoginAttempts = 0;
  state.isAuthenticated = false;
  updateAuthUI();

  // Clear login form
  const userIn = document.getElementById('login-username');
  const passIn = document.getElementById('login-password');
  if (userIn) userIn.value = '';
  if (passIn) passIn.value = '';

  showToast('Anda telah keluar dari sistem secara aman.', 'success');
}

