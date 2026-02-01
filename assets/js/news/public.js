import { db } from "../firebase.js";
import {
  collection, query, orderBy, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const newsList = document.getElementById("news-list");

async function loadNews() {
  const q = query(
    collection(db, "article"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  newsList.innerHTML = "";

  snap.forEach(docSnap => {
    const d = docSnap.data();

    newsList.innerHTML += `
      <div class="news-card">
        <img src="${d.foto}" alt="">
        <h3>${d.judul}</h3>
        <p>${d.desk}</p>
      </div>
    `;
  });
}

loadNews();
