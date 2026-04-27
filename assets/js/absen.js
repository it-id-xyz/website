import { db, auth } from "./firebase.js";
import { collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import * as faceapi from "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js";
import { CONFIG } from "./config.js";

const APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL;
const TARGET_LAT = CONFIG.TARGET_LAT;
const TARGET_LNG = CONFIG.TARGET_LNG;
const TOLERANSI_METER = CONFIG.TOLERANSI_METER;

const menuUtama = document.getElementById('menu-utama');
const menuAbsen = document.getElementById('menu-absen');
const menuDaftar = document.getElementById('menu-daftar');

let streamAktif; \

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Admin Aktif:", user.email);
        
    } else {
        alert("Sistem terkunci! Admin wajib login dulu di halaman login.");
        window.location.href = "./login.html"; 
    }
});

// ==========================================
// 1. INISIALISASI AI
// ==========================================
async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log("AI Face Recognition Ready!");
}
loadModels();

// ==========================================
// 2. NAVIGASI MENU & KAMERA CONTROLLER
// ==========================================
function stopCamera() {
    if (streamAktif) {
        streamAktif.getTracks().forEach(track => track.stop());
    }
}

function switchMenu(showMenu) {
    stopCamera(); 
    menuUtama.classList.add('hidden');
    menuAbsen.classList.add('hidden');
    menuDaftar.classList.add('hidden');
    showMenu.classList.remove('hidden');
}

document.getElementById('btn-kembali-absen').addEventListener('click', () => switchMenu(menuUtama));
document.getElementById('btn-kembali-daftar').addEventListener('click', () => switchMenu(menuUtama));

// ==========================================
// 3.  ABSEN (GEOLOCATION + DETEKSI)
// ==========================================
const videoAbsen = document.getElementById('videoAbsen');
const pesanLokasi = document.getElementById('pesan-lokasi');
const btnScanAbsen = document.getElementById('btn-scan-absen');
const previewUser = document.getElementById('preview-user');

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

document.getElementById('btn-menu-absen').addEventListener('click', () => {
    switchMenu(menuAbsen);
    previewUser.classList.add('hidden');
    btnScanAbsen.classList.add('hidden');
    
    if (!navigator.geolocation) {
        pesanLokasi.innerHTML = "<span style='color:red'>Browser tidak support GPS!</span>";
        return;
    }

    pesanLokasi.innerText = "Mengecek Lokasi GPS...";
    navigator.geolocation.getCurrentPosition(async (position) => {
        const dist = getDistance(position.coords.latitude, position.coords.longitude, TARGET_LAT, TARGET_LNG);
        
        if (dist > TOLERANSI_METER) {
            pesanLokasi.innerHTML = `<span style="color:red">Di luar area sekolah! (Jarak: ${Math.round(dist)}m)</span>`;
        } else {
            pesanLokasi.innerHTML = `<span style="color:#10b981">Lokasi Valid (${Math.round(dist)}m). Menyalakan kamera...</span>`;
            
            try {
                streamAktif = await navigator.mediaDevices.getUserMedia({ video: true });
                videoAbsen.srcObject = streamAktif;
                btnScanAbsen.classList.remove('hidden');
            } catch (err) {
                pesanLokasi.innerHTML = `<span style="color:red">Gagal akses kamera: ${err.message}</span>`;
            }
        }
    }, () => {
        pesanLokasi.innerHTML = "<span style='color:red'>Izin lokasi (GPS) ditolak!</span>";
    });
});


