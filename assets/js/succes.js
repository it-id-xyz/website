import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "./firebase.js";

const container = document.getElementById('status-container');
const regId = localStorage.getItem("it_reg_id");

const sapaan = () => {
  const jam = new Date().getHours();
  let teks;

  if (jam >= 5 && jam < 11) {
    teks = "Selamat%20Pagi,%20";
  } else if (jam >= 11 && jam < 15) {
    teks = "Selamat%20Siang,%20";
  } else if (jam >= 15 && jam < 18) {
    teks = "Selamat%20Sore,%20";
  } else {
    teks = "Selamat%20Malam,%20";
  }
  return teks;
};


if (!regId) {
    window.location.href = "index.html"; 
} else {
    onSnapshot(doc(db, "regist", regId), (snap) => {
        if (!snap.exists()) {
            container.innerHTML = "<p>Data tidak ditemukan...</p>";
            return;
        }
        
        const data = snap.data();
        const chat = `halo%20Kak,%20${sapaan}Aku%20${data.nama}%20dari%20kelas%20${data.kelas},%20aku%20kabar%20kalo%20pendaftaran%20aku%20diterima.%20Terimakasih%20kak.`;
        if (data.status === 'pending') {
            container.innerHTML = `
                <div class="loading">
                    <h3>Halo ${data.nama}!</h2>
                    <p>Data kamu sedang diproses oleh pengurus IT, 5-30menit</p>
                    <div class="project-status">
                    <div class="spinner"></div>
                    <small class="project-status"></small>
                    </div>
                </div>`;
        } 
        else if (data.status === 'approved') {
            container.innerHTML = `
                <div class="card-success">
                    <h2>SELAMAT ${data.nama}! 🎉</h2>
                    <p>Pendaftaran kamu berhasil. Silakan klik tombol di bawah untuk info lebih lanjut.</p>
                    <a href="https://wa.me/6287831166441?text=${chat}" class="btn-wa">Chat Pengurus</a>
                </div>`;
        } 
        else if (data.status === 'rejected') {
            container.innerHTML = `
                <div class="card-error">
                    <h2>Maaf, Kamu Ditolak ❌</h2>
                    <p><b>Alasan:</b> ${data.pesanAdmin}</p>
                    <button onclick="localStorage.clear(); window.location.href='index.html'">Daftar Lagi</button>
                </div>`;
        }
    });
}


