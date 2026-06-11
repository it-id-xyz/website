import { auth } from "./firebase.js";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const provider = new GoogleAuthProvider();

let currentUserEmail = "";

// DOM Elements
const loginSection    = document.getElementById('login-section');
const dashboardSection= document.getElementById('dashboard-section');
const userInfo        = document.getElementById('user-info');
const membersContainer= document.getElementById('members-container');

// ── Auth State ──────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        currentUserEmail = user.email;
        if (userInfo) userInfo.innerText = `Login sebagai: ${user.email}`;
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        currentUserEmail = "";
    }
});

// ── Tombol Login ────────────────────────────
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch(error => {
            alert("Login gagal: " + error.message);
        });
    });
}

// ── Tombol Logout (hanya yang di dalam form, bukan navbar) ──
const btnLogoutForm = document.getElementById('btn-logout-form');
if (btnLogoutForm) {
    btnLogoutForm.addEventListener('click', () => {
        if (confirm("Yakin mau logout?")) signOut(auth);
    });
}

// ── BACKEND URL ─────────────────────────────
const BACKEND_URL = 'https://api.it-smansaci.my.id';

// ── Struktur Tim ────────────────────────────
const teamStructure = [
    { id: 'kapten',   label: 'Kapten Tim' },
    { id: 'anggota1', label: 'Anggota 1' },
    { id: 'anggota2', label: 'Anggota 2' },
    { id: 'anggota3', label: 'Anggota 3' },
    { id: 'cadangan', label: 'Pemain Cadangan' }
];

// ── Build Form HTML ──────────────────────────
let formHTML = '';
teamStructure.forEach(role => {
    formHTML += `
        <h3 class="section-title">${role.label}</h3>
        <div class="form-group">
            <label>Nama Asli</label>
            <input type="text" id="nama_${role.id}" placeholder="Nama lengkap..." required>
        </div>
        <div class="form-group">
            <label>No. HP/WhatsApp</label>
            <input type="tel" id="hp_${role.id}" placeholder="08xxxxxxxxxx" required>
        </div>
        <div class="form-group">
            <label>ID Game (Free Fire)</label>
            <input type="text"
                   inputmode="numeric"
                   class="id-checker"
                   data-role="${role.id}"
                   id="id_${role.id}"
                   placeholder="Masukkan ID Game..."
                   autocomplete="off"
                   required>
            <p id="nick_${role.id}" class="result-nick" data-nickname=""></p>
        </div>
    `;
});
if (membersContainer) membersContainer.innerHTML = formHTML;

// ── Debounce helper ──────────────────────────
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ── Live ID Checker ──────────────────────────
let isChecking = {}; 
let lastCheckedId = {}; 

async function checkGameId(roleId, gameId) {
    const cleanId = gameId ? gameId.trim() : '';
    const nickElement = document.getElementById(`nick_${roleId}`);
    if (!nickElement) return;

    if (!cleanId) {
        nickElement.innerText = "";
        nickElement.setAttribute('data-nickname', '');
        lastCheckedId[roleId] = ''; 
        return;
    }

    if (lastCheckedId[roleId] === cleanId && nickElement.getAttribute('data-nickname')) {
        return; 
    }

    if (isChecking[roleId]) return;

    isChecking[roleId] = true;
    nickElement.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Mengecek ID...`;
    nickElement.style.color = "var(--text-muted)";
    nickElement.setAttribute('data-nickname', '');

    try {
        const response = await fetch(`${BACKEND_URL}/api/check-id?id=${encodeURIComponent(cleanId)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "ID tidak valid");
        }

        if (data.nickname) {
            nickElement.innerHTML = `<i class="fa fa-circle-check"></i> Nickname: <strong>${data.nickname}</strong>`;
            nickElement.style.color = "#00c896";
            nickElement.setAttribute('data-nickname', data.nickname);
            
            lastCheckedId[roleId] = cleanId;
        } else {
            throw new Error("Nickname tidak ditemukan");
        }

    } catch (error) {
        nickElement.innerHTML = `<i class="fa fa-circle-xmark"></i> ${error.message}`;
        nickElement.style.color = "#ff4d4d";
        nickElement.setAttribute('data-nickname', '');
        lastCheckedId[roleId] = ''; 
    } finally {
        isChecking[roleId] = false; 
    }
}

// ── Event Listener Input ──────────────────────────
document.querySelectorAll('.id-checker').forEach(input => {
    const debouncedCheck = debounce(function () {
        const roleId = this.getAttribute('data-role');
        checkGameId(roleId, this.value);
    }, 700);

    input.addEventListener('input', debouncedCheck);
    
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            
            const roleId = this.getAttribute('data-role');
            checkGameId(roleId, this.value);
        }
    });
});

// ── Handle Submit ────────────────────────────
const regForm = document.getElementById('registrationForm');
if (regForm) {
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = document.getElementById('btn-submit');
        if (!btnSubmit) return;
        btnSubmit.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Memproses...`;
        btnSubmit.disabled = true;

        let isAllNickValid = true;
        const payload = {
            email_pendaftar: currentUserEmail,
            nama_tim: document.getElementById('nama_tim')?.value || '',
        };

        teamStructure.forEach(role => {
            const nickEl = document.getElementById(`nick_${role.id}`);
            const nick   = nickEl ? nickEl.getAttribute('data-nickname') : '';
            if (!nick) isAllNickValid = false;

            payload[role.id] = {
                nama:     document.getElementById(`nama_${role.id}`)?.value || '',
                hp:       document.getElementById(`hp_${role.id}`)?.value || '',
                id:       document.getElementById(`id_${role.id}`)?.value || '',
                nickname: nick
            };
        });

        if (!payload.nama_tim) {
            alert("Mohon isi Nama Tim terlebih dahulu!");
            btnSubmit.innerHTML = "Kirim Pendaftaran";
            btnSubmit.disabled  = false;
            return;
        }

        if (!isAllNickValid) {
            alert("Gagal submit!\n\nPastikan SEMUA ID Game sudah dicek dan menampilkan Nickname yang valid (warna hijau).");
            btnSubmit.innerHTML = "Kirim Pendaftaran";
            btnSubmit.disabled  = false;
            return;
        }

        // Kirim ke backend
        try {
            const res    = await fetch(`${BACKEND_URL}/api/submit`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });
            const result = await res.json();

            if (res.ok) {
                alert("✅ Berhasil!\n\nData pendaftaran tim Anda sudah masuk. Kami akan menghubungi via WhatsApp.");
                regForm.reset();
                document.querySelectorAll('.result-nick').forEach(el => {
                    el.innerText = "";
                    el.setAttribute('data-nickname', '');
                });
            } else {
                alert("❌ Error: " + (result.error || "Terjadi kesalahan, coba lagi."));
            }
        } catch (error) {
            alert("❌ Gagal terhubung ke server. Periksa koneksi internet Anda.");
        } finally {
            btnSubmit.innerHTML = "Kirim Pendaftaran";
            btnSubmit.disabled  = false;
        }
    });
}
