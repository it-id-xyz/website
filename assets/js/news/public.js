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

function cleanMediaLink(foto) {
      if (!foto) return "";
    
      // Handle Google Drive
      if (foto.includes("drive.google.com")) {
        const fileId = foto.split("/d/")[1]?.split("/")[0] || foto.split("id=")[1];
        return { type: 'image', url: `https://lh3.googleusercontent.com/d/${fileId}` };
      }
    
      // HANDLE YOUTUBE (Video, Shorts, Mobile)
      if (foto.includes("youtube.com") || foto.includes("youtu.be")) {
        let videoId = "";
        
        if (foto.includes("shorts/")) {
          videoId = foto.split("shorts/")[1]?.split(/[?#]/)[0];
        } else if (foto.includes("v=")) {
          videoId = foto.split("v=")[1]?.split(/[?#]/)[0];
        } else if (foto.includes("youtu.be/")) {
          videoId = foto.split("youtu.be/")[1]?.split(/[?#]/)[0];
        } else if (foto.includes("embed/")) {
          videoId = foto.split("embed/")[1]?.split(/[?#]/)[0];
        }
    
        if (videoId) {
          return { 
            type: 'youtube', 
            url: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` 
          };
        }
      }
    
      // Handle TikTok (Embed)
      if (foto.includes("tiktok.com")) {
        const videoId = foto.split("/video/")[1]?.split(/[?#]/)[0];
        return { type: 'tiktok', url: videoId }; // Kita simpan ID-nya saja
      }
    
      // Handle ImgBB (Jika bukan direct link, kita tidak bisa menebak id-nya dengan mudah, 
      // disarankan tetap ambil 'Direct Link' di ImgBB, tapi kita tandai)
      if (foto.includes("ibb.co") && !foto.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        return { type: 'image', url: foto, warning: 'Gunakan Direct Link ImgBB!' };
      }
    
      // Default: Anggap saja gambar biasa
      return { type: 'image', url: foto };
    }

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
      mediaHTML = `<img src="${media.foto}" alt="News Image" class="media-content" onerror="this.src='assets/img/it.png'">`;
    }

    newsList.innerHTML += `
      <article class="news-card">
        ${mediaHTML}
        <div class="article-content">
        <h3>${d.judul}</h3>
        <p>${d.desk}</p>
        </div>
        ${role === "admin" ? `<button class="delete-btn" data-id="${docSnap.id}">🗑 Hapus</button>` : ""}
      </article>
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







