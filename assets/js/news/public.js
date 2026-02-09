import { db } from "../firebase.js";
import {
  collection, query, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const newsList = document.getElementById("total-articles");

const q = query(collection(db, "article"));

onSnapshot(q, (snap) => {
  snap.forEach((doc) => {
    const d = doc.data()

    newsList.innerHTML += `
      <article class="news-card">
        <img src="data:image/png;base64,${d.foto}">
        <div class="article-content">
        <h3>${d.judul}</h3>
        <p>${d.desk}</p>
        </div>
      </article>
    `;
  });
});


