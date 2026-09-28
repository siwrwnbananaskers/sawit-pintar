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
  } catch (err) {
    console.warn('Local storage load note', err);
  }

  // 2. Pre-fill setting API URL input
  const settingInput = document.getElementById('setting-api-url');
  if (settingInput && window.ApiService) {
    settingInput.value = ApiService.getBaseUrl();
  }

  // 3. Check connection to Cloudflare D1
  if (window.ApiService && ApiService.getBaseUrl()) {
    const online = await ApiService.checkConnection();
    updateApiStatusBadge(online);

    if (online) {
      showToast('Terhubung ke database Cloudflare D1!', 'success');
      try {
        const [dbLahan, dbPekerja, dbKegiatan, dbPanen, dbCuaca] = await Promise.all([
          ApiService.lahan.get(),
          ApiService.pekerja.get(),
          ApiService.kegiatan.get(),
          ApiService.panen.get(),
          ApiService.cuaca.get()
        ]);

        if (dbLahan && dbLahan.length > 0) state.lahanList = dbLahan;
        if (dbPekerja && dbPekerja.length > 0) state.pekerjaList = dbPekerja;
        if (dbKegiatan && dbKegiatan.length > 0) state.kegiatanList = dbKegiatan;
        if (dbPanen && dbPanen.length > 0) state.panenList = dbPanen;
        if (dbCuaca && dbCuaca.length > 0) state.cuacaList = dbCuaca;
      } catch (err) {
        console.warn('Cloud sync error, staying on local', err);
      }
    }
  } else {
    updateApiStatusBadge(false);
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
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      if (viewId) {
        switchView(viewId);
      }
    });
  });

  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

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

// 5. Monitoring Cuaca Table
function renderCuacaTable() {
  const tbody = document.getElementById('cuaca-table-body');
  if (!tbody) return;

  tbody.innerHTML = state.cuacaList.map(item => `
    <tr>
      <td><strong>${formatTanggal(item.tanggal)}</strong></td>
      <td>${item.jam} WIB</td>
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
    document.getElementById('pekerja-avatar-custom').classList.add('hidden');
    handlePekerjaPosisiChange('Estate Manager');
    populateBlokDropdown();
    openModal('modal-pekerja');
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

// Avatar select in Pekerja Modal
function handlePekerjaAvatarChange(value) {
  const preview = document.getElementById('pekerja-avatar-preview');
  const customInput = document.getElementById('pekerja-avatar-custom');

  if (value === 'custom') {
    customInput.classList.remove('hidden');
    customInput.oninput = (e) => {
      if (e.target.value.trim()) {
        preview.src = e.target.value.trim();
      }
    };
  } else {
    customInput.classList.add('hidden');
    if (AVATAR_PRESETS[value]) {
      preview.src = AVATAR_PRESETS[value];
    }
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

  if (confirm(`Apakah Anda yakin ingin menghapus data "${lahan.nama}"?`)) {
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
  document.getElementById('pekerja-avatar-preview').src = worker.avatar || AVATAR_PRESETS.preset1;
  document.getElementById('pekerja-avatar-select').value = 'preset1';
  document.getElementById('pekerja-avatar-custom').classList.add('hidden');
  document.getElementById('modal-pekerja-title').textContent = `Edit Karyawan: ${worker.nama}`;

  handlePekerjaPosisiChange(worker.posisi);
  populateBlokDropdown(worker.blok);
  openModal('modal-pekerja');
}

async function deletePekerja(id) {
  const worker = state.pekerjaList.find(p => p.id === id);
  if (!worker) return;

  if (worker.posisi === 'Estate Manager' || worker.id === 'PK-01') {
    alert('Estate Manager utama tidak dapat dihapus. Anda dapat mengubah nama, email, dan kontaknya melalui tombol Edit.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus data karyawan "${worker.nama}"?`)) {
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
  if (confirm('Hapus catatan kegiatan ini?')) {
    state.kegiatanList = state.kegiatanList.filter(x => x.id !== id);

    if (window.ApiService && ApiService.isOnline()) {
      ApiService.kegiatan.delete(id);
    }

    saveLocalState();
    renderKegiatanTable();
    renderDashboardActivities();
    showToast('Catatan kegiatan telah dihapus', 'error');
  }
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
  if (confirm('Hapus catatan panen ini?')) {
    state.panenList = state.panenList.filter(x => x.id !== id);

    if (window.ApiService && ApiService.isOnline()) {
      ApiService.panen.delete(id);
    }

    saveLocalState();
    renderPanenTable();
    showToast('Catatan panen telah dihapus', 'error');
  }
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
  closeModal('modal-cuaca');
  showToast('Data cuaca berhasil ditambahkan');
}

async function deleteCuaca(id) {
  if (confirm('Hapus data cuaca ini?')) {
    state.cuacaList = state.cuacaList.filter(x => x.id !== id);

    if (window.ApiService && ApiService.isOnline()) {
      ApiService.cuaca.delete(id);
    }

    saveLocalState();
    renderCuacaTable();
    showToast('Data cuaca telah dihapus', 'error');
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

  // Weather Sync button
  document.getElementById('btn-sync-weather')?.addEventListener('click', () => {
    showToast('Sinkronisasi IoT Stasiun Cuaca selesai! Data terkini telah diperbarui.');
  });

  // Refresh Dashboard
  document.getElementById('btn-refresh-dashboard')?.addEventListener('click', () => {
    showToast('Memperbarui data dashboard...');
    updateKPIs();
    renderDashboardActivities();
  });

  // Save General Settings
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    showToast('Pengaturan sistem berhasil disimpan!');
  });

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
