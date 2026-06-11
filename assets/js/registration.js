import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3dKn8hKBsAvEF8ePBI5FGNiZFFOgyAyY",
  authDomain: "website-it-31f31.firebaseapp.com",
  databaseURL: "https://website-it-31f31-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "website-it-31f31",
  storageBucket: "website-it-31f31.firebasestorage.app",
  messagingSenderId: "168247505754",
  appId: "1:168247505754:web:0c1a33987e88a718777963",
  measurementId: "G-E3W9FZ9LTN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUserEmail = "";

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const userInfo = document.getElementById('user-info');
const membersContainer = document.getElementById('members-container');

// Setup Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        currentUserEmail = user.email;
        userInfo.innerText = `Login sebagai: ${user.email}`;
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        currentUserEmail = "";
    }
});

// Tombol Login & Logout
document.getElementById('btn-login').addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => alert("Login gagal: " + error.message));
});

document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});

// --- LOGIC FORM & ID CHECKER ---

// URL Backend Node.js lu (Ganti ke domain asli kalau backend udah di-hosting)
const BACKEND_URL = 'https://api.it-smansaci.my.id'; 

// Struktur Anggota Tim
const teamStructure = [
    { id: 'kapten', label: 'Kapten Tim' },
    { id: 'anggota1', label: 'Anggota 1' },
    { id: 'anggota2', label: 'Anggota 2' },
    { id: 'anggota3', label: 'Anggota 3' },
    { id: 'cadangan', label: 'Pemain Cadangan' }
];

// Generate HTML Form Input secara otomatis
let formHTML = '';
teamStructure.forEach(role => {
    formHTML += `
        <h3 class="section-title">${role.label}</h3>
        <div class="form-group">
            <label>Nama Asli</label>
            <input type="text" id="nama_${role.id}" required>
        </div>
        <div class="form-group">
            <label>No. HP/WhatsApp</label>
            <input type="tel" id="hp_${role.id}" required>
        </div>
        <div class="form-group">
            <label>ID Game</label>
            <input type="number" class="id-checker" data-role="${role.id}" id="id_${role.id}" required>
            <p id="nick_${role.id}" class="result-nick" data-nickname=""></p>
        </div>
    `;
});
membersContainer.innerHTML = formHTML;

// Event Listener untuk Live Checker
document.querySelectorAll('.id-checker').forEach(input => {
    input.addEventListener('change', async function() {
        const roleId = this.getAttribute('data-role');
        const nickElement = document.getElementById(`nick_${roleId}`);
        const gameId = this.value;

        if (!gameId) { nickElement.innerText = ""; return; }

        nickElement.innerText = "🔍 Mengecek ID...";
        nickElement.style.color = "#aaa";

        try {
            const response = await fetch(`${BACKEND_URL}/api/check-id?id=${gameId}`);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error);

            nickElement.innerText = `✅ Nickname: ${data.nickname}`;
            nickElement.style.color = "#00ffcc";
            nickElement.setAttribute('data-nickname', data.nickname);
        } catch (error) {
            nickElement.innerText = `❌ ${error.message}`;
            nickElement.style.color = "#ff4d4d";
            nickElement.setAttribute('data-nickname', "");
        }
    });
});

// Handle Submit
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.innerText = "Memproses...";
    btnSubmit.disabled = true;

    // Validasi apakah semua nickname udah ketemu
    let isAllNickValid = true;
    const payload = {
        email_pendaftar: currentUserEmail,
        nama_tim: document.getElementById('nama_tim').value,
    };

    teamStructure.forEach(role => {
        const nick = document.getElementById(`nick_${role.id}`).getAttribute('data-nickname');
        if (!nick) isAllNickValid = false;
        
        payload[role.id] = {
            nama: document.getElementById(`nama_${role.id}`).value,
            hp: document.getElementById(`hp_${role.id}`).value,
            id: document.getElementById(`id_${role.id}`).value,
            nickname: nick
        };
    });

    if (!isAllNickValid) {
        alert("Gagal submit! Pastikan semua ID Game valid dan memunculkan Nickname.");
        btnSubmit.innerText = "Kirim Pendaftaran";
        btnSubmit.disabled = false;
        return;
    }

    // Tembak ke Backend
    try {
        const res = await fetch(`${BACKEND_URL}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (res.ok) {
            alert("Berhasil! Data sukses masuk ke Spreadsheet.");
            document.getElementById('registrationForm').reset();
            document.querySelectorAll('.result-nick').forEach(el => el.innerText = "");
        } else {
            alert("Error: " + result.error);
        }
    } catch (error) {
        alert("Terjadi kesalahan koneksi ke server.");
    } finally {
        btnSubmit.innerText = "Kirim Pendaftaran";
        btnSubmit.disabled = false;
    }
});
