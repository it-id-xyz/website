import { db } from "../firebase.js";
import { requireAdmin } from "../role.js";
import {
  collection, addDoc, deleteDoc,
  serverTimestamp, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// JANGAN gunakan await di luar fungsi secara langsung jika ingin guest tetap bisa akses
requireAdmin()
  .then(() => {
    // KODE DI BAWAH HANYA JALAN JIKA USER ADALAH ADMIN
    console.log("Admin terdeteksi, mengaktifkan fitur editor...");
    initAdminFeatures(); 
  })
  .catch(() => {
    // Jika bukan admin/guest, biarkan saja, jangan di-redirect
    console.log("Bukan admin, fitur editor dinonaktifkan.");
  });

function initAdminFeatures() {
  const ui = {
    action: document.getElementById("if-error"),
    form: document.getElementById("form-input"),
    preview: document.getElementById("preview-post")
  };
  
  // === BUAT BUTTON ADMIN ===
  const btn = document.createElement("button");
  btn.id = "news-update";
  btn.className = "admin-only-btn"; 
  btn.textContent = "+ Update News";
  ui.action.appendChild(btn);
  
// === EVENT GLOBAL ===
document.addEventListener("click", async (e) => {

  // OPEN FORM
  if (e.target.id === "news-update") {
    if (ui.form.innerHTML) return;

    ui.form.innerHTML = `
      <h4>Masukan Judul Article</h4>
      <input id="judul-input" placeholder="Judul">
      <h4>Masukan link Foto/Video/File</h4>
      <input id="foto-input" placeholder="Link gambar">
      <p>Upload foto ke: <a href="https://imgbb.com" target="_blank">ImgBB.com</a></p>
      <p>Atau link gdrive/youtube/google</p>
      <textarea id="desk-input" placeholder="Deskripsi"></textarea>
      <button id="cancel-btn">Cancel</button>
      <button id="preview-btn">Preview</button>
    `;
  }

  // PREVIEW
  if (e.target.id === "preview-btn") {
    const judul = document.getElementById("judul-input").value;
    const foto  = document.getElementById("foto-input").value;
    const desk  = document.getElementById("desk-input").value;


    if (!judul || !foto || !desk) {
      alert("Lengkapi semua");
      return;
    }

    ui.preview.innerHTML = `
      <img src="${foto}" style="max-width:300px">
      <h3>${judul}</h3>
      <p>${desk}</p>

      <button id="post-btn">Post</button>
      <button id="clear-btn">Hapus</button>
    `;
  }

  // POST
  if (e.target.id === "post-btn") {
    const judul = document.getElementById("judul-input").value;
    const foto  = document.getElementById("foto-input").value;
    const desk  = document.getElementById("desk-input").value;
    await addDoc(collection(db, "article"), {
      judul: judul,
      foto: foto,
      desk: desk,
      createdAt: serverTimestamp()
    })
    
    alert("Artikel terbit!");
    ui.form.innerHTML = "";
    ui.preview.innerHTML = "";
  }

  // CANCEL / CLEAR
  if (e.target.id === "cancel-btn" || e.target.id === "clear-btn") {
    ui.form.innerHTML = "";
    ui.preview.innerHTML = "";
  }
});
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
 const id = btn.dataset.id;

  if (!confirm("Hapus artikel ini?")) return;

  try {
    await deleteDoc(doc(db, "article", id));
    alert("Artikel dihapus");

   btn.closest(".news-card").remove();
  } catch (err) {
    alert("Gagal hapus");
    console.error(err);
  }

});
}






