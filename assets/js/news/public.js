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

    newsList.innerHTML += `
  <div class="news-card" data-id="${docSnap.id}">
    <img src="${d.foto}" alt="">
    <h3>${d.judul}</h3>
    <p>${d.desk}</p>

    ${role === "admin" ? `
      <button class="delete-btn" data-id="${docSnap.id}">
        🗑 Hapus
      </button>
    ` : ""}
  </div>
  `;

  });
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
