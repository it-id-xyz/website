import { requireAdmin } from "./role.js"
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
