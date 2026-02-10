import { requireAdmin } from "./role.js"

const navbarBtn = document.getElementById('navbar-btn');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const back = document.getElementById('back');
const alurIt = document.getElementById('alurIt');

requireAdmin()
  .then(() => {
    if (!document.getElementById('admin-only')) {
        const cEl = document.createElement('a');
        cEl.id = 'admin-only';
        cEl.innerHTML ='<button><i class="fa fa-gauge-high"></i> Admin</button>';
        cEl.href = 'admin.html';
        navbarBtn.appendChild(cEl);
    }
  })
  .catch(() => {
    const cEl = document.getElementById('admin-only');
    if (cEl) cEl.remove(); 
    console.log("Akses Admin Ditolak.");
  });

menuToggle.addEventListener('click', () => {
  navMenu.classList.remove('hidden');
});

back.addEventListener('click', () => {
    navMenu.classList.add('hidden');

});








