import { db } from "./firebase.js"
import { addDoc, getDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const reg = (redirectUrl) => {
    const data = localStorage.getItem("role");
    if (data !== null) {
        console.log('Kamu sudah daftar, mengalihkan...');
        window.location.href = redirectUrl;
    }
}

reg('succes.html');
const ul = {
    statusUser: document.getElementById('project-status'),
    btnSubmit: document.getElementById('btn-submit')
}

const getData = async (e) => {
    e.preventDefault();
    console.log("Tombol diklik, memulai proses...");
    const q = query(collection(db, "regist"), where("whatsapp", "==", whatsapp));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        alert("Nomor WA ini sudah terdaftar! Nggak bisa daftar dua kali.");
        window.location.href = 'succes.html';
        return;
    }

    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;
    const email = document.getElementById('email').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const bidang = document.getElementById('bidang').value;

    const honeypot = document.getElementById('honeypot').value;
    if (honeypot !== "") {
        console.log("Bot detected!");
        alert("Terjadi kesalahan koneksi, coba lagi."); 
        return;
    }
           
    if (!nama || !kelas || !email || !whatsapp || !bidang ) return alert('Harap di isi semua data');
    try {
        ul.btnSubmit.innerText = "Loading...";
        ul.btnSubmit.disabled = true;
        const docRef = await addDoc(collection(db, "regist"), {
            nama: nama,
            kelas: kelas,
            email: email,
            whatsapp: whatsapp,
            bidang: bidang,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        console.log("3. Berhasil masuk! ID:", docRef.id);

        localStorage.setItem("it_reg_id", docRef.id);
        localStorage.setItem("role", "visitor");

        window.location.href = '../succes.html';
    } catch (err) {
        ul.btnSubmit.innerText = "Daftar Sekarang";
        ul.btnSubmit.disabled = false;
        console.log("Gagal daftar: ", err);
        alert("Terjadi kesalahan: " + err.message);
    }
}
ul.btnSubmit.addEventListener("click", getData);






















