import { showAdminUI } from "./role.js";
import { db } from "./firebase.js";
import { collection, deleteDoc, addDoc, serverTimestamp, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// === 1. CEK ROLE DULU ===
const role = localStorage.getItem("role");

if (role !== "admin") {
  throw new Error("Unauthorized"); // stop JS
} else {
  const btnUpdate = document.createElement('button')
  btnUpdate.innerText = 'Update News';
  btnUpdate.id = 'news-update';
  document.getElementById('if-error').appendChild(btnUpdate)
}

// === 2. TAMPILKAN UI ADMIN ===
showAdminUI();

// === 3. BARU SENTUH DOM ===
const bagianForm = document.getElementById('form-input');
const previewPost = document.getElementById('preview-post');
const newsUpdate = document.getElementById('if-error');

// SAFETY CHECK
newsUpdate.addEventListener('click', (e) => {
  if (e.target.id === 'news-update') {
    if (document.getElementById('form-input')) return;

    bagianForm.innerHTML = ` 
      <h4>Masukan Judul Article</h4>
      <input type="text" id="judul-article" placeholder="Judul Article" required>
      <h4>Masukan link file/foto/video</h4>
      <input type="text" id="link-article" placeholder="https://..." required>
      <p style="font-size:12px">Bisa menggunakan link imgbb, gdrive, youtube</p>
      <h4>Masukan deskripsi</h4>
      <textarea type"text" id="desk-article" placeholder="Tulis deskripsi berita" required></textarea>
      <p style="font-size:12px">Upload foto ke: <a href="https://imgbb.com" target="_blank">ImgBB.com</a></p>
      <button id="cancel-btn">Cancel</button>
      <button id="preview-btn">Preview</button>
    `;

  if(e.target.id === 'preview-btn') { 
    const judul = document.getElementById('judul-article').value;
    const link = document.getElementById('link-article').value;
    const desk = document.getElementById('desk-article').value;

    if(!link || !desk || !judul) {
      alert('isi semua');
      return;
    }
    previewPost.innerHTML = `
      <h3>Preview Article</h3>
      <img src="${link}" style="width:100%; max-width:300px; border-radius: 10px; onerror="this.src='assets/img/it.png'">
      <h4>${judul}</h4>
      <p>${desk}</p>
      <button id="delete-btn">Delete</button>
      <button id="post-btn">Confirm & Post</button>
    `;
  };
  if (e.target.id === 'delete-btn') {
    previewPost.innerHTML = '';
  };
  
  if (e.target.id === 'cancel-btn') {
    document.getElementById('form-input').remove();
    previewPost.innerHTML = '';
  };
  };
});

document.addEventListener('click', async (e) => {
  if (e.target.id === 'post-btn') {
    const judul = document.getElementById('judul-article').value;
    const desk = document.getElementById('desk-article').value;
    const link = document.getElementById('link-article').value;

    if (role !== "admin") return;
    try {
      document.getElementById('post-btn').innerText = "Uploading...";
      document.getElementById('post-btn').disabled = true;

      await addDoc(collection(db, "article"), {
        judul: judul,
        foto: link, 
        desk: desk,
        createdAt: serverTimestamp()
      });

      alert("Artikel Berhasil Terbit Publik!");
      previewPost.innerHTML = '';
      News.remove();

    } catch (e) {
      console.error("Gagal total: ", e);
      alert("Waduh, gagal upload: " + e.message);
      e.target.innerText = "Confirm & Post";
      e.target.disabled = false;
    }
  }
});

async function loadNews() {
  const newsList = document.querySelector('.news-list:not(#preview-post)'); 
  if (!newsList) return;

  const q = query(collection(db, "article"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  let cards = "";

  querySnapshot.forEach((documentSnap) => {
    const data = documentSnap.data();
    const docId = documentSnap.id;

    cards += `
      <div class="news-card" id="card-${docId}">
        <img src="${data.foto}" alt="News Image">
        <div class="news-content">
          <h3>${data.judul}</h3>
          <p>${data.desk}</p>
          <small>${data.createdAt?.toDate().toLocaleDateString() || ''}</small>
          
          ${role === "admin" ? `
            <button class="delete-news-btn" data-id="${docId}" style="background:red; color:white; border:none; padding:5px; cursor:pointer; margin-top:10px;">
              <i class="fa fa-trash"></i> Hapus
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
  newsList.innerHTML = cards;

document.querySelectorAll('.delete-news-btn').forEach(btn => {
    btn.onclick = async (e) => {
      const docId = e.target.closest('button').getAttribute('data-id');
      if (confirm("Yakin mau hapus?")) {
        try {
          await deleteDoc(doc(db, "article", docId));
          document.getElementById(`card-${docId}`).remove();
          alert("Berhasil dihapus!");
        } catch (err) {
          alert("Gagal hapus: " + err.message);
        }
      }
    };
  });
}

loadNews();

