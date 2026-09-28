/**
 * SAWIT PINTAR - API SERVICE LAYER (CLOUDFLARE D1 ADAPTER)
 * Seamlessly connects Frontend (deployed on Vercel) to Backend API (Cloudflare Worker & D1).
 * Features:
 * - Automatic online/offline fallback (local storage fallback if Worker URL is not yet deployed)
 * - Configurable Cloudflare Worker Endpoint via localStorage or Settings
 */

const ApiService = (() => {
  // Key for storing custom Cloudflare Worker API endpoint
  const CONFIG_KEY = 'sawit_api_base_url';

  // Default API URL (dapat diisi URL Cloudflare Worker Anda, misal: https://sawit-pintar-api.your-subdomain.workers.dev)
  let baseUrl = localStorage.getItem(CONFIG_KEY) || '';

  // Status tracker
  let isConnectedToCloud = false;

  function setBaseUrl(url) {
    baseUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem(CONFIG_KEY, baseUrl);
    return checkConnection();
  }

  function getBaseUrl() {
    return baseUrl;
  }

  async function checkConnection() {
    if (!baseUrl) {
      isConnectedToCloud = false;
      updateSyncBadge(false);
      return false;
    }

    try {
      const options = {};
      if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        options.signal = AbortSignal.timeout(3500);
      }
      const res = await fetch(`${baseUrl}/api`, options);
      const data = await res.json();
      isConnectedToCloud = (data.status === 'ok');
      updateSyncBadge(isConnectedToCloud);
      return isConnectedToCloud;
    } catch (e) {
      isConnectedToCloud = false;
      updateSyncBadge(false);
      return false;
    }
  }

  function updateSyncBadge(online) {
    const statusEl = document.querySelector('.system-status');
    if (statusEl) {
      if (online) {
        statusEl.innerHTML = `
          <i data-lucide="cloud" style="color:#10b981; width:14px; height:14px;"></i>
          <span style="color:#bbf7d0;">Cloudflare D1 • Terhubung</span>
        `;
      } else {
        statusEl.innerHTML = `
          <i data-lucide="hard-drive" style="color:#f59e0b; width:14px; height:14px;"></i>
          <span>Lokal / Standalone Mode</span>
        `;
      }
      if (window.lucide) lucide.createIcons();
    }
  }

  // Generic Request Helper
  async function request(endpoint, options = {}) {
    if (!baseUrl) return null;

    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn(`[Cloudflare API Error] ${endpoint}:`, err);
      return null;
    }
  }

  // --- API METHODS ---

  // 1. Data Lahan
  async function getLahan() {
    const res = await request('/api/lahan');
    return res?.success ? res.data : null;
  }

  async function createLahan(data) {
    return await request('/api/lahan', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function updateLahan(id, data) {
    return await request(`/api/lahan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async function deleteLahan(id) {
    return await request(`/api/lahan/${id}`, { method: 'DELETE' });
  }

  // 2. Manajemen Pekerja
  async function getPekerja() {
    const res = await request('/api/pekerja');
    return res?.success ? res.data : null;
  }

  async function savePekerja(data, isEdit = false) {
    const endpoint = isEdit ? `/api/pekerja/${encodeURIComponent(data.id)}` : '/api/pekerja';
    const method = isEdit ? 'PUT' : 'POST';
    return await request(endpoint, {
      method,
      body: JSON.stringify(data)
    });
  }

  async function deletePekerja(id) {
    return await request(`/api/pekerja/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  // 3. Catatan Kegiatan
  async function getKegiatan() {
    const res = await request('/api/kegiatan');
    return res?.success ? res.data : null;
  }

  async function createKegiatan(data) {
    return await request('/api/kegiatan', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function deleteKegiatan(id) {
    return await request(`/api/kegiatan/${id}`, { method: 'DELETE' });
  }

  // 4. Hasil Panen
  async function getPanen() {
    const res = await request('/api/panen');
    return res?.success ? res.data : null;
  }

  async function createPanen(data) {
    return await request('/api/panen', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function deletePanen(id) {
    return await request(`/api/panen/${id}`, { method: 'DELETE' });
  }

  // 5. Cuaca
  async function getCuaca() {
    const res = await request('/api/cuaca');
    return res?.success ? res.data : null;
  }

  async function createCuaca(data) {
    return await request('/api/cuaca', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async function deleteCuaca(id) {
    return await request(`/api/cuaca/${id}`, { method: 'DELETE' });
  }

  // 6. Laporan Tahunan
  async function getLaporan(tahun = '2023') {
    const res = await request(`/api/laporan?tahun=${tahun}`);
    return res?.success ? res.data : null;
  }

  return {
    setBaseUrl,
    getBaseUrl,
    checkConnection,
    isOnline: () => isConnectedToCloud,
    lahan: { get: getLahan, create: createLahan, update: updateLahan, delete: deleteLahan },
    pekerja: { get: getPekerja, save: savePekerja, delete: deletePekerja },
    kegiatan: { get: getKegiatan, create: createKegiatan, delete: deleteKegiatan },
    panen: { get: getPanen, create: createPanen, delete: deletePanen },
    cuaca: { get: getCuaca, create: createCuaca, delete: deleteCuaca },
    laporan: { get: getLaporan }
  };
})();

window.ApiService = ApiService;
