import { auth, db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const container = document.getElementById('status-container');

// Countdown
const getCountdown = (createdAt) => {
    if (!createdAt) return "Menghitung...";
    const end = createdAt.toDate().getTime() + (30 * 60 * 1000);
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "Waktu habis";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
};

// Sapaan 
const getSapaan = () => {
    const jam = new Date().getHours();
    if (jam >= 5 && jam < 11) return "Selamat Pagi";
    if (jam >= 11 && jam < 15) return "Selamat Siang";
    if (jam >= 15 && jam < 18) return "Selamat Sore";
    return "Selamat Malam";
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.email.replace(/[^a-zA-Z0-9]/g, "");
        const userRef = doc(db, "regist", uid);
        
        onSnapshot(userRef, (docSnap) => {
            if (!docSnap.exists()) {
                container.innerHTML = "<p>Data pendaftaran tidak ditemukan. Silakan daftar dulu.</p>";
                return;
            }
            const data = docSnap.data();
            renderStatus(data);
        });
    } else {
        window.location.href = "form.html";
    }
});

let timerInterval; 
function renderStatus(data) {
    if (timerInterval) clearInterval(timerInterval);
    if (data.status === 'pending') {
        const updateTimer = () => {
            const countdown = getCountdown(data.createdAt);
            container.innerHTML = `
                <div class="loading">
                    <h3>Halo ${data.nama}! 👋</h3>
                    <p>Data kamu sedang diproses oleh pengurus IT (Estimasi 5-30 menit).</p>
                    <div class="project-status-box">
                        <span class="status-tag">Status: Sedang diproses...</span>
                    </div>
                    <p class="timer">Sisa waktu estimasi: <b>${countdown}</b></p>
                </div>`;
            
            if (countdown === "Waktu habis") clearInterval(timerInterval);
        };
        
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);

    } else if (data.status === 'approved') {
        
        container.innerHTML = `
            <div class="card-success">
                <h2>SELAMAT ${data.nama}! 🎉</h2>
                <p>Kamu resmi menjadi bagian dari IT SMANSACI. Klik tombol di bawah untuk masuk ke grup koordinasi.</p>
                <a href="https://wa.me/6285111026441?" class="btn-wa" target="_blank">
                    <i class="fa-solid fa-check"></i> Buka Whatsapp (Approved)
                </a>
            </div>`;

    } else if (data.status === 'rejected') {
        container.innerHTML = `
            <div class="card-error">
                <h2>Maaf, ${data.nama} ❌</h2>
                <p>Pendaftaran kamu belum bisa kami terima saat ini.</p>
                <div class="reason-box">
                    <strong>Alasan:</strong> ${data.pesanAdmin || "Tidak ada alasan spesifik."}
                </div>
                <button onclick="window.location.href='index.html'" class="btn-retry">Coba Daftar Lagi</button>
            </div>`;
    }
}
