import { requireAdmin } from "./role.js"

const navbarBtn = document.getElementById('navbar-btn');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const back = document.getElementById('back');
const alurIt = document.getElementById('alurIt');

requireAdmin()
  .then(() => {
    // KODE DI BAWAH HANYA JALAN JIKA USER ADALAH ADMIN
    console.log("Admin terdeteksi, mengaktifkan fitur admin...");
    const cEl = document.createElement('a');
    cEl.id = 'admin-only';
    cEl.innerHTML ='<button><i class="fa fa-gauge-high"></i> Admin</button>';
    cEl.href = 'admin.html';
    navbarBtn.appendChild(cEl);
    initAdminFeatures(); 
  })
  .catch(() => {
    const cEl = document.getElementById('admin-only');
    cEl.innerHTML = '';
    console.log("Bukan admin, fitur admin dinonaktifkan.");
  });

menuToggle.addEventListener('click', () => {
  navMenu.classList.remove('hidden');
});

back.addEventListener('click', () => {
    navMenu.classList.add('hidden');

});







