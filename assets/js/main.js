import { db } from "./firebase.js"
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

 const reg = (redirectUrl = './succes.html') => {
        const data = localStorage.getItem("role");
        if (data !== null ) {
            console.log('kamu sudah daftar')
            window.location.href = reg;
        }
 }
redirectUrl('./form.html');
const ul = {
    statusUser: document.getElementById('project-status'),
    btnSubmit: document.getElementById('btn-submit')
}

const getData = async (e) => {
    e.preventDefault();
   
    console.log("Tombol diklik, memulai proses...");
    const nama = document.getElementById('nama').value;
    const kelas = document.getElementById('kelas').value;
    const email = document.getElementById('email').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const bidang = document.getElementById('bidang').value;

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















