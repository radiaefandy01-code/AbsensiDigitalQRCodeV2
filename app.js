// Konfigurasi URL Google Apps Script Web App Anda
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx4OeTKVa2a7jJmD1t8PDWU-IyOg6lUd_dlU3ene3WJytCy8NgzQoghaIecz_OQ_xXkAg/exec";

// Modul Utama Pengganti google.script.run
async function callAPI(action, payload = {}) {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: action, ...payload })
    });
    return await response.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { success: false, message: "Gagal terhubung ke server Google Apps Script" };
  }
}

// Global State
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
  else if (currentPage === 'laporan') renderLaporan();
  else if (currentPage === 'rekap') renderRekap();
  else if (currentPage === 'siswa') renderSiswa();
  else if (currentPage === 'pengaturan') renderPengaturan();
}

function renderDashboard() {
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-info">
          <h3>Total Hadir</h3>
          <div class="value">${stats.totalHadir || 0}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-info">
          <h3>Siswa Terlambat</h3>
          <div class="value">${stats.totalTerlambat || 0}</div>
        </div>
      </div>
    </div>
    <div class="feed-grid">
      <p>Data presensi akan dimuat secara live di sini.</p>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

function renderLaporan() {
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = `<h1>Laporan Kehadiran</h1><p>Memuat laporan data presensi...</p>`;
}

function renderRekap() {
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = `<h1>Rekap Bulanan</h1><p>Memuat rekapitulasi bulanan...</p>`;
}

function renderSiswa() {
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = `<h1>Daftar Siswa</h1><p>Memuat daftar siswa...</p>`;
}

function renderPengaturan() {
  const c = document.getElementById('main-content');
  if (!c) return;
  c.innerHTML = `<h1>Pengaturan System</h1><p>Pengaturan waktu presensi...</p>`;
}