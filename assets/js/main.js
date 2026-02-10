import { db } from "./firebase.js"
import { addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ul = {
    statusUser: document.getElementById('project-status'),
    btnSubmit: document.getElementById('btn-submit')
}

const getData = async () => {
    e.preventDefault();
    console.log("Tombol diklik, memulai proses...");
    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;
    const email = document.getElementById('email').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const bidang = document.getElementById('bidang').value;

    if (!nama || !kelas || !email || !whatsapp || !bidang ) return alert('Harap di isi semua data');
    try {
        const docRef = await addDoc(collection(db, "regist"), {
            nama: nama,
            kelas: kelas,
            email: email,
            whatsapp: whatsapp,
            bidang: bidang,
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
ul.btnSubmit.addEventListener("click", getData);






