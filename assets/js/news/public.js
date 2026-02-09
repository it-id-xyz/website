import { db } from "../firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const containerArtikel = document.getElementById('news-list');
if (containerArtikel) {
    onSnapshot(collection(db,"article"), (snap) => {
    containerArtikel.innerHTML = "";            
    snap.forEach((snap) => {
        const art = snap.data();
            containerArtikel.innerHTML += `
                <div class="news-card">
                    <img src="${art.foto}" style="width:100%; border-radius:8px;">
                    <p><strong>ID:</strong> ${art.judul}</p>
                    <p>${art.desk}</p>
                    <p><small>Tgl: ${new Date(art.createdAt).toLocaleString('id-ID')}</small></p>
                </div>`
            });
        });
    }

