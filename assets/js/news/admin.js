import { db } from "../firebase.js";
import { isAdmin, requireAdmin } from "../role.js";
import {
  collection, addDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

requireAdmin(); // STOP DI SINI KALAU BUKAN ADMIN

const ui = {
  action: document.getElementById("if-error"),
  form: document.getElementById("form-input"),
  preview: document.getElementById("preview-post")
};

// === BUAT BUTTON ADMIN ===
const btn = document.createElement("button");
btn.id = "news-update";
btn.textContent = "+ Update News";
ui.action.appendChild(btn);

// === EVENT GLOBAL ===
document.addEventListener("click", async (e) => {

  // OPEN FORM
  if (e.target.id === "news-update") {
    if (ui.form.innerHTML) return;

    ui.form.innerHTML = `
      <h4>Masukan Judul Article</h4>
      <input id="judul" placeholder="Judul">
      <h4>Masukan link Foto/Video/File</h4>
      <input id="foto" placeholder="Link gambar">
      <p>Upload foto ke: <a href="https://imgbb.com" target="_blank">ImgBB.com</a></p>
      <p>Atau link gdrive/youtube/google</p>
      <textarea id="desk" placeholder="Deskripsi"></textarea>
      <button id="cancel-btn">Cancel</button>
      <button id="preview-btn">Preview</button>
    `;
  }

  // PREVIEW
  if (e.target.id === "preview-btn") {
    const judul = document.getElementById("judul").value;
    const foto  = document.getElementById("foto").value;
    const desk  = document.getElementById("desk").value;


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
    await addDoc(collection(db, "article"), {
      judul,
      foto,
      desk,
      createdAt: serverTimestamp()
    });

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
  if (!e.target.classList.contains("delete-btn")) return;

  const id = e.target.dataset.id;

  if (!confirm("Hapus artikel ini?")) return;

  try {
    await deleteDoc(doc(db, "article", id));
    alert("Artikel dihapus");

    e.target.closest(".news-card").remove();
  } catch (err) {
    alert("Gagal hapus");
    console.error(err);
  }
});