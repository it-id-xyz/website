import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const otpInputs = document.querySelectorAll('.otp-inputs input');
const statusText = document.getElementById('status');
const API_BASE_URL = "https://api.it-smansaci.my.id";
let currentUid = "";

const formElement = document.getElementById('form-input');
const formOtp = document.getElementById('form-otp');

// CEK STATUS LOGIN
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Login Terdeteksi: ", user.email);
        const uid = user.email.replace(/[^a-zA-Z0-9]/g, ""); 
        currentUid = uid;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/check-status/${uid}`);
            const result = await response.json();

            if (result.exists) {
                if (result.verified) {
                    window.location.href = "./succes.html";
                } else {
                    formElement.style.display = 'none';
                    formOtp.style.display = 'block';
                    statusText.innerText = "Selesaikan verifikasi OTP kamu.";
                }
            } else {
                formElement.style.display = 'block';
                formOtp.style.display = 'none';
            }
        } catch (err) {
            console.error("Gagal cek status:", err);
            formElement.style.display = 'block';
        }
    } else {
        window.location.href = "login.html";
    }
});

// SUBMIT FORM
document.getElementById('btn-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = e.target;
    if(btn.disabled) return;
    
    const user = auth.currentUser;
    if (!user) return alert("Silahkan login dulu.");
    
    const honeypot = document.getElementById('honeypot').value;
    if (honeypot !== "") return;

    const payload = {
        nama: document.getElementById('nama').value,
        kelas: document.getElementById('kelas').value,
        whatsapp: document.getElementById('whatsapp').value,
        bidang: document.getElementById('bidang').value,
        email: user.email
    };

    if(!payload.nama || !payload.whatsapp) return alert("Lengkapi data dulu!");

    try {
        btn.disabled = true; 
        btn.innerText = "Loading...";
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            currentUid = result.uid;
            formElement.style.display = 'none';
            formOtp.style.display = 'block';
            console.log("OTP terkirim ke WhatsApp!");
        } else {
            console.log("Gagal: " + result.error);
        }
        formOtp.style.setProperty('display','block','important');
        formElement.style.setProperty('display', 'none', 'important');
    } catch (error) {
        console.log("Server tidak merespon." + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Daftar Sekarang";
    }
});

// LOGIC INPUT OTP
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

// VERIFIKASI OTP
document.getElementById('verify-otp').addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = e.target;
    if(btn.disabled) return;
    
    const otpValue = Array.from(otpInputs).map(i => i.value).join('');
    const user = auth.currentUser; 
    
    if (!user) return statusText.innerText = "❌ Sesi berakhir, silakan login ulang.";

    try {
        btn.disabled = true; 
        btn.innerText = "Loading...";
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ uid: currentUid, otp: otpValue })
        });

        const result = await response.json();

        if (result.success) {
            statusText.innerText = "✅ Verifikasi Berhasil! Selamat Datang.";
            statusText.style.color = "#4ade80";
            setTimeout(() => { window.location.href = "succes.html"; }, 1500);
        } else {
            statusText.innerText = "❌ OTP Salah: " + result.error;
            statusText.style.color = "#f87171";
        }
    } catch (error) {
        statusText.innerText = "⚠️ Gangguan koneksi server.";
    } finally {
        btn.disabled = false;
        btn.innerText = "Verifikasi";
    }
});

// RESEND OTP
document.getElementById('resend-otp').addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = e.target;
    if(btn.disabled) return;
    const user = auth.currentUser; 
    if (!user) return;

    try {
        btn.disabled = true; 
        btn.innerText = "Loading...";
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/resend-otp`, {
            method:'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({uid: currentUid})
        });
        const result = await response.json();

        if (result.success) {
            statusText.innerText = result.message;
            statusText.style.color = "#4ade80";
        } else {
            statusText.innerText = "OTP Tidak Terkirim: " + result.error;
            statusText.style.color = "#f87171";
        }
    } catch (e) {
        console.log(e);
    } finally {
        btn.disabled = false;
        btn.innerText = "Kirim Ulang";
    }
});

// LOGOUT
async function handleLogout() {
    if (confirm("Yakin mau logout?")) {
        try {
            await signOut(auth);
            currentUid = ""; 
            if (statusText) statusText.innerText = "";
            otpInputs.forEach(input => input.value = ""); 
            alert("Logout berhasil!");
            window.location.href = "login.html"; 
        } catch (error) {
            alert("Gagal logout nih. Coba lagi!");
        }
    }
}

document.getElementById('btn-logout')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
