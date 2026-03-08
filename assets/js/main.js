import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, OAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const ggprovider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();
    fbProvider.addScope('email');
const ghProvider = new GithubAuthProvider();
    ghProvider.addScope('user:email');
const msProvider = new OAuthProvider('microsoft.com');
    msProvider.addScope('openid');
    msProvider.addScope('profile');
    msProvider.addScope('email');
const otpInputs = document.querySelectorAll('.otp-inputs input');
const statusText = document.getElementById('status');
const API_BASE_URL = "https://api.it-smansaci.my.id"

document.getElementById("btn-login-gg").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, ggprovider);
        console.log("Login berhasil");
    } catch (err) {
        console.error(err); 
        console.log("Login gagal: " + err.message);
    }
});
document.getElementById("btn-login-fb").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, fbProvider);
        console.log("Login berhasil");
    } catch (err) {
        console.error(err); 
    }
});
document.getElementById("btn-login-gh").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, ghProvider);
        console.log("Login berhasil");
    } catch (err) {
        console.error(err); 
    }
});
document.getElementById("btn-login-ms").addEventListener("click", async () => {
    try {
        msProvider.setCustomParameters({
          prompt: 'select_account'
        });
        await signInWithPopup(auth, msProvider);
        console.logt("Login berhasil");
    } catch (err) {
        console.error(err); 
    }
});
onAuthStateChanged(auth, (user) => {
    console.log("Firebase Auth State Changed. User:", user); 
    const loginMenu = document.getElementById('login-menu');
    const formElement = document.getElementById('form-input');
    const formOtp = document.getElementById('form-otp');
    if (user) {
        console.log("Login Terdeteksi: ", user.displayName || user.email);
        formElement.style.setProperty('display', 'block', 'important');
        loginMenu.style.setProperty('display', 'none', 'important');
        formOtp.style.setProperty('display','none','important');
    } else {
        console.log("Status: Guest (Null)");
        formElement.style.setProperty('display', 'none', 'important');
        formOtp.style.setProperty('display','none','important');
        loginMenu.style.setProperty('display', 'block', 'important');
    }
});

document.getElementById('btn-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert("Silahkan login dulu.");
        return;
    }
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
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            currentUid = result.uid;
            formInput.style.display = 'none';
            formOtp.style.display = 'block';
            console.log("OTP terkirim ke WhatsApp!");
        } else {
           console.logt("Gagal: " + result.error);
        }
        formOtp.style.setProperty('display','block','important');
        formElement.style.setProperty('display', 'none', 'important');
    } catch (error) {
        console.log("Server tidak merespon." + error.message);
    }
});

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

document.getElementById('verify-otp').addEventListener('click', async (e) => {
    e.preventDefault();
    const otpValue = Array.from(otpInputs).map(i => i.value).join('');

    try {
        const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUid, otp: otpValue })
        });

        const result = await response.json();

        if (result.success) {
            statusText.innerText = "✅ Verifikasi Berhasil! Selamat Datang.";
            statusText.style.color = "#4ade80";
            setTimeout(() => { window.location.href = "index.html"; }, 2000);
        } else {
            statusText.innerText = "❌ OTP Salah: " + result.error;
            statusText.style.color = "#f87171";
        }
    } catch (error) {
        statusText.innerText = "⚠️ Gangguan koneksi server.";
    }
});





