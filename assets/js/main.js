import { auth, db } from "./firebase.js";
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, MicrosoftAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const ggprovider = new GoogleAuthProvider();
const fbProvider = new FacebookAuthProvider();
const ghProvider = new GithubAuthProvider();
const msProvider = new MicrosoftAuthProvider();

document.getElementById("btn-login-gg").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, ggprovider);
        alert("Login berhasil");
    } catch (err) {
        alert("Login gagal");
    }
});
document.getElementById("btn-login-fb").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, fbProvider);
        alert("Login berhasil");
    } catch (err) {
        alert("Login gagal");
    }
});
document.getElementById("btn-login-gh").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, ghProvider);
        alert("Login berhasil");
    } catch (err) {
        alert("Login gagal");
    }
});
document.getElementById("btn-login-ms").addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, msProvider);
        alert("Login berhasil");
    } catch (err) {
        alert("Login gagal");
    }
});
const user = auth.currentUser;
if (!user) {
    document.getElementById('form-input').style.display = 'none'
} 
const ul = {
    statusUser: document.getElementById('project-status'),
    btnSubmit: document.getElementById('btn-submit')
}

const getData = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("Login Google dulu.");
        return;
    }

    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const bidang = document.getElementById('bidang').value;

    const honeypot = document.getElementById('honeypot').value;
    if (honeypot !== "") return;

    if (!nama || !kelas || !whatsapp || !bidang)
        return alert("Isi semua data");

    try {
        ul.btnSubmit.innerText = "Loading...";
        ul.btnSubmit.disabled = true;

        const docRef = await addDoc(collection(db, "regist"), {
            uid: user.uid,
            nama,
            kelas,
            email: user.email,
            whatsapp,
            bidang,
            status: "pending",
            waAttempts: 0,
            lastWaSentAt: null,
            createdAt: serverTimestamp()
        });
        localStorage.setItem("it_reg_id", docRef.id);
        window.location.href = "../succes.html";
    } catch (err) {
        ul.btnSubmit.innerText = "Daftar Sekarang";
        ul.btnSubmit.disabled = false;
        alert(err.message);
    }
};
ul.btnSubmit.addEventListener("click", getData);




