import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const list = document.getElementById("news-list");

async function loadNews() {
  const q = query(
    collection(db, "article"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = "<p>Belum ada berita.</p>";
    return;
  }

  let html = "";

 snap.forEach(docSnap => {
  const data = docSnap.data();
  const id = docSnap.id;

  html += `
    <article class="news-card" data-id="${id}">
      <img src="${data.foto}">
      <h3>${data.judul}</h3>
      <p>${data.desk}</p>

      ${isAdmin() ? `<button class="delete-btn" data-id="${id}">Hapus</button>` : ""}
    </article>
  `;
});

  list.innerHTML = html;
}

loadNews();
