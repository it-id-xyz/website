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
    cEl.innerText ='<i class="fa fa-gauge-high"></i> Admin Dashboard';
    cEl.href = 'admin.html';
    initAdminFeatures(); 
  })
  .catch(() => {
    // Jika bukan admin/guest, biarkan saja, jangan di-redirect
    console.log("Bukan admin, fitur admin dinonaktifkan.");
  });

menuToggle.addEventListener('click', () => {
  navMenu.classList.remove('hidden');
});

back.addEventListener('click', () => {
    navMenu.classList.add('hidden');

});
