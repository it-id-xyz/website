import { showAdminUI } from "assets/js/role.js";

// === 1. CEK ROLE DULU ===
const role = localStorage.getItem("role");

if (role !== "admin") {
  alert("Halaman khusus admin");
  window.location.href = "index.html";
  throw new Error("Unauthorized"); // stop JS
}

// === 2. TAMPILKAN UI ADMIN ===
showAdminUI();

// === 3. BARU SENTUH DOM ===
const newList = document.getElementById('new-list');
const btnUpdate = document.getElementById('btn-update');

// SAFETY CHECK
if (btnUpdate) {
  btnUpdate.addEventListener('click', () => {
    console.log("Admin klik update");
    // logic update nanti di sini
  });
}




