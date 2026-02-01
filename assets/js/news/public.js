import { db } from "../firebase.js";
import {
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { deleteDoc, doc } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const role = localStorage.getItem("role");

const newsList = document.getElementById("news-list");

const q = query(
  collection(db, "article"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, (snap) => {
  newsList.innerHTML = "";

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const media = cleanMediaLink(d.foto); // Bersihkan link
    
    let mediaHTML = "";

    if (media.type === 'youtube') {
      mediaHTML = `<iframe src="${media.foto}" frameborder="0" allowfullscreen class="media-content"></iframe>`;
    } else if (media.type === 'tiktok') {
      mediaHTML = `<blockquote class="tiktok-embed" data-video-id="${media.foto}" style="max-width: 605px;min-width: 325px;" > <section> </section> </blockquote>`;
    } else {
      // Default Gambar
      mediaHTML = `<img src="${media.foto}" alt="News Image" class="media-content" onerror="this.src='assets/img/placeholder.png'">`;
    }

    newsList.innerHTML += `
      <div class="news-card">
        ${mediaHTML}
        <h3>${d.judul}</h3>
        <p>${d.desk}</p>
        ${role === "admin" ? `<button class="delete-btn" data-id="${docSnap.id}">🗑 Hapus</button>` : ""}
      </div>
    `;
  });

  // Load ulang script TikTok jika ada video TikTok
  if (document.querySelector('.tiktok-embed')) {
    const s = document.createElement('script');
    s.src = "https://www.tiktok.com/embed.js";
    document.body.appendChild(s);
  }
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;

  if (role !== "admin") return; // guard UI

  const id = e.target.dataset.id;

  if (!confirm("Yakin hapus artikel ini?")) return;

  try {
    await deleteDoc(doc(db, "article", id));
    // TIDAK perlu remove DOM manual
    // onSnapshot otomatis update
  } catch (err) {
    alert("Gagal hapus");
    console.error(err);
  }
});

