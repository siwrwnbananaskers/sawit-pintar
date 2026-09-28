/**
 * SAWIT PINTAR - BACKEND REST API
 * Powered by Cloudflare Workers & Cloudflare D1 (Serverless SQLite)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS Headers for Vercel and Local Development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const db = env.DB;
      if (!db) {
        return jsonResponse({ error: 'D1 Database binding (env.DB) is not configured' }, 500, corsHeaders);
      }

      // Root ping
      if (path === '/' || path === '/api') {
        return jsonResponse({
          status: 'ok',
          service: 'Sawit Pintar API',
          database: 'Cloudflare D1',
          time: new Date().toISOString()
        }, 200, corsHeaders);
      }

      // ======================================================================
      // 1. STATS / DASHBOARD KPIS
      // ======================================================================
      if (path === '/api/stats' && method === 'GET') {
        const lahanRes = await db.prepare('SELECT SUM(luas) as totalLuas, SUM(pohon) as totalPohon, COUNT(*) as totalBlok FROM lahan').first();
        const panenRes = await db.prepare('SELECT SUM(jumlah) as totalPanenKg, AVG(harga) as avgHarga FROM panen WHERE strftime("%Y-%m", tanggal) = strftime("%Y-%m", "now")').first();
        const cuacaRes = await db.prepare('SELECT * FROM cuaca ORDER BY tanggal DESC, jam DESC LIMIT 1').first();

        return jsonResponse({
          success: true,
          data: {
            totalLuas: lahanRes?.totalLuas || 168,
            totalPohon: lahanRes?.totalPohon || 8400,
            totalBlok: lahanRes?.totalBlok || 4,
            panenBulanIniKg: panenRes?.totalPanenKg || 8900,
            cuacaTerkini: cuacaRes || { suhu: 31, kelembaban: 81, curah: 45, kondisi: 'Cerah Berawan' }
          }
        }, 200, corsHeaders);
      }

      // ======================================================================
      // 2. DATA LAHAN ENDPOINTS
      // ======================================================================
      if (path === '/api/lahan') {
        if (method === 'GET') {
          const { results } = await db.prepare('SELECT * FROM lahan ORDER BY id ASC').all();
          return jsonResponse({ success: true, data: results }, 200, corsHeaders);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { nama, lokasi, luas, pohon, varietas, mandor, status } = body;

          const res = await db.prepare(
            'INSERT INTO lahan (nama, lokasi, luas, pohon, varietas, mandor, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(nama, lokasi, luas, pohon, varietas, mandor || '', status || 'Produktif').run();

          // Sync with worker if mandor specified
          if (mandor) {
            await db.prepare('UPDATE pekerja SET blok = ? WHERE nama = ?').bind(nama, mandor).run();
          }

          return jsonResponse({ success: true, id: res.meta.last_row_id, message: 'Lahan berhasil dibuat' }, 201, corsHeaders);
        }
      }

      if (path.startsWith('/api/lahan/')) {
        const id = path.split('/')[3];

        if (method === 'PUT') {
          const body = await request.json();
          const { nama, lokasi, luas, pohon, varietas, mandor, status } = body;

          await db.prepare(
            'UPDATE lahan SET nama = ?, lokasi = ?, luas = ?, pohon = ?, varietas = ?, mandor = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(nama, lokasi, luas, pohon, varietas, mandor || '', status, id).run();

          if (mandor) {
            await db.prepare('UPDATE pekerja SET blok = ? WHERE nama = ?').bind(nama, mandor).run();
          }

          return jsonResponse({ success: true, message: 'Lahan berhasil diperbarui' }, 200, corsHeaders);
        }

        if (method === 'DELETE') {
          await db.prepare('DELETE FROM lahan WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Lahan berhasil dihapus' }, 200, corsHeaders);
        }
      }

      // ======================================================================
      // 3. MANAJEMEN PEKERJA ENDPOINTS
      // ======================================================================
      if (path === '/api/pekerja') {
        if (method === 'GET') {
          const { results } = await db.prepare('SELECT * FROM pekerja ORDER BY id ASC').all();
          return jsonResponse({ success: true, data: results }, 200, corsHeaders);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { id, nama, posisi, blok, telp, email, avatar, status } = body;

          await db.prepare(
            'INSERT INTO pekerja (id, nama, posisi, blok, telp, email, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(id, nama, posisi, blok || 'Semua Blok', telp, email || '', avatar || '', status || 'Tetap').run();

          // If Mandor, sync with lahan
          if (posisi && posisi.includes('Mandor') && blok && blok !== 'Semua Blok') {
            await db.prepare('UPDATE lahan SET mandor = ? WHERE nama = ?').bind(nama, blok).run();
          }

          return jsonResponse({ success: true, message: 'Pekerja berhasil dibuat' }, 201, corsHeaders);
        }
      }

      if (path.startsWith('/api/pekerja/')) {
        const id = decodeURIComponent(path.split('/')[3]);

        if (method === 'PUT') {
          const body = await request.json();
          const { nama, posisi, blok, telp, email, avatar, status } = body;

          await db.prepare(
            'UPDATE pekerja SET nama = ?, posisi = ?, blok = ?, telp = ?, email = ?, avatar = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(nama, posisi, blok, telp, email || '', avatar || '', status, id).run();

          // Sync mandor to lahan if applicable
          if (posisi && posisi.includes('Mandor') && blok && blok !== 'Semua Blok') {
            await db.prepare('UPDATE lahan SET mandor = ? WHERE nama = ?').bind(nama, blok).run();
          }

          return jsonResponse({ success: true, message: 'Data pekerja berhasil diperbarui' }, 200, corsHeaders);
        }

        if (method === 'DELETE') {
          await db.prepare('DELETE FROM pekerja WHERE id = ?').bind(id).run();
          return jsonResponse({ success: true, message: 'Pekerja berhasil dihapus' }, 200, corsHeaders);
        }
      }

      // ======================================================================
      // 4. CATATAN KEGIATAN ENDPOINTS
      // ======================================================================
      if (path === '/api/kegiatan') {
        if (method === 'GET') {
          const { results } = await db.prepare('SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC').all();
          return jsonResponse({ success: true, data: results }, 200, corsHeaders);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { tanggal, blok, jenis, deskripsi, kondisi, petugas } = body;

          const res = await db.prepare(
            'INSERT INTO kegiatan (tanggal, blok, jenis, deskripsi, kondisi, petugas) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(tanggal, blok, jenis, deskripsi, kondisi || 'Normal', petugas).run();

          return jsonResponse({ success: true, id: res.meta.last_row_id, message: 'Kegiatan berhasil dicatat' }, 201, corsHeaders);
        }
      }

      if (path.startsWith('/api/kegiatan/') && method === 'DELETE') {
        const id = path.split('/')[3];
        await db.prepare('DELETE FROM kegiatan WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Kegiatan berhasil dihapus' }, 200, corsHeaders);
      }

      // ======================================================================
      // 5. HASIL PANEN ENDPOINTS
      // ======================================================================
      if (path === '/api/panen') {
        if (method === 'GET') {
          const { results } = await db.prepare('SELECT * FROM panen ORDER BY tanggal DESC, id DESC').all();
          return jsonResponse({ success: true, data: results }, 200, corsHeaders);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { tanggal, blok, jumlah, harga, pembeli, status } = body;

          const res = await db.prepare(
            'INSERT INTO panen (tanggal, blok, jumlah, harga, pembeli, status) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(tanggal, blok, jumlah, harga, pembeli, status || 'Selesai').run();

          return jsonResponse({ success: true, id: res.meta.last_row_id, message: 'Panen berhasil dicatat' }, 201, corsHeaders);
        }
      }

      if (path.startsWith('/api/panen/') && method === 'DELETE') {
        const id = path.split('/')[3];
        await db.prepare('DELETE FROM panen WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Data panen berhasil dihapus' }, 200, corsHeaders);
      }

      // ======================================================================
      // 6. MONITORING CUACA ENDPOINTS
      // ======================================================================
      if (path === '/api/cuaca') {
        if (method === 'GET') {
          const { results } = await db.prepare('SELECT * FROM cuaca ORDER BY tanggal DESC, jam DESC LIMIT 200').all();
          return jsonResponse({ success: true, data: results }, 200, corsHeaders);
        }

        if (method === 'POST') {
          const body = await request.json();
          const { tanggal, jam, suhu, kelembaban, curah, kondisi, lokasi } = body;

          const res = await db.prepare(
            'INSERT INTO cuaca (tanggal, jam, suhu, kelembaban, curah, kondisi, lokasi) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).bind(tanggal, jam, suhu, kelembaban, curah, kondisi, lokasi || 'Tegalsari, Musi Rawas').run();

          return jsonResponse({ success: true, id: res.meta.last_row_id, message: 'Data cuaca berhasil dicatat' }, 201, corsHeaders);
        }
      }

      if (path.startsWith('/api/cuaca/') && method === 'DELETE') {
        const id = path.split('/')[3];
        await db.prepare('DELETE FROM cuaca WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Data cuaca berhasil dihapus' }, 200, corsHeaders);
      }

      // ======================================================================
      // 7. LAPORAN BULANAN
      // ======================================================================
      if (path === '/api/laporan' && method === 'GET') {
        const tahun = url.searchParams.get('tahun') || '2023';
        const { results } = await db.prepare('SELECT * FROM laporan_tahunan WHERE tahun = ? ORDER BY id ASC').bind(tahun).all();
        return jsonResponse({ success: true, tahun, data: results }, 200, corsHeaders);
      }

      // 404 Not Found
      return jsonResponse({ error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}