btnScanAbsen.addEventListener('click', async () => {
    btnScanAbsen.textContent = "Menganalisa...";
    btnScanAbsen.disabled = true;

    const detections = await faceapi.detectSingleFace(videoAbsen).withFaceLandmarks().withFaceDescriptor();

    if (!detections) {
        alert("Wajah tidak terdeteksi! Posisikan wajah di tengah.");
        btnScanAbsen.textContent = "Deteksi Wajah";
        btnScanAbsen.disabled = false;
        return;
    }

    pesanLokasi.innerText = "Mencocokkan dengan Database...";
    const q = query(collection(db, "UID")); 
    const querySnapshot = await getDocs(q);
    const labeledDescriptors = [];

    querySnapshot.forEach((document) => {
        const data = document.data();
        if (data.FaceID && data.FaceID.length > 0) {
            const floatDescriptor = new Float32Array(data.FaceID);
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(data.nama || document.id, [floatDescriptor]));
        }
    });

    if (labeledDescriptors.length === 0) {
        alert("Database wajah masih kosong, daftar dulu bro!");
        btnScanAbsen.textContent = "Deteksi Wajah";
        btnScanAbsen.disabled = false;
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55); 
    const hasilMatch = faceMatcher.findBestMatch(detections.descriptor);

    if (hasilMatch && hasilMatch.label !== 'unknown') {
        pesanLokasi.innerHTML = `<span style="color:#10b981">Wajah Cocok: ${hasilMatch.label}!</span>`;
        const userQ = query(collection(db, "UID"), where("nama", "==", hasilMatch.label));
        const userSnap = await getDocs(userQ);
        
        let subMateri = "N/A", angkatan = "2024";
        if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            subMateri = userData.Sub || "N/A";
            angkatan = userData.Angkatan || "2024";
        }

        previewUser.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 8px; margin-bottom:10px;">
                <p>NAMA: <strong>${hasilMatch.label}</strong></p>
                <p>MATCH: ${Math.round((1 - hasilMatch.distance) * 100)}%</p>
            </div>
        `;
        previewUser.classList.remove('hidden');

        sendSpreadsheet(hasilMatch.label, subMateri, angkatan);
    } else {
        pesanLokasi.innerHTML = "<span style='color:red'>Wajah tidak dikenal!</span>";
        btnScanAbsen.textContent = "Coba Lagi";
        btnScanAbsen.disabled = false;
    }
});

async function sendSpreadsheet(namaAnggota, subMateri, angkatan) {
    const payload = {
        nama: namaAnggota,
        jarak: "Terdeteksi di Lokasi",
        status: "Hadir",
        sub_materi: subMateri, 
        angkatan: angkatan
    };

    try {
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });
        alert(`Sip! Absen atas nama ${namaAnggota} berhasil dikirim ke Spreadsheet.`);
        location.reload();
    } catch (err) {
        alert("Waduh, absen berhasil tapi gagal kirim ke Spreadsheet!");
        btnScanAbsen.disabled = false;
    }
}

// ==========================================
// 4. DAFTAR WAJAH BARU
// ==========================================
const videoDaftar = document.getElementById('videoDaftar');
const previewDaftar = document.getElementById('previewDaftar');
const canvasDaftar = document.getElementById('canvasDaftar');
const btnStartCameraDaftar = document.getElementById('btnStartCameraDaftar');
const btnCaptureDaftar = document.getElementById('btnCaptureDaftar');
const btnConfirmDaftar = document.getElementById('btnConfirmDaftar');
const btnRetakeDaftar = document.getElementById('btnRetakeDaftar');

let finalImageBase64 = "";

document.getElementById('btn-menu-daftar').addEventListener('click', () => {
    switchMenu(menuDaftar);
});

btnStartCameraDaftar.addEventListener('click', async () => {
    try {
        streamAktif = await navigator.mediaDevices.getUserMedia({ video: true });
        videoDaftar.srcObject = streamAktif;
        
        videoDaftar.classList.remove('hidden');
        btnStartCameraDaftar.classList.add('hidden');
        btnCaptureDaftar.classList.remove('hidden');
    } catch (err) {
        alert("Gagal akses kamera: " + err.message);
    }
});

btnCaptureDaftar.addEventListener('click', () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value;

    if (!nama || !id) {
        alert("Isi Nama dan ID dulu bro!");
        return;
    }

    canvasDaftar.width = videoDaftar.videoWidth;
    canvasDaftar.height = videoDaftar.videoHeight;
    canvasDaftar.getContext('2d').drawImage(videoDaftar, 0, 0, canvasDaftar.width, canvasDaftar.height);
    
    finalImageBase64 = canvasDaftar.toDataURL('image/jpeg');
    
    videoDaftar.classList.add('hidden');
    previewDaftar.src = finalImageBase64;
    previewDaftar.classList.remove('hidden');
    
    btnCaptureDaftar.classList.add('hidden');
    btnConfirmDaftar.classList.remove('hidden');
    btnRetakeDaftar.classList.remove('hidden');
});

btnRetakeDaftar.addEventListener('click', () => {
    previewDaftar.classList.add('hidden');
    videoDaftar.classList.remove('hidden');
    
    btnConfirmDaftar.classList.add('hidden');
    btnRetakeDaftar.classList.add('hidden');
    btnCaptureDaftar.classList.remove('hidden');
});

btnConfirmDaftar.addEventListener('click', async () => {
    const nama = document.getElementById('namaUser').value;
    const id = document.getElementById('idUser').value; 
    
    btnConfirmDaftar.disabled = true;
    btnConfirmDaftar.textContent = "Menganalisa...";

    const detections = await faceapi.detectSingleFace(previewDaftar).withFaceLandmarks().withFaceDescriptor();
    
    if (!detections) {
        alert("Wajah nggak kedeteksi di foto! Coba foto ulang di tempat terang.");
        btnConfirmDaftar.disabled = false;
        btnConfirmDaftar.textContent = "Simpan ke Database";
        return;
    }
    
    const faceDescriptor = Array.from(detections.descriptor);
    
    try {
        btnConfirmDaftar.textContent = "Menyimpan...";
        const q = query(collection(db, "UID"), where("ID", "==", id));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert(`Data dengan ID ${id} tidak ditemukan. Minta admin masukin datanya dulu bro!`);
            btnConfirmDaftar.disabled = false;
            btnConfirmDaftar.textContent = "Simpan ke Database";
            return;
        }

        querySnapshot.forEach(async (document) => {
            const userRef = doc(db, "UID", document.id);
            await updateDoc(userRef, { FaceID: faceDescriptor, nama: nama });
            
            alert(`Mantap! FaceID atas nama ${nama} berhasil disimpan.`);
            location.reload(); 
        });

    } catch (error) {
        console.error("Error: ", error);
        alert("Gagal simpan ke database. Cek console bro.");
        btnConfirmDaftar.disabled = false;
        btnConfirmDaftar.textContent = "Simpan ke Database";
    }
});
