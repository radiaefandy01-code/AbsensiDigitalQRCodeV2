const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx4OeTKVa2a7jJmD1t8PDWU-IyOg6lUd_dlU3ene3WJytCy8NgzQoghaIecz_OQ_xXkAg/exec";

async function callAPI(action, payload = {}) {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...payload })
    });
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: "Gagal terhubung ke Apps Script" };
  }
}

// Global Variables
var currentPage = 'dashboard';
var students = [];
var attendance = [];
var stats = {};

async function loadData() {
  const resStats = await callAPI('getStats');
  if (resStats.success) stats = resStats.stats;

  const resAtt = await callAPI('getAttendanceToday');
  if (resAtt.success) attendance = resAtt.attendance;

  const resStu = await callAPI('getStudentList');
  if (resStu.success) students = resStu.students;

  renderPage();
}

function showPage(p) {
  currentPage = p;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`[data-page="${p}"]`);
  if (activeNav) activeNav.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'laporan': 'Laporan Kehadiran',
    'rekap': 'Rekap Bulanan',
    'siswa': 'Daftar Siswa',
    'pengaturan': 'Pengaturan'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[p];

  renderPage();
}

function renderPage() {
  if (currentPage === 'dashboard') renderDashboard();
  else if (currentPage === 'siswa') renderSiswa();
  else if (currentPage === 'laporan') renderLaporan();
}

function renderDashboard() {
  const c = document.getElementById('main-content');
  if (!c) return;

  var feedHtml = attendance.length > 0 
    ? attendance.map(a => `<div style="padding:10px; border-bottom:1px solid #eee;"><b>${a.nama}</b> (${a.kelas}) - ${a.waktu} WIB [${a.status}]</div>`).join('')
    : '<p style="padding:20px; text-align:center; color:#888;">Belum ada absensi hari ini</p>';

  c.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-info"><h3>Total Hadir</h3><div class="value">${stats.totalHadir || 0}</div></div></div>
      <div class="stat-card"><div class="stat-info"><h3>Terlambat</h3><div class="value">${stats.totalTerlambat || 0}</div></div></div>
      <div class="stat-card"><div class="stat-info"><h3>Belum Absen</h3><div class="value">${stats.belumAbsen || 0}</div></div></div>
    </div>
    <div class="card" style="margin-top:20px; padding:20px;">
      <h3>Feed Absensi Hari Ini</h3>
      <div>${feedHtml}</div>
    </div>
  `;
}

function renderSiswa() {
  const c = document.getElementById('main-content');
  if (!c) return;

  var rows = students.map(s => `
    <tr>
      <td>${s.nama}</td>
      <td>${s.barcode}</td>
      <td>${s.kelas}</td>
      <td><span class="badge badge-success">${s.status}</span></td>
    </tr>
  `).join('');

  c.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h1>Daftar Siswa</h1>
      <button class="btn btn-primary" onclick="showAddModal()">+ Tambah Siswa</button>
    </div>
    <table class="table">
      <thead><tr><th>Nama</th><th>NIS/Barcode</th><th>Kelas</th><th>Status</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="text-align:center;">Belum ada data siswa</td></tr>'}</tbody>
    </table>
  `;
}

// Modal Tambah Siswa
function showAddModal() {
  const m = document.getElementById('modal');
  m.innerHTML = `
    <div class="modal">
      <h2>Tambah Siswa Baru</h2>
      <br>
      <input type="text" id="add-bc" placeholder="NIS / Barcode" class="form-input" style="margin-bottom:10px; width:100%; padding:8px;">
      <input type="text" id="add-nama" placeholder="Nama Lengkap" class="form-input" style="margin-bottom:10px; width:100%; padding:8px;">
      <input type="text" id="add-kelas" placeholder="Kelas (contoh: X-IPA 1)" class="form-input" style="margin-bottom:10px; width:100%; padding:8px;">
      <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:15px;">
        <button class="btn btn-outline" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="submitAddSiswa()">Simpan</button>
      </div>
    </div>
  `;
  m.classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

async function submitAddSiswa() {
  const barcode = document.getElementById('add-bc').value;
  const nama = document.getElementById('add-nama').value;
  const kelas = document.getElementById('add-kelas').value;

  if (!nama || !kelas) return alert("Mohon lengkapi data!");

  const res = await callAPI('submitAdd', { barcode, nama, kelas });
  if (res.success) {
    closeModal();
    loadData();
  } else {
    alert("Gagal menambahkan siswa");
  }
}

// Fungsi Kamera untuk index.html (Siswa)
function startCamera() {
  const content = document.getElementById('student-content');
  content.innerHTML = `
    <div style="text-align:center;">
      <p style="margin-bottom:10px;">Simulasi Pemindaian Presensi Wajah...</p>
      <input type="text" id="stu-nama" placeholder="Masukkan Nama Anda" style="padding:8px; width:80%; margin-bottom:10px;"><br>
      <input type="text" id="stu-kelas" placeholder="Masukkan Kelas" style="padding:8px; width:80%; margin-bottom:10px;"><br>
      <button class="btn btn-primary" onclick="doAbsen()">Konfirmasi Presensi</button>
    </div>
  `;
}

async function doAbsen() {
  const nama = document.getElementById('stu-nama').value;
  const kelas = document.getElementById('stu-kelas').value;
  
  if (!nama) return alert("Isi nama terlebih dahulu");

  const res = await callAPI('recordAttendance', { nama, kelas });
  if (res.success) {
    document.getElementById('student-content').innerHTML = `
      <div style="text-align:center; padding:20px; color:green;">
        <h2>Presensi Berhasil!</h2>
        <p>Data Anda telah masuk ke Spreadsheet.</p>
      </div>
    `;
  }
}
