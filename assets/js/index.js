import { auth } from "./firebase.js";
import { 
    onAuthStateChanged, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, 
    GithubAuthProvider, OAuthProvider, signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==========================================
// 2. SETUP PROVIDER SOSIAL MEDIA
// ==========================================
const ggprovider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();
fbProvider.addScope('email');
const ghProvider = new GithubAuthProvider();
ghProvider.addScope('user:email');
const msProvider = new OAuthProvider('microsoft.com');
msProvider.addScope('openid');
msProvider.addScope('profile');
msProvider.addScope('email');

// ==========================================
// 3. EVENT LISTENER TOMBOL SOSMED
// ==========================================
document.getElementById("btn-login-gg")?.addEventListener("click", async () => {
    try { await signInWithPopup(auth, ggprovider); window.location.href = "index.html"; } catch (err) { console.error("Google Login Error:", err); }
});

document.getElementById("btn-login-fb")?.addEventListener("click", async () => {
    try { await signInWithPopup(auth, fbProvider); window.location.href = "index.html"; } catch (err) { console.error("FB Login Error:", err); }
});

document.getElementById("btn-login-gh")?.addEventListener("click", async () => {
    try { await signInWithPopup(auth, ghProvider); window.location.href = "index.html"; } catch (err) { console.error("Github Login Error:", err); }
});

document.getElementById("btn-login-ms")?.addEventListener("click", async () => {
    try { 
        msProvider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, msProvider); 
        window.location.href = "index.html";
    } catch (err) { console.error("Microsoft Login Error:", err); }
});

// ==========================================
// 4. TOMBOL ADMIN (Pakai Email/Pass)
// ==========================================
const btnLoginAdmin = document.getElementById('btn-login-admin');
const emailInput = document.getElementById('email-admin');
const passInput = document.getElementById('password-admin');
const pesanUI = document.getElementById('pesan-login');

if (btnLoginAdmin) {
    btnLoginAdmin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passInput.value;

        if (!email || !password) return tampilkanPesan("Isi Email & Password dulu bro!", "red");

        btnLoginAdmin.disabled = true;
        btnLoginAdmin.textContent = "Loading...";

        try {
            await signInWithEmailAndPassword(auth, email, password);
            tampilkanPesan("Login Admin Sukses!", "#10b981");
            setTimeout(() => { window.location.href = ",/admin.html"; }, 1500);
        } catch (error) {
            tampilkanPesan("Gagal login: " + error.message, "#ef4444");
            btnLoginAdmin.disabled = false;
            btnLoginAdmin.textContent = "Masuk ke Sistem";
        }
    });
}

function tampilkanPesan(teks, warna) {
    if(!pesanUI) return;
    pesanUI.style.display = "block";
    pesanUI.style.color = warna;
    pesanUI.innerText = teks;
}
