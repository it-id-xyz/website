// Import Firebase SDK (Modular V9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. SETUP FIREBASE LU DI SINI
const firebaseConfig = {
    apiKey: "API_KEY_LU",
    authDomain: "PROJECT_LU.firebaseapp.com",
    projectId: "PROJECT_LU",
    storageBucket: "PROJECT_LU.appspot.com",
    messagingSenderId: "SENDER_LU",
    appId: "APP_ID_LU"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elemen DOM
const video = document.getElementById('videoElement');
const preview = document.getElementById('previewImage');
const canvas = document.getElementById('canvasElement');
const btnStartCamera = document.getElementById('btnStartCamera');
const btnCapture = document.getElementById('btnCapture');
const btnConfirm = document.getElementById('btnConfirm');
const btnRetake = document.getElementById('btnRetake');

let stream;
let finalImageBase64 = "";

// Sembunyikan elemen yang belum butuh di awal
preview.classList.add('hidden');
btnCapture.classList.add('hidden');
btnConfirm.classList.add('hidden');
btnRetake.classList.add('hidden');

// 2. BUKA KAMERA
btnStartCamera.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        
        btnStartCamera.classList.add('hidden');
        btnCapture.classList.remove('hidden');
    } catch (err) {
        alert("Gagal akses kamera bro! Pastikan dapet izin.");
    }
});

// 3. SCAN WAJAH (CAPTURE)
btnCapture.addEventListener('click', () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value;

    if (!nama || !id) {
        alert("Isi Nama dan ID dulu bro!");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    finalImageBase64 = canvas.toDataURL('image/jpeg');
    
    // Switch tampilan dari video ke hasil foto
    video.classList.add('hidden');
    preview.src = finalImageBase64;
    preview.classList.remove('hidden');
    
    btnCapture.classList.add('hidden');
    btnConfirm.classList.remove('hidden');
    btnRetake.classList.remove('hidden');
});

// 4. ULANGI FOTO (RETAKE)
btnRetake.addEventListener('click', () => {
    preview.classList.add('hidden');
    video.classList.remove('hidden');
    
    btnConfirm.classList.add('hidden');
    btnRetake.classList.add('hidden');
    btnCapture.classList.remove('hidden');
});

// 5. CONFIRM & UPDATE FIRESTORE
btnConfirm.addEventListener('click', async () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value; // Ini dipake buat query (contoh: NIS)

    // ======= PROSES DESCRIPTOR =======
    // Di sini lu jalankan model lu (misal face-api.js) buat ngekstrak wajah 
    // dari 'finalImageBase64' jadi face descriptor (biasanya array 128 angka).
    // Sementara gua pake dummy data buat simulasi:
    const faceDescriptor = [0.11, -0.22, 0.33, 0.44]; // Ganti dengan hasil ekstrak asli lu
    // ==================================

    try {
        btnConfirm.disabled = true;
        btnConfirm.textContent = "Menyimpan...";

        // Cari dokumen di collection "siswa" yang "nis"-nya sama dengan input
        const q = query(collection(db, "siswa"), where("nis", "==", id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert(`Bro, data dengan NIS ${id} gak ketemu di Firestore! Pastikan udah didaftarin dari Google Sheets/Admin.`);
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Confirm & Simpan ke Firestore";
            return;
        }

        // Kalau ketemu, update field FaceID yang kosong
        querySnapshot.forEach(async (document) => {
            const userRef = doc(db, "siswa", document.id);
            
            await updateDoc(userRef, {
                FaceID: faceDescriptor // Simpan array descriptor ke field ini
            });
            
            alert(`Sip! FaceID atas nama ${nama} berhasil disave ke Firestore.`);
            location.reload(); // Refresh halaman kalau udah beres
        });

    } catch (error) {
        console.error("Error updating document: ", error);
        alert("Waduh, gagal simpan ke Firestore. Cek console bro.");
        btnConfirm.disabled = false;
        btnConfirm.textContent = "Confirm & Simpan ke Firestore";
    }
});
