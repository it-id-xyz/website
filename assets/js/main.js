import { db } from "./firebase.js"
import { addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ul = {
    statusUser: document.getElementById('project-status'),
    btnSubmit: document.getElementById('btn-submit')
}

async function getData() {
    const data = {
        nama: document.getElementById('nama').value,
        kelas: document.getElementById('kelas').value,
        email: document.getElementById('email').value,
        whatsapp: document.getElementById('whatsapp').value,
        bidang: document.getElementById('bidang').value
    }

    if (data.nama || data.kelas || data.email || data.whatsapp || data.bidang ) return alert('Harap di isi semua data');
    try {
        const docRef = await addDoc(collection(db, "regist"), {
            nama: data.nama,
            kelas: data.kelas,
            email: data.email,
            whatsapp: data.whatsapp,
            bidang: data.bidang,
            status: 'pending..',
            createdAt: serverTimestamp()
        });

        localStorage.setItem("it_reg_id", docRef.id);
        localStorage.setItem("role", "visitor");

        window.location.href = 'succes.html';
    } catch {
        console.log("Gagal daftar: " + err.message);
    }
}
ul.btnSubmit.addEventListener("click", getData());

