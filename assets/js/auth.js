import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const form = document.getElementById("loginForm");
const API_URL = "https://api.it-smansaci.my.id"; 
const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('form-otp');
const otpInputs = document.querySelectorAll('.otp-inputs input');
const statusDiv = document.getElementById('status');
let userUid = "";

// LOGIN
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            userUid = data.uid;
            loginForm.classList.add('hidden');
            otpForm.classList.add('active');
            alert("Kode OTP telah dikirim ke Email/WhatsApp lu!");
        } else {
            alert("Email atau Password salah, Bro.");
        }
    } catch (err) {
        console.error(err);
        alert("Server lagi sibuk, coba lagi nanti.");
    }
});

// INPUT OTP
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
    let otpCode = "";
    otpInputs.forEach(input => otpCode += input.value);

    if (otpCode.length < 6) return alert("Isi kodenya sampai lengkap!");

    try {
        const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: userUid, otp: otpCode })
        });

        const data = await res.json();

        if (data.success) {
            statusDiv.innerText = "Login Berhasil! Mengalihkan...";
            statusDiv.style.color = "green";
            localStorage.setItem('admin_token', data.token);  
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 1500);
        } else {
            statusDiv.innerText = "Kode OTP Salah atau Kadaluwarsa.";
            statusDiv.style.color = "red";
        }
    } catch (err) {
        alert("Gagal verifikasi OTP.");
    }
});



