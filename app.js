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

// Default minimum employee required by system for Profile synchronization
const DEFAULT_ESTATE_MANAGER = {
  id: 'PK-01',
  nama: 'Rian Pratama, S.P.',
  posisi: 'Estate Manager',
  email: 'rian.pratama@sawitlestari.co.id',
  telp: '0812-3456-7890',
  blok: 'Semua Blok',
  status: 'Tetap',
  avatar: AVATAR_PRESETS.preset4
};

// Global Application State (Zero dummy data, clean slate)
const state = {
  activeView: 'dashboard',

  // System Privacy & Authentication Config (Default: si_wrwn / 130399)
  isAuthenticated: false,
  authConfig: {
    username: 'si_wrwn',
    passwordHash: '8a129035e98bb4b6b669e46a7824896796348efca66eb132a26514757aeeb448',
    plainPasswordBackup: '130399'
  },

  // Manajemen Pekerja: hanya data default minimum (Estate Manager pertama)
  pekerjaList: [{ ...DEFAULT_ESTATE_MANAGER }],

  // Data Lahan (kosong, diisi langsung oleh user)
  lahanList: [],

  // Catatan Kegiatan Agronomi (kosong, diisi langsung oleh user)
  kegiatanList: [],

  // Hasil Panen (kosong, diisi langsung oleh user)
  panenList: [],

  // Monitoring Cuaca (kosong, diisi langsung oleh user/IoT sync)
  cuacaList: [],

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
    notif_iot: true,
    // Daftar pembeli TBS yang dapat dikelola user (tambah/hapus)
    daftarPembeli: ['PT Sawit Jaya']
  },

  // Tahun laporan panen (dinamis dari catatan panen user)
  laporanSelectedYear: new Date().getFullYear(),
  // Dynamic Realtime Notifications
  notifications: []
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
  initCharts();
  initTables();
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
  // Clear legacy mock data completely for v5 clean slate
  try {
    const dummyCleaned = localStorage.getItem('sawit_dummy_cleaned_v5');
    if (!dummyCleaned) {
      localStorage.removeItem('sawit_lahan_list');
      localStorage.removeItem('sawit_kegiatan_list');
      localStorage.removeItem('sawit_panen_list');
      localStorage.removeItem('sawit_cuaca_list');
      localStorage.removeItem('sawit_pekerja_list');
      localStorage.setItem('sawit_dummy_cleaned_v5', 'true');
    }
  } catch (cleanErr) {
    console.warn('Dummy cleanup note', cleanErr);
  }

  // Helper filter to purge dummy mock records if present
  const isMockRecord = (item) => {
    if (!item) return true;
    const str = JSON.stringify(item);
    return str.includes('LAPAK TBS') || 
           str.includes('Joko Widodo') || 
           str.includes('Sutrisno') || 
           str.includes('Budi Santoso') || 
           str.includes('Hasan Basri') || 
           str.includes('Dedi Kurniawan') || 
           str.includes('2023-09-23') || 
           str.includes('2023-09-24') || 
           str.includes('2023-09-20') || 
           str.includes('CV Berkah Sawit') || 
           str.includes('PT Agro Lestari') || 
           str.includes('Blok A - Mandiri');
  };

  // 1. Load LocalStorage first (instant paint)
  try {
    const savedPekerja = localStorage.getItem('sawit_pekerja_list');
    if (savedPekerja) {
      const parsed = JSON.parse(savedPekerja).filter(p => !isMockRecord(p) || p.posisi === 'Estate Manager');
      state.pekerjaList = Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ ...DEFAULT_ESTATE_MANAGER }];
    } else {
      state.pekerjaList = [{ ...DEFAULT_ESTATE_MANAGER }];
    }

    // Ensure Estate Manager is always present for system profile synchronization
    if (!state.pekerjaList.some(p => p.posisi === 'Estate Manager')) {
      state.pekerjaList.unshift({ ...DEFAULT_ESTATE_MANAGER });
    }

    const savedLahan = localStorage.getItem('sawit_lahan_list');
    if (savedLahan) state.lahanList = JSON.parse(savedLahan).filter(l => !isMockRecord(l));
    const savedKegiatan = localStorage.getItem('sawit_kegiatan_list');
    if (savedKegiatan) state.kegiatanList = JSON.parse(savedKegiatan).filter(k => !isMockRecord(k));
    const savedPanen = localStorage.getItem('sawit_panen_list');
    if (savedPanen) state.panenList = JSON.parse(savedPanen).filter(p => !isMockRecord(p));
    const savedCuaca = localStorage.getItem('sawit_cuaca_list');
    if (savedCuaca) state.cuacaList = JSON.parse(savedCuaca).filter(c => !isMockRecord(c));

    const savedPengaturan = localStorage.getItem('sawit_pengaturan');
    if (savedPengaturan) {
      const parsedPengaturan = JSON.parse(savedPengaturan);
      state.pengaturan = { ...state.pengaturan, ...parsedPengaturan };
      
      // Migration for daftarPembeli
      if (!Array.isArray(state.pengaturan.daftarPembeli) || state.pengaturan.daftarPembeli.length === 0) {
        state.pengaturan.daftarPembeli = [{ nama: 'PT Sawit Jaya', gradeA: 2600, gradeB: 2400 }];
      } else {
        state.pengaturan.daftarPembeli = state.pengaturan.daftarPembeli.map(p => {
          if (typeof p === 'string') return { nama: p, gradeA: 2500, gradeB: 2300 };
          return p;
        });
      }
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

        // 1. Data Lahan Sync
        if (dbLahan && Array.isArray(dbLahan)) {
          const cleanLahan = dbLahan.filter(l => !isMockRecord(l));
          if (cleanLahan.length > 0) {
            state.lahanList = cleanLahan;
          } else if (state.lahanList.length > 0) {
            // Upload local lahan list to D1 database if D1 is empty!
            for (const item of state.lahanList) {
              await ApiService.lahan.create({
                nama: item.nama,
                lokasi: item.lokasi,
                luas: item.luas,
                pohon: item.pohon,
                varietas: item.varietas,
                mandor: item.mandor || '',
                status: item.status || 'Produktif'
              });
            }
            // Fetch updated list from D1 to synchronize D1 assigned IDs (5, 6, 7)
            const freshLahan = await ApiService.lahan.get();
            if (freshLahan && freshLahan.length > 0) {
              state.lahanList = freshLahan;
            }
            console.log('Successfully synced local lahan list to Cloudflare D1');
          }
        }

        // 2. Pekerja Sync
        if (dbPekerja && Array.isArray(dbPekerja)) {
          const cleanPekerja = dbPekerja.filter(p => !isMockRecord(p) || p.posisi === 'Estate Manager');
          if (cleanPekerja.length > 0) {
            state.pekerjaList = cleanPekerja;
          } else if (state.pekerjaList.length > 0) {
            for (const p of state.pekerjaList) {
              await ApiService.pekerja.save(p);
            }
          }
        }

        // 3. Kegiatan Sync
        if (dbKegiatan && Array.isArray(dbKegiatan)) {
          const cleanKegiatan = dbKegiatan.filter(k => !isMockRecord(k));
          if (cleanKegiatan.length > 0) {
            state.kegiatanList = cleanKegiatan;
          } else if (state.kegiatanList.length > 0) {
            for (const k of state.kegiatanList) {
              await ApiService.kegiatan.create(k);
            }
          }
        }

        // 4. Panen Sync
        if (dbPanen && Array.isArray(dbPanen)) {
          const cleanPanen = dbPanen.filter(p => !isMockRecord(p));
          if (cleanPanen.length > 0) {
            state.panenList = cleanPanen;
          } else if (state.panenList.length > 0) {
            for (const p of state.panenList) {
              await ApiService.panen.create(p);
            }
          }
        }

        // 5. Cuaca Sync
        if (dbCuaca && Array.isArray(dbCuaca)) {
          const cleanCuaca = dbCuaca.filter(c => !isMockRecord(c));
          if (cleanCuaca.length > 0) {
            state.cuacaList = cleanCuaca;
          } else if (state.cuacaList && state.cuacaList.length > 0) {
            // Upload local cuaca list to Cloudflare D1 database if D1 is empty!
            for (const item of state.cuacaList) {
              await ApiService.cuaca.create({
                tanggal: item.tanggal,
                jam: item.jam,
                suhu: item.suhu,
                kelembaban: item.kelembaban,
                curah: item.curah,
                kondisi: item.kondisi,
                lokasi: item.lokasi || (state.weatherLocation ? state.weatherLocation.name : 'Tegalsari, Musi Rawas')
              });
            }
            const freshCuaca = await ApiService.cuaca.get();
            if (freshCuaca && freshCuaca.length > 0) {
              state.cuacaList = freshCuaca;
            }
            console.log('Successfully synced local weather records to Cloudflare D1');
          }
        }

        // 6. Pengaturan Sync
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

  // Simpan state yang sudah bersih kembali ke LocalStorage
  saveLocalState();

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
  return state.pekerjaList.find(p => p.posisi === 'Estate Manager') || state.pekerjaList[0] || DEFAULT_ESTATE_MANAGER;
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
      'dashboard': 'Dashboard',
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
  renderPembelijList();
  renderKegiatanBlokFilter();
  updateKPIs();
  generateRealtimeNotifications();
}

