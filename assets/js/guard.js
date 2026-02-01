import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  // Ambil nama file halaman saat ini (misal: "news.html")
  const currentPage = window.location.pathname.split("/").pop();

  // Daftar halaman yang WAJIB login/admin
  const protectedPages = ["admin.html", "admin-service.html"];

  if (!user && protectedPages.includes(currentPage)) {
    // Hanya redirect jika user tidak login DAN mencoba akses halaman rahasia
    console.warn("Akses ditolak. Silakan login terlebih dahulu.");
    window.location.href = "login.html";
  } else {
    // Jika di news.html atau index.html, biarkan saja
    console.log("Halaman publik atau User sudah login.");
  }
});
