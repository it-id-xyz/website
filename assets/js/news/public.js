import { db } from "../firebase.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const containerArtikel = document.getElementById('news-list');
if (containerArtikel) {
    onSnapshot(collection(db,"article"), (snap) => {
    containerArtikel.innerHTML = "";            
    snap.forEach((snap) => {
        const art = snap.data();
        const docId = snap.id;
            containerArtikel.innerHTML += `
                <div class="card-monitor">
                    <img src="${art.foto}" style="width:100%; border-radius:8px;">
                    <p><strong>ID:</strong> ${art.id}</p>
                    <p>${art.judul}</p>
                    <p><small>Tgl: ${new Date(art.createdAt).toLocaleString('id-ID')}</small></p>
                    <button class="delete-btn" data-id="${docId}" style="background:#ff4d4d; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">
                        <i class="fa-regular fa-trash-can"></i> Delete
                    </button>
                </div>`
            });
        });
    }


})