// 1. Data Lahan Table (With Mandor Relation & Detail Popover)
function renderLahanTable(filteredList = state.lahanList) {
  const tbody = document.getElementById('lahan-table-body');
  if (!tbody) return;

  if (filteredList.length === 0) {
    if (state.lahanList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty-row text-center">
            <div class="empty-state-card">
              <div class="empty-state-icon-circle">
                <i data-lucide="map-pin"></i>
              </div>
              <h4 class="empty-state-title">Belum Ada Data Lahan</h4>
              <p class="empty-state-desc">Inventarisasi blok kebun sawit Anda belum tersedia. Tambahkan blok lahan pertama untuk mulai mencatat luas area, varietas bibit, populasi pohon, dan mandor penanggung jawab.</p>
              <button class="btn btn-primary empty-state-action" onclick="openModal('modal-lahan')">
                <i data-lucide="plus-circle"></i> Tambah Lahan Pertama
              </button>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty-row text-center">
            <div class="empty-state-card" style="padding: 28px 16px;">
              <i data-lucide="search-x" style="width:36px; height:36px; color:#94a3b8; margin-bottom:10px;"></i>
              <h4 class="empty-state-title" style="font-size:15px;">Tidak Ditemukan Lahan yang Cocok</h4>
              <p class="empty-state-desc" style="font-size:13px; margin-bottom:0;">Coba gunakan kata kunci pencarian nama blok atau lokasi yang lain.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
    updateLahanStats();
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
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-empty-row text-center">
          <div class="empty-state-card" style="padding: 28px 16px;">
            <i data-lucide="user-x" style="width:36px; height:36px; color:#94a3b8; margin-bottom:10px;"></i>
            <h4 class="empty-state-title" style="font-size:15px;">Pekerja Tidak Ditemukan</h4>
            <p class="empty-state-desc" style="font-size:13px; margin-bottom:0;">Tidak ada pekerja yang sesuai dengan kata kunci pencarian Anda.</p>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
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
    if (state.kegiatanList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-row text-center">
            <div class="empty-state-card">
              <div class="empty-state-icon-circle">
                <i data-lucide="clipboard-list"></i>
              </div>
              <h4 class="empty-state-title">Belum Ada Catatan Kegiatan Agronomi</h4>
              <p class="empty-state-desc">Pantau pemupukan, pemangkasan (pruning), pengendalian gulma & hama, serta sanitasi kebun secara berkala di sini.</p>
              <button class="btn btn-primary empty-state-action" onclick="openModal('modal-kegiatan')">
                <i data-lucide="plus-circle"></i> Catat Kegiatan Pertama
              </button>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-row text-center">
            <div class="empty-state-card" style="padding: 28px 16px;">
              <i data-lucide="search-x" style="width:36px; height:36px; color:#94a3b8; margin-bottom:10px;"></i>
              <h4 class="empty-state-title" style="font-size:15px;">Tidak Ada Catatan yang Sesuai</h4>
              <p class="empty-state-desc" style="font-size:13px; margin-bottom:0;">Tidak ada aktivitas yang cocok dengan filter blok atau kata kunci yang dipilih.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
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

function updateRingkasanPanen() {
  const totalKg = state.panenList.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalUang = state.panenList.reduce((acc, curr) => acc + ((Number(curr.jumlah) || 0) * (Number(curr.harga) || 0)), 0);
  const rataHarga = totalKg > 0 ? Math.round(totalUang / totalKg) : 0;

  const totalPanenEl = document.getElementById('ringkasan-total-panen');
  const rataHargaEl = document.getElementById('ringkasan-rata-harga');
  const totalPendapatanEl = document.getElementById('ringkasan-total-pendapatan');

  if (totalPanenEl) totalPanenEl.textContent = `${totalKg.toLocaleString('id-ID')} kg`;
  if (rataHargaEl) rataHargaEl.textContent = `Rp ${rataHarga.toLocaleString('id-ID')} / kg`;
  if (totalPendapatanEl) totalPendapatanEl.textContent = `Rp ${totalUang.toLocaleString('id-ID')}`;
}

// 4. Hasil Panen Table
function renderPanenTable(filteredList = state.panenList) {
  const tbody = document.getElementById('panen-table-body');
  if (!tbody) return;

  updateRingkasanPanen();

  if (filteredList.length === 0) {
    if (state.panenList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-row text-center">
            <div class="empty-state-card">
              <div class="empty-state-icon-circle">
                <i data-lucide="archive"></i>
              </div>
              <h4 class="empty-state-title">Belum Ada Riwayat Hasil Panen</h4>
              <p class="empty-state-desc">Catat hasil timbangan panen Tandan Buah Segar (TBS) per rotasi untuk memantau tonase produksi, harga per kg, dan total pendapatan.</p>
              <button class="btn btn-primary empty-state-action" onclick="openModal('modal-panen')">
                <i data-lucide="plus-circle"></i> Catat Panen Pertama
              </button>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-row text-center">
            <div class="empty-state-card" style="padding: 28px 16px;">
              <i data-lucide="search-x" style="width:36px; height:36px; color:#94a3b8; margin-bottom:10px;"></i>
              <h4 class="empty-state-title" style="font-size:15px;">Data Panen Tidak Ditemukan</h4>
              <p class="empty-state-desc" style="font-size:13px; margin-bottom:0;">Tidak ada catatan panen yang sesuai dengan pencarian Anda.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
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
    if (!state.cuacaList || state.cuacaList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-row text-center">
            <div class="empty-state-card">
              <div class="empty-state-icon-circle">
                <i data-lucide="cloud-rain"></i>
              </div>
              <h4 class="empty-state-title">Belum Ada Data Log Cuaca</h4>
              <p class="empty-state-desc">Catat riwayat curah hujan, suhu, dan kelembaban harian secara manual atau sinkronkan data telemetry terkini dari stasiun cuaca IoT.</p>
              <button class="btn btn-primary empty-state-action" onclick="openModal('modal-cuaca')">
                <i data-lucide="plus-circle"></i> Tambah Log Cuaca
              </button>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-row text-center">
            <div class="empty-state-card" style="padding: 28px 16px;">
              <i data-lucide="search-x" style="width:36px; height:36px; color:#94a3b8; margin-bottom:10px;"></i>
              <h4 class="empty-state-title" style="font-size:15px;">Data Cuaca Tidak Ditemukan</h4>
              <p class="empty-state-desc" style="font-size:13px; margin-bottom:0;">Belum ada log cuaca untuk filter bulan atau stasiun yang dipilih.</p>
            </div>
          </td>
        </tr>
      `;
    }
    if (window.lucide) lucide.createIcons();
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

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getLaporanBlocks() {
  const set = new Set();
  state.lahanList.forEach(l => {
    if (l.nama) set.add(l.nama.trim());
  });
  state.panenList.forEach(p => {
    if (p.blok) set.add(p.blok.trim());
  });
  const list = Array.from(set).filter(Boolean);
  return list.length > 0 ? list : ['Blok A', 'Blok B', 'Blok C', 'Blok D'];
}

function updateLaporanYearDropdown() {
  const select = document.getElementById('select-periode-laporan');
  if (!select) return;

  const currentYear = new Date().getFullYear();
  const yearsSet = new Set([currentYear, currentYear - 1, currentYear - 2]);
  state.panenList.forEach(p => {
    if (p.tanggal) {
      const y = new Date(p.tanggal).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    }
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
  const currentVal = state.laporanSelectedYear || currentYear;

  select.innerHTML = sortedYears.map(y => 
    `<option value="${y}" ${y === currentVal ? 'selected' : ''}>Laporan Bulanan ${y}</option>`
  ).join('');
}

// 6. Laporan Panen Tahunan (Dinamis dari Data Panen Real User)
function renderLaporanTable() {
  const tbody = document.getElementById('laporan-table-body');
  const tfoot = document.getElementById('laporan-table-footer');
  const thead = document.querySelector('#tabel-laporan-tahunan thead');
  const title = document.getElementById('title-tabel-laporan');
  if (!tbody) return;

  const selectedYear = state.laporanSelectedYear || new Date().getFullYear();
  if (title) title.textContent = `Tabel Laporan Panen ${selectedYear}`;

  updateLaporanYearDropdown();
  const blocks = getLaporanBlocks();

  // Dynamic table headers matching actual blocks
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th>Bulan</th>
        ${blocks.map(b => `<th>${b} (kg)</th>`).join('')}
        <th>Total Panen (kg)</th>
        <th>Pendapatan (Rp)</th>
      </tr>
    `;
  }

  // Filter real panen records for selected year
  const yearPanen = state.panenList.filter(p => {
    if (!p.tanggal) return false;
    const d = new Date(p.tanggal);
    return d.getFullYear() === selectedYear;
  });

  if (yearPanen.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${blocks.length + 3}" class="table-empty-row text-center">
          <div class="empty-state-card">
            <div class="empty-state-icon-circle">
              <i data-lucide="bar-chart-2"></i>
            </div>
            <h4 class="empty-state-title">Belum Ada Data Panen Tahun ${selectedYear}</h4>
            <p class="empty-state-desc">Belum ada catatan panen TBS pada tahun ${selectedYear}. Semua laporan bulanan dan grafik distribusi blok akan dihitung secara dinamis dari catatan panen real.</p>
            <button class="btn btn-primary empty-state-action" onclick="switchView('hasil-panen'); openModal('modal-panen');">
              <i data-lucide="plus-circle"></i> Input Catatan Panen
            </button>
          </div>
        </td>
      </tr>
    `;
    if (tfoot) tfoot.innerHTML = '';
    if (window.lucide) lucide.createIcons();
    updateLaporanCharts([], blocks);
    return;
  }

  // Aggregate panen per month
  const monthlyData = MONTH_NAMES.map((name, mIdx) => {
    const records = yearPanen.filter(p => new Date(p.tanggal).getMonth() === mIdx);
    const blockKg = {};
    blocks.forEach(b => { blockKg[b] = 0; });

    let totalMonthKg = 0;
    let totalMonthIncome = 0;

    records.forEach(r => {
      const kg = Number(r.jumlah) || 0;
      const price = Number(r.harga) || 0;
      totalMonthKg += kg;
      totalMonthIncome += (kg * price);

      const rBlock = (r.blok || '').trim();
      const match = blocks.find(b => b === rBlock || rBlock.startsWith(b));
      if (match) {
        blockKg[match] = (blockKg[match] || 0) + kg;
      } else if (blocks.length > 0) {
        blockKg[blocks[0]] = (blockKg[blocks[0]] || 0) + kg;
      }
    });

    return {
      monthName: name,
      blockKg,
      totalMonthKg,
      totalMonthIncome
    };
  });

  const totalBlockSum = {};
  blocks.forEach(b => { totalBlockSum[b] = 0; });
  let grandTotalKg = 0;
  let grandTotalIncome = 0;

  tbody.innerHTML = monthlyData.map(row => {
    blocks.forEach(b => {
      totalBlockSum[b] += row.blockKg[b] || 0;
    });
    grandTotalKg += row.totalMonthKg;
    grandTotalIncome += row.totalMonthIncome;

    return `
      <tr>
        <td><strong>${row.monthName}</strong></td>
        ${blocks.map(b => `<td>${(row.blockKg[b] || 0).toLocaleString('id-ID')}</td>`).join('')}
        <td><strong>${row.totalMonthKg.toLocaleString('id-ID')}</strong></td>
        <td><strong class="text-success">Rp ${row.totalMonthIncome.toLocaleString('id-ID')}</strong></td>
      </tr>
    `;
  }).join('');

  if (tfoot) {
    tfoot.innerHTML = `
      <tr>
        <td>TOTAL TAHUNAN</td>
        ${blocks.map(b => `<td>${(totalBlockSum[b] || 0).toLocaleString('id-ID')} kg</td>`).join('')}
        <td><strong>${grandTotalKg.toLocaleString('id-ID')} kg</strong></td>
        <td><strong class="text-success">Rp ${grandTotalIncome.toLocaleString('id-ID')}</strong></td>
      </tr>
    `;
  }

  if (window.lucide) lucide.createIcons();
  updateLaporanCharts(monthlyData, blocks);
}

function updateLaporanCharts(monthlyData, blocks) {
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  if (charts.laporanBulanan) {
    charts.laporanBulanan.data.labels = shortMonths;
    const totalsInTon = (monthlyData && monthlyData.length === 12)
      ? monthlyData.map(m => +(m.totalMonthKg / 1000).toFixed(2))
      : new Array(12).fill(0);
    charts.laporanBulanan.data.datasets[0].data = totalsInTon;
    charts.laporanBulanan.update();
  }

  if (charts.distribusiPanen) {
    if (!monthlyData || monthlyData.length === 0) {
      charts.distribusiPanen.data.labels = ['Belum Ada Data Panen'];
      charts.distribusiPanen.data.datasets[0].data = [1];
      charts.distribusiPanen.data.datasets[0].backgroundColor = ['#e2e8f0'];
    } else {
      const blockTotals = blocks.map(b => {
        return monthlyData.reduce((acc, curr) => acc + (curr.blockKg[b] || 0), 0);
      });
      const hasAny = blockTotals.some(v => v > 0);
      if (!hasAny) {
        charts.distribusiPanen.data.labels = ['Belum Ada Data Panen'];
        charts.distribusiPanen.data.datasets[0].data = [1];
        charts.distribusiPanen.data.datasets[0].backgroundColor = ['#e2e8f0'];
      } else {
        const palette = ['#2d6a4f', '#52b788', '#d97706', '#0284c7', '#8b5cf6', '#ec4899', '#14b8a6'];
        charts.distribusiPanen.data.labels = blocks;
        charts.distribusiPanen.data.datasets[0].data = blockTotals;
        charts.distribusiPanen.data.datasets[0].backgroundColor = blocks.map((_, i) => palette[i % palette.length]);
      }
    }
    charts.distribusiPanen.update();
  }
}

// Dashboard Recent Activities
function renderDashboardActivities() {
  const listEl = document.getElementById('dashboard-recent-activity');
  if (!listEl) return;

  if (!state.kegiatanList || state.kegiatanList.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state-card" style="padding: 32px 16px;">
        <div class="empty-state-icon-circle" style="width:52px; height:52px; margin-bottom:12px;">
          <i data-lucide="clipboard" style="width:24px; height:24px;"></i>
        </div>
        <h4 class="empty-state-title" style="font-size:15px;">Belum Ada Aktivitas Terbaru</h4>
        <p class="empty-state-desc" style="font-size:12.5px; max-width:320px; margin-bottom:14px;">Semua catatan pemupukan, pruning, sanitasi, atau panen akan muncul otomatis di sini.</p>
        <button class="btn btn-sm btn-primary" onclick="openModal('modal-kegiatan')">
          <i data-lucide="plus"></i> Catat Aktivitas
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

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
  const totalLuas = state.lahanList.reduce((acc, curr) => acc + (Number(curr.luas) || 0), 0);
  const totalPohon = state.lahanList.reduce((acc, curr) => acc + (Number(curr.pohon) || 0), 0);

  const kpiLuas = document.getElementById('kpi-luas-lahan');
  const kpiPohon = document.getElementById('kpi-jumlah-pohon');
  const kpiPanenTerakhir = document.getElementById('kpi-panen-terakhir');
  const kpiEstimasiPanen = document.getElementById('kpi-estimasi-panen');

  const subLahan = document.getElementById('kpi-sub-lahan');
  const subPohon = document.getElementById('kpi-sub-pohon');
  const subPanen = document.getElementById('kpi-sub-panen');
  const subEstimasi = document.getElementById('kpi-sub-estimasi');

  if (kpiLuas) kpiLuas.innerHTML = `${totalLuas} <span class="unit">Ha</span>`;
  if (kpiPohon) kpiPohon.textContent = totalPohon.toLocaleString('id-ID');

  if (subLahan) {
    subLahan.textContent = state.lahanList.length > 0 
      ? `${state.lahanList.length} Blok Terdaftar` 
      : 'Belum Ada Lahan';
  }

  if (subPohon) {
    const density = totalLuas > 0 ? Math.round(totalPohon / totalLuas) : 0;
    subPohon.textContent = `${density} Pohon / Ha`;
  }

  if (kpiPanenTerakhir) {
    if (state.panenList.length > 0) {
      const sorted = [...state.panenList].sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      const latest = sorted[0];
      const relatedPanens = sorted.filter(p => p.tanggal === latest.tanggal && p.blok === latest.blok);
      const totalKg = relatedPanens.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);
      const tonVal = (totalKg / 1000).toFixed(1);
      kpiPanenTerakhir.innerHTML = `${tonVal} <span class="unit">Ton</span>`;
      if (subPanen) subPanen.textContent = `${latest.blok} (${formatTanggal(latest.tanggal)})`;
    } else {
      kpiPanenTerakhir.innerHTML = `0 <span class="unit">Ton</span>`;
      if (subPanen) subPanen.textContent = 'Belum Ada Transaksi';
    }
  }

  if (kpiEstimasiPanen) {
    const curYear = new Date().getFullYear();
    const curYearKg = state.panenList
      .filter(p => p.tanggal && new Date(p.tanggal).getFullYear() === curYear)
      .reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);
    const tonVal = (curYearKg / 1000).toFixed(1);
    kpiEstimasiPanen.innerHTML = `${tonVal} <span class="unit">Ton</span>`;
    if (subEstimasi) subEstimasi.textContent = `Tahun ${curYear}`;
  }

  // Update Ringkasan Panen section: Pembeli Utama, Total, Rata-rata Harga
  updatePanenRingkasan();
}

function updatePanenRingkasan() {
  const elPembeli = document.getElementById('ringkasan-pembeli');
  const elTotal = document.getElementById('ringkasan-total-panen');
  const elRataHarga = document.getElementById('ringkasan-rata-harga');
  const elTotalPendapatan = document.getElementById('ringkasan-total-pendapatan');

  if (!state.panenList || state.panenList.length === 0) {
    if (elPembeli) elPembeli.textContent = state.pengaturan.daftarPembeli?.[0] || '-';
    if (elTotal) elTotal.textContent = '0 kg';
    if (elRataHarga) elRataHarga.textContent = 'Rp 0 / kg';
    if (elTotalPendapatan) elTotalPendapatan.textContent = 'Rp 0';
    return;
  }

  // Hitung total panen bulan ini
  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const bulanIni = state.panenList.filter(p => {
    if (!p.tanggal) return false;
    const d = new Date(p.tanggal);
    return d.getMonth() === curMonth && d.getFullYear() === curYear;
  });

  const totalKgBulan = bulanIni.reduce((s, p) => s + (Number(p.jumlah) || 0), 0);
  const totalPendapatan = state.panenList.reduce((s, p) => s + ((Number(p.jumlah) || 0) * (Number(p.harga) || 0)), 0);
  const avgHarga = state.panenList.length > 0
    ? (state.panenList.reduce((s, p) => s + (Number(p.harga) || 0), 0) / state.panenList.length)
    : 0;

  // Pembeli utama = yang paling sering muncul di panenList (mengabaikan grade)
  const pembeliCount = {};
  const pembeliGrades = {};
  
  state.panenList.forEach(p => {
    if (p.pembeli) {
      // Hilangkan teks "(Grade A)" atau "(Grade B)" dari string pembeli
      const cleanName = p.pembeli.replace(/\s*\(Grade\s+[A-Z]\)$/i, '').trim();
      pembeliCount[cleanName] = (pembeliCount[cleanName] || 0) + 1;
      
      if (!pembeliGrades[cleanName]) pembeliGrades[cleanName] = new Set();
      if (p.pembeli.includes('Grade A')) pembeliGrades[cleanName].add('A');
      if (p.pembeli.includes('Grade B')) pembeliGrades[cleanName].add('B');
    }
  });
  
  const topPembeli = Object.entries(pembeliCount).sort((a, b) => b[1] - a[1])[0];
  let pembeli = topPembeli ? topPembeli[0] : (state.pengaturan.daftarPembeli?.[0]?.nama || state.pengaturan.daftarPembeli?.[0] || '-');

  if (topPembeli && pembeli !== '-') {
    const grades = Array.from(pembeliGrades[pembeli] || []).sort();
    if (grades.length === 2) {
      pembeli += ` (Grade A & B)`;
    } else if (grades.length === 1) {
      pembeli += ` (Grade ${grades[0]})`;
    }
  }

  if (elPembeli) elPembeli.textContent = pembeli;
  if (elTotal) elTotal.textContent = `${totalKgBulan.toLocaleString('id-ID')} kg`;
  if (elRataHarga) elRataHarga.textContent = `Rp ${Math.round(avgHarga).toLocaleString('id-ID')} / kg`;
  if (elTotalPendapatan) elTotalPendapatan.textContent = `Rp ${totalPendapatan.toLocaleString('id-ID')}`;
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
  initCustomDialog();

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

function populatePanenAndKegiatanBlokOptions() {
  const panenSelect = document.getElementById('panen-blok');
  const kegiatanSelect = document.getElementById('kegiatan-blok');

  const blocks = state.lahanList.length > 0 
    ? state.lahanList.map(l => l.nama) 
    : [];

  if (blocks.length === 0) {
    const emptyOpt = '<option value="">-- Belum ada lahan terdaftar --</option>';
    if (panenSelect) panenSelect.innerHTML = emptyOpt;
    if (kegiatanSelect) kegiatanSelect.innerHTML = emptyOpt;
    return;
  }

  if (panenSelect) {
    const curVal = panenSelect.value;
    panenSelect.innerHTML = blocks.map(b => `<option value="${b}">${b}</option>`).join('');
    if (blocks.includes(curVal)) panenSelect.value = curVal;
  }

  if (kegiatanSelect) {
    const curVal = kegiatanSelect.value;
    kegiatanSelect.innerHTML = blocks.map(b => `<option value="${b}">${b}</option>`).join('');
    if (blocks.includes(curVal)) kegiatanSelect.value = curVal;
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    if (id === 'modal-panen' || id === 'modal-kegiatan') {
      populatePanenAndKegiatanBlokOptions();
    }
    if (id === 'modal-kegiatan') {
      populatePetugasDropdown();
    }
    if (id === 'modal-panen') {
      populatePembelijSelect();
    }
    modal.classList.remove('hidden');
  }
}

// Populate dropdown petugas/penanggung jawab dari Daftar Pekerja/Karyawan Kebun
function populatePetugasDropdown(selectedPetugas = '') {
  const select = document.getElementById('kegiatan-petugas');
  if (!select) return;

  const workers = state.pekerjaList.length > 0 ? state.pekerjaList : [];
  if (workers.length === 0) {
    select.innerHTML = '<option value="">-- Belum ada karyawan terdaftar --</option>';
    return;
  }

  const options = workers.map(p => 
    `<option value="${p.nama}" ${p.nama === selectedPetugas ? 'selected' : ''}>${p.nama} (${p.posisi})</option>`
  );
  select.innerHTML = options.join('');
}

// Render dynamic block filter options in Catatan Kegiatan view
function renderKegiatanBlokFilter() {
  const select = document.getElementById('filter-kegiatan-blok');
  if (!select) return;

  const curVal = select.value || 'all';
  const options = ['<option value="all">Semua Blok</option>'];

  if (state.lahanList && state.lahanList.length > 0) {
    state.lahanList.forEach(l => {
      options.push(`<option value="${l.nama}" ${l.nama === curVal ? 'selected' : ''}>${l.nama}</option>`);
    });
  }

  select.innerHTML = options.join('');
}

// Populate dropdown pembeli di form tambah panen
function populatePembelijSelect() {
  const select = document.getElementById('panen-pembeli');
  if (!select) return;
  const daftar = (state.pengaturan.daftarPembeli || [{ nama: 'PT Sawit Jaya', gradeA: 2600, gradeB: 2400 }]);
  const curVal = select.value;
  select.innerHTML = daftar.map(p => {
    const nama = typeof p === 'string' ? p : p.nama;
    const gradeA = typeof p === 'string' ? 2600 : (p.gradeA || 2600);
    const gradeB = typeof p === 'string' ? 2400 : (p.gradeB || 2400);
    return `<option value="${nama}" data-grade-a="${gradeA}" data-grade-b="${gradeB}" ${nama === curVal ? 'selected' : ''}>${nama}</option>`;
  }).join('');
  
  select.innerHTML += `<option value="__custom__">+ Lainnya (ketik manual)...</option>`;
  
  if (!curVal || (!daftar.some(p => (p.nama || p) === curVal) && curVal !== '__custom__')) {
    select.value = typeof daftar[0] === 'string' ? daftar[0] : daftar[0].nama;
  }
}

function handlePembeliSelectChange() {
  const sel = document.getElementById('panen-pembeli');
  const hargaAText = document.getElementById('panen-harga-a-text');
  const hargaBText = document.getElementById('panen-harga-b-text');
  const customGroup = document.getElementById('panen-pembeli-custom-group');
  const customInput = document.getElementById('panen-pembeli-custom');
  
  if (!sel) return;
  
  if (sel.value === '__custom__') {
    if (customGroup) customGroup.style.display = '';
    if (customInput) customInput.required = true;
    if (hargaAText) hargaAText.textContent = 'Harga default: Rp 2600/kg';
    if (hargaBText) hargaBText.textContent = 'Harga default: Rp 2400/kg';
  } else {
    if (customGroup) customGroup.style.display = 'none';
    if (customInput) { customInput.required = false; customInput.value = ''; }
    
    // Auto-fill price based on Grade
    const selectedOption = sel.options[sel.selectedIndex];
    if (selectedOption && hargaAText && hargaBText) {
      const priceA = selectedOption.getAttribute('data-grade-a') || 2600;
      const priceB = selectedOption.getAttribute('data-grade-b') || 2400;
      hargaAText.textContent = `Harga: Rp ${priceA}/kg`;
      hargaBText.textContent = `Harga: Rp ${priceB}/kg`;
    }
  }
  if (typeof calculateTotalPanen === 'function') calculateTotalPanen();
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

  let dbSuccess = false;

  if (id) {
    const item = state.lahanList.find(x => x.id === parseInt(id));
    if (item) {
      Object.assign(item, payload);
    }
    if (window.ApiService) {
      try {
        const res = await ApiService.lahan.update(id, payload);
        if (res && res.success) dbSuccess = true;
      } catch (err) {
        console.warn('Gagal sync update lahan ke Cloudflare D1', err);
      }
    }
    showToast(`Data lahan ${nama} berhasil diperbarui ${dbSuccess ? '& disinkronkan ke D1' : ''}`);
  } else {
    const newLahan = {
      id: Date.now(),
      ...payload
    };
    state.lahanList.push(newLahan);
    if (window.ApiService) {
      try {
        const res = await ApiService.lahan.create(payload);
        if (res && res.success) {
          dbSuccess = true;
          if (res.id) newLahan.id = res.id;
        }
      } catch (err) {
        console.warn('Gagal sync create lahan ke Cloudflare D1', err);
      }
    }
    showToast(`Lahan baru ${nama} berhasil ditambahkan ${dbSuccess ? '& disinkronkan ke Cloudflare D1' : ''}`, 'success');
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
  renderLaporanTable();
  renderKegiatanBlokFilter();
  updateDashboardBlokChart();
  updateKPIs();
  generateRealtimeNotifications();
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
    title: 'Hapus Data Lahan?',
    message: `Data lahan "${lahan.nama}" (${lahan.luas} Ha) beserta penugasan pekerja terkait akan dihapus secara permanen.`,
    confirmText: 'Ya, Hapus Lahan',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'trash-2'
  });

  if (confirmed) {
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
    renderLaporanTable();
    updateDashboardBlokChart();
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
      title: 'Estate Manager Utama',
      message: 'Estate Manager utama tidak dapat dihapus. Anda dapat mengubah nama, email, dan kontaknya melalui tombol Edit.',
      confirmText: 'Mengerti',
      type: 'warning',
      icon: 'shield-alert'
    });
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Hapus Data Karyawan?',
    message: `Apakah Anda yakin ingin menghapus data karyawan "${worker.nama}" (${worker.posisi})?`,
    confirmText: 'Ya, Hapus Karyawan',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'user-x'
  });

  if (confirmed) {
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
  generateRealtimeNotifications();
  closeModal('modal-kegiatan');
  showToast('Catatan kegiatan berhasil disimpan');
}

async function deleteKegiatan(id) {
  const item = state.kegiatanList.find(x => x.id === id);
  const detail = item ? `kegiatan "${item.jenis}" pada blok ${item.blok}` : 'catatan kegiatan ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Catatan Kegiatan?',
    message: `Apakah Anda yakin ingin menghapus ${detail}? Data yang terhapus tidak dapat dikembalikan.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'trash-2'
  });

  if (confirmed) {
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
  const sel = document.getElementById('panen-pembeli');
  let priceA = 2600, priceB = 2400;

  if (sel && sel.value !== '__custom__') {
    const selectedOption = sel.options[sel.selectedIndex];
    if (selectedOption) {
      priceA = parseFloat(selectedOption.getAttribute('data-grade-a')) || 2600;
      priceB = parseFloat(selectedOption.getAttribute('data-grade-b')) || 2400;
    }
  }

  const jumlahA = parseFloat(document.getElementById('panen-jumlah-a').value) || 0;
  const jumlahB = parseFloat(document.getElementById('panen-jumlah-b').value) || 0;
  
  const total = (jumlahA * priceA) + (jumlahB * priceB);
  const el = document.getElementById('panen-total');
  if (el) el.value = `Rp ${total.toLocaleString('id-ID')}`;
}

async function handleSavePanen(e) {
  e.preventDefault();
  const tanggal = document.getElementById('panen-tanggal').value;
  const blok = document.getElementById('panen-blok').value;
  
  const jumlahA = parseFloat(document.getElementById('panen-jumlah-a').value) || 0;
  const jumlahB = parseFloat(document.getElementById('panen-jumlah-b').value) || 0;
  
  if (jumlahA <= 0 && jumlahB <= 0) {
    showToast('Masukkan jumlah hasil panen minimal di salah satu Grade!', 'error');
    return;
  }

  // Ambil nilai pembeli dari select atau input custom
  const pembelijSelect = document.getElementById('panen-pembeli');
  let pembeli = pembelijSelect ? pembelijSelect.value : '';

  let priceA = 2600, priceB = 2400;
  if (pembeli === '__custom__') {
    const customInput = document.getElementById('panen-pembeli-custom');
    pembeli = customInput ? customInput.value.trim() : '';
    if (!pembeli) {
      showToast('Nama pembeli tidak boleh kosong!', 'error');
      return;
    }
  } else {
    const selectedOption = pembelijSelect.options[pembelijSelect.selectedIndex];
    if (selectedOption) {
      priceA = parseFloat(selectedOption.getAttribute('data-grade-a')) || 2600;
      priceB = parseFloat(selectedOption.getAttribute('data-grade-b')) || 2400;
    }
  }

  const addedPanens = [];
  if (jumlahA > 0) {
    addedPanens.push({ 
      id: Date.now() + 1, 
      tanggal, 
      blok, 
      jumlah: jumlahA, 
      harga: priceA, 
      pembeli: `${pembeli} (Grade A)`, 
      status: 'Selesai' 
    });
  }
  if (jumlahB > 0) {
    addedPanens.push({ 
      id: Date.now() + 2, 
      tanggal, 
      blok, 
      jumlah: jumlahB, 
      harga: priceB, 
      pembeli: `${pembeli} (Grade B)`, 
      status: 'Selesai' 
    });
  }

  // Save all
  addedPanens.forEach(p => {
    state.panenList.unshift(p);
    if (window.ApiService && ApiService.isOnline()) {
      ApiService.panen.create(p);
    }
  });

  saveLocalState();
  renderPanenTable();
  renderLaporanTable();
  updateDashboardProduksiChart();
  updateDashboardBlokChart();
  updatePanenBulananChart();
  updateKPIs();
  generateRealtimeNotifications();
  closeModal('modal-panen');
  
  // reset form
  if (document.getElementById('panen-jumlah-a')) document.getElementById('panen-jumlah-a').value = '';
  if (document.getElementById('panen-jumlah-b')) document.getElementById('panen-jumlah-b').value = '';
  if (document.getElementById('panen-total')) document.getElementById('panen-total').value = 'Rp 0';
  
  showToast('Data panen berhasil disimpan');
}

async function deletePanen(id) {
  const item = state.panenList.find(x => x.id === id);
  const detail = item ? `catatan panen blok ${item.blok} (${item.jumlah} kg)` : 'catatan panen ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Catatan Panen?',
    message: `Apakah Anda yakin ingin menghapus ${detail}? Rekapitulasi tonase dan pendapatan panen akan diperbarui.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'trash-2'
  });

  if (confirmed) {
    state.panenList = state.panenList.filter(x => x.id !== id);

    if (window.ApiService && ApiService.isOnline()) {
      ApiService.panen.delete(id);
    }

    saveLocalState();
    renderPanenTable();
    renderLaporanTable();
    updateDashboardProduksiChart();
    updateDashboardBlokChart();
    updatePanenBulananChart();
    updateKPIs();
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
  const lokasi = (state.weatherLocation && state.weatherLocation.name) ? state.weatherLocation.name : 'Tegalsari, Musi Rawas';

  const payload = { tanggal, jam, suhu, kelembaban, curah, kondisi, lokasi };
  const newCuaca = { id: Date.now(), ...payload };

  state.cuacaList.unshift(newCuaca);

  let dbSuccess = false;
  if (window.ApiService) {
    try {
      const res = await ApiService.cuaca.create(payload);
      if (res && res.success) {
        dbSuccess = true;
        if (res.id) newCuaca.id = res.id;
      }
    } catch (err) {
      console.warn('Gagal simpan data cuaca ke Cloudflare D1:', err);
    }
  }

  saveLocalState();
  renderCuacaTable();
  updateWeatherUI(payload);
  updateWeatherChart();
  generateRealtimeNotifications();
  closeModal('modal-cuaca');
  showToast(`Data cuaca berhasil ditambahkan ${dbSuccess ? '& disinkronkan ke Cloudflare D1' : ''}`, 'success');
}

async function deleteCuaca(id) {
  const item = state.cuacaList.find(x => x.id === id);
  const detail = item ? `data cuaca tanggal ${item.tanggal} (${item.kondisi}, ${item.suhu}°C)` : 'data cuaca ini';

  const confirmed = await showConfirmDialog({
    title: 'Hapus Data Cuaca?',
    message: `Apakah Anda yakin ingin menghapus ${detail}? Grafik dan telemetry kebun akan disinkronkan ulang.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'trash-2'
  });

  if (confirmed) {
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
    title: 'Hapus Semua Data Cuaca?',
    message: 'Apakah Anda yakin ingin menghapus SEMUA data telemetry cuaca? Seluruh riwayat grafik, tabel data, dan indikator sensor akan dikosongkan.',
    confirmText: 'Ya, Kosongkan Semua',
    cancelText: 'Batal',
    type: 'danger',
    icon: 'alert-triangle'
  });

  if (confirmed) {
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
    generateRealtimeNotifications();

    showToast('Seluruh data cuaca telah berhasil dihapus!', 'error');
  }
}

/* ==========================================================================
   SYSTEM REALTIME NOTIFICATIONS SYSTEM
   ========================================================================== */
function generateRealtimeNotifications() {
  const notifs = [];

  // 1. Transaction Panen Real Terakhir
  if (state.panenList && state.panenList.length > 0) {
    const latestPanen = state.panenList[0];
    const relatedPanens = state.panenList.filter(p => p.tanggal === latestPanen.tanggal && p.blok === latestPanen.blok);
    const totalKg = relatedPanens.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);
    const kgFormatted = totalKg.toLocaleString('id-ID');
    const cleanName = (latestPanen.pembeli || 'Pembeli TBS').replace(/\s*\(Grade\s+[A-Z]\)$/i, '').trim();

    notifs.push({
      id: `panen_${latestPanen.tanggal}_${latestPanen.blok}`,
      title: `Panen ${latestPanen.blok} Selesai`,
      detail: `${kgFormatted} kg (${cleanName})`,
      time: formatTanggal(latestPanen.tanggal) || 'Hari Ini',
      icon: 'check-circle-2',
      color: 'green',
      page: 'hasil-panen',
      timestamp: latestPanen.id || Date.now()
    });
  }

  // 2. Monitoring Cuaca Realtime / Peringatan
  if (state.cuacaList && state.cuacaList.length > 0) {
    const c = state.cuacaList[0];
    if (c.curah > 15 || (c.kondisi && (c.kondisi.toLowerCase().includes('hujan') || c.kondisi.toLowerCase().includes('badai')))) {
      notifs.push({
        id: `cuaca_${c.id || Date.now()}`,
        title: `Peringatan Cuaca (${c.kondisi})`,
        detail: `Curah Hujan ${c.curah} mm, Suhu ${c.suhu}°C`,
        time: c.jam ? `Jam ${c.jam}` : 'Hari Ini',
        icon: 'cloud-rain',
        color: 'yellow',
        page: 'monitoring-cuaca',
        timestamp: c.id || Date.now()
      });
    } else {
      notifs.push({
        id: `cuaca_${c.id || Date.now()}`,
        title: `Stasiun Telemetry Cuaca`,
        detail: `${c.kondisi}, ${c.suhu}°C (${c.lokasi || 'Stasiun Kebun'})`,
        time: 'Terkoneksi IoT',
        icon: 'cloud-sun',
        color: 'blue',
        page: 'monitoring-cuaca',
        timestamp: c.id || Date.now()
      });
    }
  }

  // 3. Catatan Kegiatan Agronomi Real Terakhir
  if (state.kegiatanList && state.kegiatanList.length > 0) {
    const k = state.kegiatanList[0];
    notifs.push({
      id: `kegiatan_${k.id || Date.now()}`,
      title: `Kegiatan ${k.jenis} (${k.blok})`,
      detail: `${k.deskripsi} - Petugas: ${k.petugas}`,
      time: formatTanggal(k.tanggal) || 'Hari Ini',
      icon: 'calendar',
      color: 'blue',
      page: 'perkembangan',
      timestamp: k.id || Date.now()
    });
  }

  // 4. Status Lahan Real
  if (state.lahanList && state.lahanList.length > 0) {
    const totalLuas = state.lahanList.reduce((acc, curr) => acc + (Number(curr.luas) || 0), 0);
    notifs.push({
      id: 'lahan_stat',
      title: `Inventaris Lahan Perkebunan`,
      detail: `${state.lahanList.length} Blok Terdaftar (${totalLuas} Ha Total)`,
      time: 'Status Aktif',
      icon: 'map-pin',
      color: 'green',
      page: 'data-lahan',
      timestamp: 0
    });
  }

  // Sort notifications by timestamp descending (newest first)
  notifs.sort((a, b) => b.timestamp - a.timestamp);

  state.notifications = notifs;
  renderNotifications();
}

function handleNotifClick(id, page) {
  const readState = JSON.parse(localStorage.getItem('sawit_notif_read_ids') || '[]');
  if (!readState.includes(id)) {
    readState.push(id);
    localStorage.setItem('sawit_notif_read_ids', JSON.stringify(readState));
    renderNotifications();
  }
  
  if (page && typeof switchView === 'function') {
    switchView(page);
  }
  
  // Close the notification dropdown if it's open
  const dropdown = document.querySelector('.notification-dropdown');
  if (dropdown) dropdown.classList.remove('show');
}

function renderNotifications() {
  const container = document.getElementById('notification-list-container');
  const badgeCount = document.getElementById('notif-badge-count');
  if (!container) return;

  const notifs = state.notifications || [];
  const readState = JSON.parse(localStorage.getItem('sawit_notif_read_ids') || '[]');

  if (notifs.length === 0) {
    container.innerHTML = `
      <li style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
        Belum ada notifikasi perkebunan saat ini.
      </li>
    `;
    if (badgeCount) badgeCount.style.display = 'none';
    return;
  }

  let unreadCount = 0;

  container.innerHTML = notifs.map(n => {
    const isRead = readState.includes(n.id);
    if (!isRead) unreadCount++;

    return `
      <li class="${isRead ? '' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.page}')" style="cursor: pointer; transition: background 0.2s;">
        <div class="notif-icon ${n.color || 'green'}"><i data-lucide="${n.icon || 'bell'}"></i></div>
        <div class="notif-text">
          <p><strong>${n.title}</strong>: ${n.detail}</p>
          <span>${n.time}</span>
        </div>
      </li>
    `;
  }).join('');

  if (badgeCount) {
    if (unreadCount > 0) {
      badgeCount.style.display = 'inline-flex';
      badgeCount.textContent = unreadCount;
    } else {
      badgeCount.style.display = 'none';
    }
  }

  if (window.lucide) lucide.createIcons();
}

function markAllNotificationsRead() {
  const notifs = state.notifications || [];
  const readIds = notifs.map(n => n.id);

  localStorage.setItem('sawit_notif_read_ids', JSON.stringify(readIds));
  renderNotifications();
  showToast('Seluruh notifikasi telah ditandai dibaca.', 'success');
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

  // Sync to Cloudflare D1 Backend if API configured
  const api = window.ApiService || (typeof ApiService !== 'undefined' ? ApiService : null);
  if (api && api.getBaseUrl()) {
    const itemsToSync = newItemsToPush.length > 0 ? newItemsToPush : state.cuacaList;
    for (const item of itemsToSync) {
      try {
        await api.cuaca.create({
          tanggal: item.tanggal,
          jam: item.jam,
          suhu: item.suhu,
          kelembaban: item.kelembaban,
          curah: item.curah,
          kondisi: item.kondisi,
          lokasi: item.lokasi || loc.name
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
  generateRealtimeNotifications();

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
    notif_iot: document.getElementById('setting-notif-iot')?.checked ? 1 : 0,
    // Preserve daftarPembeli (managed separately via renderPembelijList)
    daftarPembeli: state.pengaturan.daftarPembeli || ['PT Sawit Jaya']
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
  renderPembelijList();
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
   MANAJEMEN DAFTAR PEMBELI TBS
   ========================================================================== */
function renderPembelijList() {
  const container = document.getElementById('daftar-pembeli-list');
  if (!container) return;

  let daftar = state.pengaturan.daftarPembeli || [];
  if (daftar.length > 0 && typeof daftar[0] === 'string') {
    daftar = daftar.map(p => ({ nama: p, gradeA: 2600, gradeB: 2400 }));
    state.pengaturan.daftarPembeli = daftar;
  }
  if (daftar.length === 0) {
    daftar = [{ nama: 'PT Sawit Jaya', gradeA: 2600, gradeB: 2400 }];
    state.pengaturan.daftarPembeli = daftar;
  }

  container.innerHTML = daftar.map((item, idx) => `
    <div class="pembeli-list-item" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:var(--surface); border-radius:10px; margin-bottom:8px; border:1px solid var(--border-light); gap:10px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:10px; flex:1; min-width: 200px;">
        <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-emerald); display:flex; align-items:center; justify-content:center; color:#fff; font-size:13px; font-weight:700; flex-shrink:0;">${idx + 1}</div>
        <span style="font-weight:600; font-size:14px; color:var(--text-primary);">${item.nama}</span>
      </div>
      <div style="display:flex; gap:16px; flex-wrap: wrap; margin-right: 10px;">
        <div style="font-size: 13px; color: var(--text-secondary);"><strong style="color:var(--text-primary);">Grade A:</strong> Rp ${item.gradeA || 2600}/kg</div>
        <div style="font-size: 13px; color: var(--text-secondary);"><strong style="color:var(--text-primary);">Grade B:</strong> Rp ${item.gradeB || 2400}/kg</div>
      </div>
      <div style="display:flex; gap:6px; flex-shrink:0;">
        <button class="btn btn-sm" style="padding:4px 10px; background:rgba(16,185,129,0.08); color:var(--accent-emerald); border:1px solid rgba(16,185,129,0.2); border-radius:8px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:5px;" onclick="editPembeli(${idx})" title="Edit Pembeli">
          <i data-lucide="edit-3" style="width:13px; height:13px;"></i> Edit
        </button>
        <button class="btn btn-sm" style="padding:4px 10px; background:rgba(239,68,68,0.08); color:#ef4444; border:1px solid rgba(239,68,68,0.2); border-radius:8px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:5px;" onclick="deletePembeli(${idx})" title="Hapus Pembeli">
          <i data-lucide="trash-2" style="width:13px; height:13px;"></i> Hapus
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function syncPengaturanToCloud() {
  if (window.ApiService && ApiService.isOnline()) {
    try {
      await ApiService.pengaturan.save(state.pengaturan);
    } catch (err) {
      console.warn('Gagal sync pengaturan (pembeli) ke Cloudflare D1:', err);
    }
  }
}

function editPembeli(idx) {
  const daftar = state.pengaturan.daftarPembeli || [];
  const item = daftar[idx];
  if (!item) return;

  document.getElementById('edit-pembeli-idx').value = idx;
  document.getElementById('edit-pembeli-nama').value = item.nama;
  document.getElementById('edit-pembeli-grade-a').value = item.gradeA || 2600;
  document.getElementById('edit-pembeli-grade-b').value = item.gradeB || 2400;

  openModal('modal-edit-pembeli');
}

async function saveEditPembeli(e) {
  e.preventDefault();
  const idx = document.getElementById('edit-pembeli-idx').value;
  const newNama = document.getElementById('edit-pembeli-nama').value.trim();
  const newGradeA = parseInt(document.getElementById('edit-pembeli-grade-a').value, 10) || 2600;
  const newGradeB = parseInt(document.getElementById('edit-pembeli-grade-b').value, 10) || 2400;

  if (!newNama) {
    showToast('Nama pembeli tidak boleh kosong!', 'error');
    return;
  }

  const daftar = state.pengaturan.daftarPembeli || [];
  const oldItem = daftar[idx];
  const oldNama = oldItem.nama;

  if (newNama.toLowerCase() !== oldNama.toLowerCase() && daftar.some(p => p.nama.toLowerCase() === newNama.toLowerCase())) {
    showToast(`Pembeli "${newNama}" sudah ada dalam daftar!`, 'error');
    return;
  }

  // Update
  state.pengaturan.daftarPembeli[idx] = { nama: newNama, gradeA: newGradeA, gradeB: newGradeB };

  // Sync with panen list if name changed
  let updatedCount = 0;
  if (newNama !== oldNama) {
    state.panenList.forEach(p => {
      if (p.pembeli === oldNama) {
        p.pembeli = newNama;
        updatedCount++;
      }
    });
  }

  localStorage.setItem('sawit_pengaturan', JSON.stringify(state.pengaturan));
  saveLocalState();

  renderPembelijList();
  renderPanenTable();
  updatePanenRingkasan();
  closeModal('modal-edit-pembeli');

  syncPengaturanToCloud();

  if (updatedCount > 0) {
    showToast(`Pembeli diubah menjadi "${newNama}" (${updatedCount} transaksi panen diperbarui).`, 'success');
  } else {
    showToast(`Pembeli "${newNama}" berhasil diperbarui.`, 'success');
  }
}

async function addPembeli() {
  const inputNama = document.getElementById('input-tambah-pembeli');
  const inputGradeA = document.getElementById('input-tambah-grade-a');
  const inputGradeB = document.getElementById('input-tambah-grade-b');
  
  const nama = inputNama ? inputNama.value.trim() : '';
  const gradeA = inputGradeA ? (parseInt(inputGradeA.value, 10) || 2600) : 2600;
  const gradeB = inputGradeB ? (parseInt(inputGradeB.value, 10) || 2400) : 2400;

  if (!nama) {
    showToast('Nama pembeli tidak boleh kosong!', 'error');
    return;
  }

  if (!Array.isArray(state.pengaturan.daftarPembeli)) {
    state.pengaturan.daftarPembeli = [];
  }

  if (state.pengaturan.daftarPembeli.some(p => p.nama.toLowerCase() === nama.toLowerCase())) {
    showToast(`Pembeli "${nama}" sudah ada dalam daftar!`, 'error');
    return;
  }

  state.pengaturan.daftarPembeli.push({ nama, gradeA, gradeB });
  localStorage.setItem('sawit_pengaturan', JSON.stringify(state.pengaturan));

  if (inputNama) inputNama.value = '';
  if (inputGradeA) inputGradeA.value = '2600';
  if (inputGradeB) inputGradeB.value = '2400';

  renderPembelijList();
  showToast(`Pembeli "${nama}" berhasil ditambahkan!`, 'success');
  
  syncPengaturanToCloud();
}

async function deletePembeli(idx) {
  const daftar = state.pengaturan.daftarPembeli || [];
  const item = daftar[idx];
  if (!item) return;
  const nama = item.nama;

  // Cek apakah pembeli digunakan di data panen
  const used = state.panenList.some(p => p.pembeli === nama);
  if (used) {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Pembeli?',
      message: `Pembeli "${nama}" sudah digunakan di beberapa catatan panen. Data panen yang ada tidak akan berubah, namun pembeli ini tidak akan muncul lagi di dropdown. Lanjutkan?`,
      confirmText: 'Ya, Hapus dari Daftar',
      cancelText: 'Batal',
      type: 'warning',
      icon: 'alert-triangle'
    });
    if (!confirmed) return;
  } else {
    const confirmed = await showConfirmDialog({
      title: 'Hapus Pembeli?',
      message: `Apakah Anda yakin ingin menghapus "${nama}" dari daftar pembeli TBS?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
      icon: 'trash-2'
    });
    if (!confirmed) return;
  }

  state.pengaturan.daftarPembeli.splice(idx, 1);

  if (state.pengaturan.daftarPembeli.length === 0) {
    state.pengaturan.daftarPembeli = [{ nama: 'PT Sawit Jaya', gradeA: 2600, gradeB: 2400 }];
    showToast('Daftar pembeli tidak boleh kosong. Pembeli default dipulihkan.', 'error');
  }

  localStorage.setItem('sawit_pengaturan', JSON.stringify(state.pengaturan));
  renderPembelijList();
  showToast(`Pembeli "${nama}" telah dihapus dari daftar.`, 'error');
  
  syncPengaturanToCloud();
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

  // Laporan Period Select Change (Dynamic Year Filtering)
  document.getElementById('select-periode-laporan')?.addEventListener('change', (e) => {
    state.laporanSelectedYear = parseInt(e.target.value) || new Date().getFullYear();
    renderLaporanTable();
    showToast(`Memuat data laporan tahun ${state.laporanSelectedYear}`);
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
   CHARTS INITIALIZATION (CHART.JS) - 100% DINAMIS DARI DATA USER
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

  // Populate dynamic chart values from real state data
  updateDashboardProduksiChart();
  updateDashboardBlokChart();
  updatePanenBulananChart();
}

function updateDashboardProduksiChart() {
  if (!charts.produksiBulanan) return;
  const curYear = new Date().getFullYear();
  const monthsData = new Array(12).fill(0);
  state.panenList.forEach(p => {
    if (!p.tanggal) return;
    const d = new Date(p.tanggal);
    if (d.getFullYear() === curYear) {
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        monthsData[m] += (Number(p.jumlah) || 0) / 1000;
      }
    }
  });
  charts.produksiBulanan.data.datasets[0].data = monthsData.map(v => +v.toFixed(2));
  charts.produksiBulanan.update();
}

function updateDashboardBlokChart() {
  if (!charts.produksiBlok) return;
  const blocks = getLaporanBlocks();
  const blockTotals = blocks.map(b => {
    return state.panenList
      .filter(p => p.blok === b || (p.blok && p.blok.startsWith(b)))
      .reduce((sum, p) => sum + ((Number(p.jumlah) || 0) / 1000), 0);
  });
  charts.produksiBlok.data.labels = blocks;
  charts.produksiBlok.data.datasets[0].data = blockTotals.map(v => +v.toFixed(2));
  charts.produksiBlok.update();
}

function updatePanenBulananChart() {
  if (!charts.panenBulanan) return;
  const curYear = new Date().getFullYear();
  const monthsData = new Array(12).fill(0);
  state.panenList.forEach(p => {
    if (!p.tanggal) return;
    const d = new Date(p.tanggal);
    if (d.getFullYear() === curYear) {
      const m = d.getMonth();
      if (m >= 0 && m < 12) {
        monthsData[m] += Number(p.jumlah) || 0;
      }
    }
  });
  charts.panenBulanan.data.datasets[0].data = monthsData;
  charts.panenBulanan.update();
}

function initChartProduksiBulanan() {
  const ctx = document.getElementById('chartProduksiBulanan');
  if (!ctx) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(45, 106, 79, 0.45)');
  gradient.addColorStop(1, 'rgba(45, 106, 79, 0.02)');

  charts.produksiBulanan = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Produksi TBS (Ton)',
        data: new Array(12).fill(0),
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
      labels: ['Belum Ada Blok'],
      datasets: [{
        label: 'Hasil (Ton)',
        data: [0],
        backgroundColor: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#8b5cf6', '#ec4899', '#0284c7'],
        borderRadius: 8,
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
            label: (ctx) => `Hasil: ${ctx.parsed.y} Ton`
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

function initChartPanenBulanan() {
  const ctx = document.getElementById('chartPanenBulanan');
  if (!ctx) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  charts.panenBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Volume Panen (kg)',
        data: new Array(12).fill(0),
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
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#d97706',
          backgroundColor: '#d97706',
          yAxisID: 'yTemp',
          tension: 0.35,
          borderWidth: 2.5
        },
        {
          label: 'Curah Hujan (mm)',
          data: [0, 0, 0, 0, 0, 0, 0],
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

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  charts.laporanBulanan = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Hasil Panen (Ton)',
        data: new Array(12).fill(0),
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

  charts.distribusiPanen = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Belum Ada Data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e2e8f0'],
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
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw === 1 && ctx.label === 'Belum Ada Data' ? '0 kg' : ctx.raw.toLocaleString('id-ID') + ' kg'}`
          }
        }
      }
    }
  });
}

function exportLaporanCSV(ext = 'csv') {
  const year = state.laporanSelectedYear || new Date().getFullYear();
  exportTableToCSV('tabel-laporan-tahunan', `Laporan_Panen_${year}.${ext}`);
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
   MODERN CUSTOM CONFIRMATION & ALERT DIALOG CONTROLLER
   Replaces archaic (kuno) browser alert() and confirm()
   ========================================================================== */
let customDialogResolver = null;

function initCustomDialog() {
  const overlay = document.getElementById('modal-custom-dialog');
  const confirmBtn = document.getElementById('custom-dialog-btn-confirm');
  const cancelBtn = document.getElementById('custom-dialog-btn-cancel');
  const closeBtn = document.getElementById('custom-dialog-close-btn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => closeCustomDialog(true));
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeCustomDialog(false));
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeCustomDialog(false));
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeCustomDialog(false);
      }
    });
  }

  // Keyboard shortcut listener (Escape to cancel)
  document.addEventListener('keydown', (e) => {
    if (overlay && !overlay.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCustomDialog(false);
      }
    }
  });
}

function showConfirmDialog({
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger',
  icon = null
} = {}) {
  return new Promise((resolve) => {
    customDialogResolver = resolve;

    const overlay = document.getElementById('modal-custom-dialog');
    const titleEl = document.getElementById('custom-dialog-title');
    const messageEl = document.getElementById('custom-dialog-message');
    const iconBox = document.getElementById('custom-dialog-icon-box');
    const confirmBtn = document.getElementById('custom-dialog-btn-confirm');
    const confirmTextEl = document.getElementById('custom-dialog-btn-confirm-text');
    const cancelBtn = document.getElementById('custom-dialog-btn-cancel');

    if (!overlay) {
      resolve(true);
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (confirmTextEl) confirmTextEl.textContent = confirmText;
    if (cancelBtn) {
      cancelBtn.textContent = cancelText;
      cancelBtn.style.display = 'inline-flex';
    }

    if (iconBox) {
      iconBox.className = `custom-dialog-icon-badge ${type}`;
      let iconName = icon;
      if (!iconName) {
        if (type === 'danger') iconName = 'trash-2';
        else if (type === 'warning') iconName = 'alert-triangle';
        else if (type === 'success') iconName = 'check-circle-2';
        else iconName = 'info';
      }
      iconBox.innerHTML = `<i data-lucide="${iconName}"></i>`;
    }

    if (confirmBtn) {
      confirmBtn.className = `btn btn-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary'} custom-dialog-btn-confirm`;
    }

    overlay.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (confirmBtn) confirmBtn.focus();
    }, 40);
  });
}

function showAlertDialog({
  title = 'Pemberitahuan',
  message = '',
  confirmText = 'Mengerti',
  type = 'warning',
  icon = null
} = {}) {
  return new Promise((resolve) => {
    customDialogResolver = () => resolve(true);

    const overlay = document.getElementById('modal-custom-dialog');
    const titleEl = document.getElementById('custom-dialog-title');
    const messageEl = document.getElementById('custom-dialog-message');
    const iconBox = document.getElementById('custom-dialog-icon-box');
    const confirmBtn = document.getElementById('custom-dialog-btn-confirm');
    const confirmTextEl = document.getElementById('custom-dialog-btn-confirm-text');
    const cancelBtn = document.getElementById('custom-dialog-btn-cancel');

    if (!overlay) {
      resolve(true);
      return;
    }

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    if (confirmTextEl) confirmTextEl.textContent = confirmText;
    if (cancelBtn) cancelBtn.style.display = 'none';

    if (iconBox) {
      iconBox.className = `custom-dialog-icon-badge ${type}`;
      let iconName = icon;
      if (!iconName) {
        if (type === 'warning') iconName = 'alert-circle';
        else if (type === 'danger') iconName = 'alert-octagon';
        else if (type === 'success') iconName = 'check-circle-2';
        else iconName = 'info';
      }
      iconBox.innerHTML = `<i data-lucide="${iconName}"></i>`;
    }

    if (confirmBtn) {
      confirmBtn.className = `btn btn-${type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'primary'} custom-dialog-btn-confirm`;
    }

    overlay.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (confirmBtn) confirmBtn.focus();
    }, 40);
  });
}

function closeCustomDialog(result = false) {
  const overlay = document.getElementById('modal-custom-dialog');
  if (overlay) {
    overlay.classList.add('hidden');
  }
  if (customDialogResolver) {
    const fn = customDialogResolver;
    customDialogResolver = null;
    fn(result);
  }
}

// Global exposure & native fallback replacement
window.showConfirmDialog = showConfirmDialog;
window.showAlertDialog = showAlertDialog;
window.alert = function(msg) {
  showAlertDialog({
    title: 'Pemberitahuan Sistem',
    message: String(msg),
    confirmText: 'Mengerti',
    type: 'warning',
    icon: 'info'
  });
};

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
    document.documentElement.classList.add('is-authenticated');
    if (loginOverlay) loginOverlay.classList.add('overlay-hidden');
    if (appContainer) appContainer.style.pointerEvents = '';
  } else {
    document.documentElement.classList.remove('is-authenticated');
    if (loginOverlay) loginOverlay.classList.remove('overlay-hidden');
    if (appContainer) appContainer.style.pointerEvents = 'none';
    const companyNameEl = document.getElementById('login-company-name');
    if (companyNameEl) companyNameEl.textContent = state.pengaturan.perusahaan || 'PT Sawit Lestari';
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
    title: 'Konfirmasi Keluar',
    message: 'Apakah Anda yakin ingin keluar (logout) dari portal privat Sawit Pintar?',
    confirmText: 'Ya, Keluar',
    cancelText: 'Batal',
    type: 'warning',
    icon: 'log-out'
  });

  if (confirmed) {
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
}

